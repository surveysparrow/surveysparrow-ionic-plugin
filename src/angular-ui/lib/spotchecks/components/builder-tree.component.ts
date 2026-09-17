import {
  Component,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import type { BuilderContext } from './builder-context';
import {
  evaluateCondition,
  resolveBinding,
  type SchemaNode,
} from '../helpers/binding-resolver';
import { mergeRnStyles, rnStyleToCss } from '../helpers/rn-style-to-css';
import { WebviewRendererComponent } from './webview-renderer.component';
import { CloseButtonEmbedComponent } from './close-button-embed.component';
import { SpotcheckButtonEmbedComponent } from './spotcheck-button-embed.component';
import { AnimatedExitWrapperComponent } from './animated-exit-wrapper.component';

@Component({
  selector: 'ss-builder-tree',
  standalone: true,
  imports: [
    CommonModule,
    WebviewRendererComponent,
    forwardRef(() => CloseButtonEmbedComponent),
    forwardRef(() => SpotcheckButtonEmbedComponent),
    forwardRef(() => BuilderTreeComponent),
    AnimatedExitWrapperComponent,
  ],
  templateUrl: './builder-tree.component.html',
})
export class BuilderTreeComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) node!: SchemaNode;
  @Input({ required: true }) context!: BuilderContext;

  resolvedProps: Record<string, unknown> = {};
  resolvedContent: unknown = null;
  showNode = true;
  hasContentProp = false;
  domStyle: Record<string, string | number> = {};

  private unsubscribe?: () => void;

  constructor(public sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.unsubscribe = () => {};
    this.render();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    if (this.node.slot && this.context.slots?.[this.node.slot]) {
      return;
    }
    if (this.node.if !== undefined && !evaluateCondition(this.node.if, this.context)) {
      this.showNode = false;
      return;
    }
    this.showNode = true;

    if (
      this.node.type === 'CloseButton' ||
      this.node.type === 'SpotCheckButton'
    ) {
      return;
    }

    this.hasContentProp = Object.prototype.hasOwnProperty.call(this.node, 'content');
    this.resolvedProps = this.node.props
      ? (resolveBinding(this.node.props, this.context) as Record<string, unknown>)
      : {};
    this.resolvedContent = this.hasContentProp
      ? resolveBinding(this.node.content, this.context)
      : null;

    const st = (this.resolvedProps['style'] as Record<string, unknown>) || {};
    this.domStyle = rnStyleToCss(st);
  }

  onPressableClick(): void {
    const onPress = this.resolvedProps['onPress'] as (() => void) | undefined;
    onPress?.();
  }

  trackByIndex(i: number): number {
    return i;
  }

  mergeStyles(
    extra: Record<string, unknown> | undefined
  ): Record<string, string | number> {
    return mergeRnStyles(
      this.resolvedProps['style'] as Record<string, unknown>,
      extra
    );
  }

  safeSvg(xml: string): ReturnType<DomSanitizer['bypassSecurityTrustHtml']> {
    return this.sanitizer.bypassSecurityTrustHtml(xml);
  }

  get svgXmlContent(): string {
    const x = this.resolvedProps['xml'];
    return typeof x === 'string' ? x : '';
  }

  get imageSrc(): string {
    const src = this.resolvedProps['source'];
    if (src && typeof src === 'object' && 'uri' in (src as object)) {
      const u = (src as { uri?: string }).uri;
      if (u) return u;
    }
    const direct = this.resolvedProps['src'];
    return typeof direct === 'string' ? direct : '';
  }

  hasExitOrLayoutAnimation(): boolean {
    const a = this.node.animation as Record<string, unknown> | undefined;
    if (!a) return false;
    if (a['exit']) return true;
    const l = a['layout'] as Record<string, unknown> | undefined;
    return !!(l && l['type'] === 'height');
  }

  get safeAreaExtraRn(): Record<string, unknown> {
    return {
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    };
  }

  isKnownLayoutType(): boolean {
    return [
      'CloseButton',
      'SpotCheckButton',
      'WebViewRenderer',
      'SvgXml',
      'SafeAreaView',
      'View',
      'Text',
      'Image',
      'Pressable',
      'TouchableOpacity',
    ].includes(this.node.type);
  }
}
