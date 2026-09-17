import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  ViewChild,
  type AfterViewInit,
  type ElementRef,
  type OnChanges,
  type OnDestroy,
  type OnInit,
  type SimpleChanges,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { SafeResourceUrl } from '@angular/platform-browser';

import {  execute } from '../helpers/executables';

const LOG = '[Spotcheck:ionic-webview]';

function previewUri(uri: string, max = 96): string {
  if (!uri) return '(empty)';
  return uri.length <= max ? uri : `${uri.slice(0, max)}…`;
}

function injectIonBridgeStubs(contentWindow: Window): void {
  const noop = (): void => {
    void 0;
  };
  try {
    const iw = contentWindow as Window &
      Record<string, unknown> & {
        SsAndroidSdk?: { shareData: () => void; sendPartialSubmissionData: () => void };
        Android?: { onMessageReceive: () => void };
        webkit?: { messageHandlers: Record<string, { postMessage: () => void }> };
        flutterSpotCheckData?: { postMessage: (data?: unknown) => void };
      };
    if (!iw.SsAndroidSdk) {
      iw.SsAndroidSdk = {
        shareData: noop,
        sendPartialSubmissionData: noop,
      };
    }
    if (!iw.Android) {
      iw.Android = { onMessageReceive: noop };
    }
    if (!iw.webkit) {
      iw.webkit = {
        messageHandlers: {
          surveyResponse: { postMessage: noop },
          spotCheckData: { postMessage: noop },
          flutterSpotCheckData: { postMessage: noop },
        },
      };
    }
    if (!iw.flutterSpotCheckData) {
      iw.flutterSpotCheckData = { postMessage: noop };
    }
  } catch {
    /* ignore */
  }
}

