import {
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
  forwardRef,
} from '@angular/core';
import { NgFor, NgIf, NgStyle, NgSwitch, NgSwitchCase } from '@angular/common';
import { componentStore, spotcheckStore } from '../state/store';
import { execute } from '../helpers/executables';
import { SurveyPage } from '../helpers/survey-page';
import { batched } from '../helpers/render';
import {
  BuilderContext,
  SchemaNode,
  SlotContent,
  evaluateCondition,
  resolveBinding,
  toCss,
} from '../helpers/binding';

// Reports the element's untransformed width like RN onLayout ({ nativeEvent: { layout } }).
@Directive({ selector: '[ssLayout]', standalone: true })
export class LayoutDirective implements OnInit, OnDestroy {
  @Output() ssLayout = new EventEmitter<any>();
  private observer?: ResizeObserver;
  private last = '';

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngOnInit(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.observer = new ResizeObserver(() => {
        const node = this.el.nativeElement;
        const layout = { x: node.offsetLeft, y: node.offsetTop, width: node.offsetWidth, height: node.offsetHeight };
        const key = `${layout.width}x${layout.height}`;
        if (key === this.last) return;
        this.last = key;
        this.ssLayout.emit({ nativeEvent: { layout } });
      });
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

// Hosts one survey page; mirrors the RN WebViewRenderer (hidden pages stay 1x1 off-screen and keep loading).
@Component({
  selector: 'ss-webview-renderer',
  standalone: true,
  template: '',
  host: { '[style]': 'hostStyle' },
})
export class WebViewRendererComponent implements OnChanges, OnDestroy {
  @Input() uri = '';
  @Input() canShow = false;
  @Input() onMessage?: (event: any) => void;
  @Input() onError?: (error: any) => void;
  @Input() refCallback?: (ref: any) => void;

  hostStyle = '';
  private page?: SurveyPage;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    this.hostStyle = this.canShow
      ? 'display:block;position:relative;width:100%;height:100%;'
      : 'display:block;position:absolute;left:-1000px;top:0;width:1px;height:1px;opacity:0;overflow:hidden;';
    if (!this.uri) return;
    if (!this.page) {
      this.page = new SurveyPage(this.el.nativeElement, {
        onMessage: (data) => this.onMessage?.({ nativeEvent: { data } }),
        onError: (error) => this.onError?.(error),
        getPageScript: () => functionConfig().webViewScript || '',
      });
      this.refCallback?.(this.page);
    }
    this.page.load(this.uri);
  }

  ngOnDestroy(): void {
    this.refCallback?.(null);
    this.page?.destroy();
  }
}

const functionConfig = () => componentStore.getState().componentState?.config || {};

// Renders one backend schema node as HTML (same node rules as the other SDKs' Builder).
@Component({
  selector: 'ss-node',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIf, NgFor, NgStyle, NgSwitch, NgSwitchCase, LayoutDirective, WebViewRendererComponent,
    forwardRef(() => CloseButtonComponent),
  ],
  styles: [`
    ss-node, ss-close-button { display: contents; }
    .ss-node-box, .ss-node-pressable, .ss-node-text, .ss-node-image, .ss-node-svg { box-sizing: border-box; }
    .ss-node-pressable { -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
    .ss-node-pressable:active { opacity: 0.6; }
    .ss-node-pressable:focus { outline: none; }
  `],
  template: `
    <ng-container *ngIf="visible" [ngSwitch]="kind">
      <ng-container *ngSwitchCase="'slot'">
        <ss-node *ngIf="slot?.schema" [node]="slot!.schema!" [ctx]="slot!.context"></ss-node>
      </ng-container>
      <div *ngSwitchCase="'Box'" class="ss-node-box" [attr.data-ss-role]="role" [ngStyle]="css">
        <ss-node *ngFor="let child of children; trackBy: byIndex" [node]="child" [ctx]="ctx"></ss-node>
      </div>
      <div *ngSwitchCase="'Pressable'" class="ss-node-pressable" role="button" tabindex="0"
        [attr.data-ss-role]="role" [attr.aria-label]="props['ariaLabel'] || null" [ngStyle]="css"
        (click)="press($event)" (keydown.enter)="press($event)" (ssLayout)="layout($event)">
        <ss-node *ngFor="let child of children; trackBy: byIndex" [node]="child" [ctx]="ctx"></ss-node>
      </div>
      <span *ngSwitchCase="'Text'" class="ss-node-text" [ngStyle]="css">{{ content }}</span>
      <img *ngSwitchCase="'Image'" class="ss-node-image" [attr.data-ss-role]="role" [src]="props['src']" [ngStyle]="css" alt="" />
      <img *ngSwitchCase="'SvgXml'" class="ss-node-svg" [src]="svgSrc" [ngStyle]="css" alt="" />
      <ss-close-button *ngSwitchCase="'CloseButton'"></ss-close-button>
      <ss-webview-renderer *ngSwitchCase="'WebViewRenderer'"
        [attr.data-ss-webview]="node.meta?.['webViewType']"
        [uri]="props['uri']" [canShow]="props['canShow']" [onMessage]="props['onMessage']"
        [onError]="props['onError']" [refCallback]="props['ref']"></ss-webview-renderer>
    </ng-container>
  `,
})
export class SsNodeComponent implements OnChanges {
  @Input() node!: SchemaNode;
  @Input() ctx: BuilderContext = {};

