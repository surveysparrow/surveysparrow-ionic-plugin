import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { NgIf, isPlatformBrowser } from '@angular/common';
import { GuardsCheckEnd, NavigationEnd, Router } from '@angular/router';
import { SsNodeComponent } from './spotchecks/components/builder.component';
import { componentStore, spotcheckStore } from './spotchecks/state/store';
import { dispatchWrapper, execute } from './spotchecks/helpers/executables';
import { captureP1Error } from './spotchecks/helpers/sentry';
import { setAppRunner } from './spotchecks/helpers/listener';
import { batched, guardedDetectChanges, hasCrashed, onCrash } from './spotchecks/helpers/render';
import type { BuilderContext, SchemaNode } from './spotchecks/helpers/binding';

// Path only: query or hash changes stay on the same screen.
const pathOf = (url: string) => (url || '').split(/[?#]/)[0];

// Only one <SpotCheck> renders; extra instances stay empty so they never touch the live page.
let owner: SpotCheck | null = null;

// Keyboard cover below this is browser chrome, not a keyboard.
const MIN_KEYBOARD_HEIGHT = 80;

// Place once at the app root: <SpotCheck />. One Angular codebase for web, Android and iOS.
@Component({
  selector: 'SpotCheck',
  standalone: true,
  imports: [NgIf, SsNodeComponent],
  styles: [':host { display: contents; }'],
  template: `
    <ss-node *ngIf="wrapperSchema" [node]="wrapperSchema" [ctx]="wrapperCtx"></ss-node>
    <ss-node *ngIf="buttonSchema && buttonReady" [node]="buttonSchema" [ctx]="buttonCtx"></ss-node>
  `,
})
export class SpotCheck implements OnInit, OnDestroy {
  wrapperSchema: SchemaNode | null = null;
  buttonSchema: SchemaNode | null = null;
  wrapperCtx: BuilderContext = {};
  buttonCtx: BuilderContext = {};
  buttonReady = false;

  private wrapperStyles: any = {
    overlayStyle: { position: 'fixed', height: 0, opacity: 0, zIndex: -999999, pointerEvents: 'none' },
    wrapperStyle: {},
  };
  private buttonStyles: any = {};
  private destroyed = false;
  private cleanups: Array<() => void> = [];
  private lastInjectionKey: any[] = [];
  private lastButtonKey: any[] = [];
  private lastPath: string | null = null;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router, { optional: true });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly webviewHandlers = {
    classicWebViewRefCallback: (ref: any) => execute('webviewComponent.classicWebViewRefCallback', { ref }),
    chatWebViewRefCallback: (ref: any) => execute('webviewComponent.chatWebViewRefCallback', { ref }),
    handleOnMessage: (event: any) => execute('webviewComponent.handleWebViewMessage', { event }),
    handleOnError: (error: any) => execute('webviewComponent.handleWebViewError', { error }),
  };

  private readonly buttonHandlers = {
    handleSpotCheckButtonPress: () => execute('spotCheckButton.handleSpotCheckButtonPress'),
    handleSideTabLayout: (event: any) => execute('spotCheckButton.handleSideTabLayout', { event }),
  };

  private readonly scheduleRender = batched(() => {
    if (!this.destroyed) this.render();
  });

  private readonly scheduleWrapperStyles = batched(() => {
    if (this.destroyed) return;
    execute('wrapper.getWrapperStyles', {
      screenHeight: window.innerHeight,
      screenWidth: window.innerWidth,
      setStyles: (styles: any) => {
        this.wrapperStyles = styles;
        this.scheduleRender();
      },
    });
  });

  ngOnInit(): void {
    // Server render (SSR) or a second instance: render nothing.
    if (!this.isBrowser || owner) return;
    owner = this;
    // App callbacks run inside Angular so the app's own UI updates.
    setAppRunner((fn) => this.zone.run(fn));
    this.cleanups.push(spotcheckStore.subscribe(() => this.onStateChange()));
    this.cleanups.push(componentStore.subscribe(() => this.onStateChange()));
    this.cleanups.push(onCrash(() => this.hideAfterCrash()));
    this.watchWindow();
    this.watchRouter();
    this.onStateChange();
  }

  ngOnDestroy(): void {
    if (owner === this) owner = null;
    this.destroyed = true;
    this.cleanups.forEach((cleanup) => cleanup());
  }

  // Same triggers as the other SDKs' Wrapper / WebViewComponent / SpotCheckButton effects.
  private onStateChange(): void {
    const state = spotcheckStore.getState().SpotCheckState;
    const { webViewDetails, spotCheckDetails } = state;

    this.scheduleWrapperStyles();

    const injectionKey = [webViewDetails.isChatLoading, webViewDetails.isClassicLoading, webViewDetails.webViewInjectionData];
    if (injectionKey.some((value, i) => value !== this.lastInjectionKey[i])) {
      this.lastInjectionKey = injectionKey;
      execute('webviewComponent.handleWebViewInjection');
    }

    const buttonKey = [spotCheckDetails.spotCheckButtonConfig, spotCheckDetails.isSpotCheckButton, spotCheckDetails.sideTabButtonWidth];
    if (buttonKey.some((value, i) => value !== this.lastButtonKey[i])) {
      this.lastButtonKey = buttonKey;
      execute('spotCheckButton.getSpotCheckButtonStyles').then((result) => {
        if (!result) return;
        this.buttonStyles = result;
        this.scheduleRender();
      });
    }

    this.scheduleRender();
  }

  private render(): void {
    if (hasCrashed()) return;
    const state = spotcheckStore.getState().SpotCheckState;
    const componentState = componentStore.getState().componentState;
    const schemas = componentState.isLoaded ? componentState.schemas || {} : {};

    this.wrapperSchema = schemas.wrapper || null;
    this.buttonSchema = schemas.spotCheckButton || null;
    this.wrapperCtx = {
      state,
      styles: this.wrapperStyles,
      slots: {
        children: {
          schema: schemas.webviewComponent || null,
          context: { state, handlers: this.webviewHandlers },
        },
      },
    };
    this.buttonCtx = { state, styles: this.buttonStyles, handlers: this.buttonHandlers };
    // Wait for styles so the button never renders unstyled for a frame.
    this.buttonReady = Object.keys(this.buttonStyles || {}).length > 0;
    guardedDetectChanges(this.cdr, 'render');
  }

  // After a failed draw, SpotCheck renders nothing for the rest of the session (RN error boundary parity).
  private hideAfterCrash(): void {
    this.wrapperSchema = null;
    this.buttonSchema = null;
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  // Screen size and the part of it the on-screen keyboard covers.
  private watchWindow(): void {
    const vv: any = (window as any).visualViewport;
    const onResize = () => {
      let keyboard = 0;
      if (vv) keyboard = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      if (keyboard < MIN_KEYBOARD_HEIGHT) keyboard = 0;
      const current = spotcheckStore.getState().SpotCheckState.spotCheckDetails.keyBoardHeight || 0;
      if (keyboard !== current) dispatchWrapper({ spotCheckDetails: { keyBoardHeight: keyboard } });
      else this.scheduleWrapperStyles();
    };
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', onResize);
      vv?.addEventListener('resize', onResize);
      vv?.addEventListener('scroll', onResize);
    });
    this.cleanups.push(() => {
      window.removeEventListener('resize', onResize);
      vv?.removeEventListener('resize', onResize);
      vv?.removeEventListener('scroll', onResize);
    });
  }

  // Leaving a screen closes its spotcheck. GuardsCheckEnd comes after guards and redirects
  // (a blocked navigation keeps the survey) and before the new page's trackScreen.
  private watchRouter(): void {
    if (!this.router) return;
    this.lastPath = this.router.navigated ? pathOf(this.router.url) : null;
    const subscription = this.router.events.subscribe((event) => {
      try {
        if (event instanceof GuardsCheckEnd && event.shouldActivate) {
          const next = pathOf(event.urlAfterRedirects);
          if (this.lastPath !== null && next !== this.lastPath) {
            execute('handleNavigationChange');
          }
          this.lastPath = next;
        } else if (event instanceof NavigationEnd) {
          this.lastPath = pathOf(event.urlAfterRedirects);
        }
      } catch (error: any) {
        captureP1Error(error, 'GENERAL', { action: 'navigationListener', errorMessage: error?.message });
      }
    });
    this.cleanups.push(() => subscription.unsubscribe());
  }
}