@Component({
  selector: 'ss-webview-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngStyle]="containerStyle">
      <iframe
        #iframeRef
        *ngIf="safeUri"
        [src]="safeUri"
        [attr.allow]="iframeAllow"
        allowfullscreen
        [ngStyle]="iframeStyle"
        style="border: 0; display: block;"
        (load)="onLoad($event)"
      ></iframe>
    </div>
  `,
})
export class WebviewRendererComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() resolvedProps: Record<string, unknown> = {};

  @ViewChild('iframeRef') iframeRef?: ElementRef<HTMLIFrameElement>;

  safeUri: SafeResourceUrl | null = null;
  iframeAllow =
    'camera; microphone; geolocation; display-capture; autoplay; clipboard-read; clipboard-write; fullscreen';

  containerStyle: Record<string, string> = {};
  iframeStyle: Record<string, string> = {};

  private messageListener = (ev: MessageEvent) => this.handleWindowMessage(ev);

  /**
   * Set from each iframe `load` event target. `@ViewChild` may be unset when `load` fires
   * for `*ngIf`-created content, so handlers must not rely on `iframeRef` alone in `onLoad`.
   */
  private currentIframeEl: HTMLIFrameElement | null = null;

  /** Last URI string used for `safeUri`; avoids new `SafeResourceUrl` every `applyProps` (prevents iframe churn). */
  private lastTrustedUriString: string | null = null;

  readonly iframeInjectAdapter = {
    injectJavaScript: (js: string): void => {
      try {
        const el = this.getActiveIframe();
        const win = el?.contentWindow;
        const meta = {
          hasEl: !!el,
          isConnected: el?.isConnected ?? false,
          hasWin: !!win,
          jsChars: typeof js === 'string' ? js.length : 0,
        };
        if (!el) {
          console.warn(`${LOG} injectJavaScript skipped`, { ...meta, reason: 'no-element' });
          return;
        }
        if (!el.isConnected) {
          console.warn(`${LOG} injectJavaScript skipped`, { ...meta, reason: 'element-detached' });
          return;
        }
        if (!win) {
          console.warn(`${LOG} injectJavaScript skipped`, { ...meta, reason: 'no-contentWindow' });
          return;
        }
        console.info(`${LOG} injectJavaScript eval`, meta);
        (win as unknown as { eval: (code: string) => void }).eval(js);
      } catch (err) {
        console.error(`${LOG} injectJavaScript failed`, err);
      }
    },
  };

  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.applyProps();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resolvedProps']) {
      this.applyProps();
    }
  }

  ngAfterViewInit(): void {
    window.addEventListener('message', this.messageListener);
    queueMicrotask(() => {
      const iframe = this.getActiveIframe();
      console.info(`${LOG} afterViewInit`, {
        hasSafeUri: !!this.safeUri,
        iframeInDom: !!iframe,
        iframeConnected: iframe?.isConnected ?? false,
        iframeBox: iframe
          ? { w: iframe.clientWidth, h: iframe.clientHeight, offsetW: iframe.offsetWidth }
          : null,
        isChat: !!this.resolvedProps['isChat'],
        container: this.containerStyle,
      });
    });
    void this.notifyRefCallback();
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageListener);
    this.currentIframeEl = null;
    this.lastTrustedUriString = null;
  }

  /** Prefer iframe from the latest `load` event; fall back to `@ViewChild` (e.g. afterViewInit). */
  private getActiveIframe(): HTMLIFrameElement | null {
    if (this.currentIframeEl) {
      if (!this.currentIframeEl.isConnected) {
        console.warn(`${LOG} getActiveIframe: dropped stale currentIframeEl (detached)`, {
          hadSrc: !!this.currentIframeEl.src,
        });
        this.currentIframeEl = null;
      } else {
        return this.currentIframeEl;
      }
    }
    const fromChild = this.iframeRef?.nativeElement ?? null;
    if (fromChild && !fromChild.isConnected) {
      console.warn(`${LOG} getActiveIframe: ViewChild iframe not connected`);
      return null;
    }
    return fromChild;
  }

  private applyProps(): void {
    const p = this.resolvedProps;
    const uri =
      (p['source'] as { uri?: string } | undefined)?.uri ??
      (p['uri'] as string | undefined) ??
      '';
    const backendCanShow = p['canShow'] !== false;
    const canShow = uri ? true : backendCanShow;
    let safeUriUpdated = false;
    if (uri) {
      if (uri !== this.lastTrustedUriString) {
        this.lastTrustedUriString = uri;
        this.currentIframeEl = null;
        this.safeUri = this.sanitizer.bypassSecurityTrustResourceUrl(uri);
        safeUriUpdated = true;
      }
    } else {
      this.lastTrustedUriString = null;
      this.safeUri = null;
      this.currentIframeEl = null;
      safeUriUpdated = true;
    }
    const base = (p['style'] as Record<string, unknown>) || {};
    const cw = canShow ? '100%' : '0';
    const ch = canShow ? '100%' : '0';
    const cop = canShow ? '1' : '0';
    const hasUri = uri.length > 0;
    const resolveAxis = (v: unknown, fallback: string): string => {
      if (v === null || v === undefined) return fallback;
      if (v === 0 || v === '0') return hasUri ? '100%' : '0';
      return String(v);
    };
    const resolveOpacity = (v: unknown, fallback: string): string => {
      if (v === null || v === undefined) return fallback;
      if (v === 0 || v === '0') return hasUri ? '1' : '0';
      return String(v);
    };
    this.containerStyle = {
      width: resolveAxis(base['width'], cw),
      height: resolveAxis(base['height'], ch),
      opacity: resolveOpacity(base['opacity'], cop),
      overflow: 'hidden',
    };
    this.iframeStyle = {
      width: '100%',
      height: '100%',
    };
    const active = this.getActiveIframe();
    console.info(`${LOG} applyProps`, {
      uriPreview: previewUri(uri),
      hasUri,
      backendCanShow,
      canShow,
      safeUriUpdated,
      willRenderIframe: hasUri && !!this.safeUri,
      containerStyle: this.containerStyle,
      activeIframe: active
        ? {
            isConnected: active.isConnected,
            client: { w: active.clientWidth, h: active.clientHeight },
            offset: { w: active.offsetWidth, h: active.offsetHeight },
            hasContentWindow: !!active.contentWindow,
          }
        : null,
    });
  }

  async onLoad(ev: Event): Promise<void> {
    const raw = ev.target;
    if (!(raw instanceof HTMLIFrameElement)) {
      console.warn(`${LOG} iframe load: unexpected event target`, { raw });
      return;
    }
    const iframeEl = raw;

    // Skip the about:blank initial load that fires before Angular applies [src] binding.
    // Without this guard, isClassicLoading:false is dispatched too early, triggering
    // handleWebViewInjection which causes the schema's if-conditions to re-evaluate and
    // destroy/recreate this component before the real URL has loaded.
    const currentSrc = iframeEl.src || '';
    if (!currentSrc || currentSrc === 'about:blank') {
      console.info(`${LOG} iframe load: skipping blank initial load`, { src: currentSrc });
      return;
    }

    this.currentIframeEl = iframeEl;

    const isChat = !!this.resolvedProps['isChat'];
    const cw = iframeEl.contentWindow;
    console.info(`${LOG} iframe load event`, {
      isChat,
      hasIframeElement: true,
      isConnected: iframeEl.isConnected,
      hasContentWindow: !!cw,
      clientSize: { w: iframeEl.clientWidth, h: iframeEl.clientHeight },
      offsetSize: { w: iframeEl.offsetWidth, h: iframeEl.offsetHeight },
      srcPreview: previewUri(iframeEl.src || ''),
    });

    const runInject = (): void => {
      const win = iframeEl.contentWindow;
      if (!win) {
        return;
      }
      injectIonBridgeStubs(win);
      const cfg = this.resolvedProps['config'] as
        | { injectedJavaScript?: string }
        | undefined;
      const baseline = cfg?.injectedJavaScript;
      if (typeof baseline === 'string' && baseline.trim().length > 0) {
        this.iframeInjectAdapter.injectJavaScript(baseline);
      }
    };

    runInject();
    if (!cw) {
      queueMicrotask(() => {
        runInject();
        if (!iframeEl.contentWindow) {
          console.warn(`${LOG} iframe load: contentWindow still unavailable after microtask`);
        }
      });
    }

    await this.notifyRefCallback();
    // dispatchWrapper({
    //   webViewDetails: isChat
    //     ? { isChatLoading: false }
    //     : { isClassicLoading: false },
    // });
    const onLoad = this.resolvedProps['onLoad'] as (() => void) | undefined;
    onLoad?.();
  }

  private async notifyRefCallback(): Promise<void> {
    const el = this.getActiveIframe();
    const isChat = !!this.resolvedProps['isChat'];
    if (!el) {
      console.warn(`${LOG} refCallback skipped (iframe element not in DOM yet)`, {
        isChat,
        hasSafeUri: !!this.safeUri,
      });
      return;
    }
    console.info(`${LOG} refCallback`, {
      isChat,
      isConnected: el.isConnected,
      hasContentWindow: !!el.contentWindow,
      clientSize: { w: el.clientWidth, h: el.clientHeight },
    });
    const name = isChat
      ? 'webviewComponent.chatWebViewRefCallback'
      : 'webviewComponent.classicWebViewRefCallback';
    await execute(name, { ref: this.iframeInjectAdapter });
  }

  private handleWindowMessage(ev: MessageEvent): void {
    let data: unknown = ev.data;
    if (data !== null && typeof data === 'object' && !(data instanceof ArrayBuffer)) {
      try {
        data = JSON.stringify(data);
      } catch {
        data = String(data);
      }
    }
    void execute('webviewComponent.handleWebViewMessage', {
      event: { nativeEvent: { data } },
    });
  }
}