  visible = false;
  kind = '';
  role: string | null = null;
  props: Record<string, any> = {};
  css: Record<string, string> | null = null;
  content: any = null;
  slot: SlotContent | null = null;
  svgSrc = '';
  children: SchemaNode[] = [];

  // Binding results are computed once per render so templates see stable values.
  ngOnChanges(): void {
    const node = this.node;
    const ctx = this.ctx || {};
    this.slot = null;
    if (!node) {
      this.visible = false;
      return;
    }
    if (node.slot) {
      this.kind = 'slot';
      this.slot = ctx.slots?.[node.slot] || null;
      this.visible = Boolean(this.slot);
      return;
    }
    this.visible = node.if === undefined || evaluateCondition(node.if, ctx);
    if (!this.visible) return;
    this.kind = node.type || '';
    this.role = (node.meta?.componentRole as string) || null;
    this.props = node.props ? resolveBinding(node.props, ctx) || {} : {};
    this.css = toCss(this.props['style']);
    this.content = node.content !== undefined ? resolveBinding(node.content, ctx) : null;
    this.children = node.children || [];
    if (this.kind === 'SvgXml') {
      const xml = typeof this.props['xml'] === 'string' ? this.props['xml'] : '';
      // As an image, so markup in the icon can never run script.
      this.svgSrc = xml ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}` : '';
    }
  }

  byIndex(index: number): number {
    return index;
  }

  press(event: Event): void {
    event.stopPropagation();
    this.props['onPress']?.(event);
  }

  layout(event: any): void {
    this.props['onLayout']?.(event);
  }
}

// Backend-driven close button (schema closeButton + closeButton.getCloseButtonStyles).
@Component({
  selector: 'ss-close-button',
  standalone: true,
  imports: [NgIf, SsNodeComponent],
  template: `<ss-node *ngIf="schema" [node]="schema" [ctx]="ctx"></ss-node>`,
})
export class CloseButtonComponent implements OnInit, OnDestroy {
  schema: SchemaNode | null = null;
  ctx: BuilderContext = {};

  private styles: any = {};
  private styleKey: any[] = [];
  private unsubscribers: Array<() => void> = [];
  private readonly handlers = {
    handleClosePress: () => {
      execute('closeButton.handleCloseButton');
    },
  };

  private destroyed = false;
  private readonly scheduleRender = batched(() => {
    if (this.destroyed) return;
    this.ctx = { state: spotcheckStore.getState().SpotCheckState, styles: this.styles, handlers: this.handlers };
    this.cdr.detectChanges();
  });

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.unsubscribers.push(spotcheckStore.subscribe(() => this.update()));
    this.unsubscribers.push(componentStore.subscribe(() => this.update()));
    this.update();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  private update(): void {
    const state = spotcheckStore.getState().SpotCheckState;
    const componentState = componentStore.getState().componentState;
    this.schema = componentState.isLoaded ? componentState.schemas?.closeButton || null : null;
    const key = [state.spotCheckDetails.closeButton, state.spotCheckDetails.isRTLLanguage];
    if (key[0] !== this.styleKey[0] || key[1] !== this.styleKey[1]) {
      this.styleKey = key;
      execute('closeButton.getCloseButtonStyles').then((result) => {
        if (!result) return;
        this.styles = result;
        this.scheduleRender();
      });
    }
    this.scheduleRender();
  }
}
