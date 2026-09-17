import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BuilderContext } from './builder-context';
import {
  evaluateCondition,
  resolveBinding,
  type SchemaNode,
} from '../helpers/binding-resolver';
import { execute } from '../helpers/executables';
import {
  getSpotCheckStateSnapshot,
  subscribeSpotcheckState,
} from '../state/spotcheck-store';
import { rnStyleToCss } from '../helpers/rn-style-to-css';

/** Exit + optional layout height — no enter animations. */

@Component({
  selector: 'ss-animated-exit-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #host class="ss-anim-exit-host" [ngStyle]="hostStyle">
      <ng-content></ng-content>
    </div>
  `,
})
export class AnimatedExitWrapperComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) node!: SchemaNode;
  @Input({ required: true }) context!: BuilderContext;
  /** Resolved props for this node (includes `style` in RN shape). */
  @Input({ required: true }) resolvedProps!: Record<string, unknown>;
  /** Merged into `style` before CSS conversion (e.g. SafeArea insets). */
  @Input() extraStyleRn: Record<string, unknown> | null = null;

  @ViewChild('host', { static: false }) hostRef?: ElementRef<HTMLDivElement>;

  hostStyle: Record<string, string | number> = {};

  private unsub?: () => void;
  private prevExitTrigger = false;
  private prevLayoutHeight: number | undefined = undefined;
  private isFirstLayout = true;
  private exitAnimation?: Animation;
  private layoutAnimation?: Animation;
  private exitRunning = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.applyBaseStyle();
    this.unsub = subscribeSpotcheckState(() => {
      this.tick();
    });
    this.tick();
  }

  ngOnDestroy(): void {
    this.unsub?.();
    this.exitAnimation?.cancel();
    this.layoutAnimation?.cancel();
  }

  private get rnStyle(): Record<string, unknown> {
    const base = (this.resolvedProps['style'] as Record<string, unknown>) || {};
    if (this.extraStyleRn && Object.keys(this.extraStyleRn).length) {
      return { ...base, ...this.extraStyleRn };
    }
    return base;
  }

  private applyBaseStyle(): void {
    if (this.exitRunning) {
      return;
    }
    this.hostStyle = rnStyleToCss(this.rnStyle);
  }

  private tick(): void {
    const freshState = getSpotCheckStateSnapshot();
    this.context = { ...this.context, state: freshState };

    const anim = this.node.animation as Record<string, unknown> | undefined;
    if (!anim) {
      return;
    }

    if (!this.exitRunning) {
      this.applyBaseStyle();
    }

    const exitCfg = anim['exit'] as Record<string, unknown> | undefined;
    if (exitCfg) {
      const exitTrigger = exitCfg['trigger']
        ? evaluateCondition(exitCfg['trigger'], this.context)
        : false;
      if (exitTrigger && !this.prevExitTrigger) {
        void this.runExitAnimation(exitCfg);
      }
      this.prevExitTrigger = Boolean(exitTrigger);
    }

    const layoutCfg = anim['layout'] as Record<string, unknown> | undefined;
    if (layoutCfg && layoutCfg['type'] === 'height') {
      const ok =
        !layoutCfg['if'] || evaluateCondition(layoutCfg['if'], this.context);
      if (ok) {
        this.maybeAnimateLayout(layoutCfg);
      }
    }

    this.cdr.markForCheck();
  }

  private mapEasing(name?: string): string {
    const raw = (name || 'easeIn').toLowerCase();
    const map: Record<string, string> = {
      linear: 'linear',
      ease: 'ease',
      easein: 'ease-in',
      'ease-in': 'ease-in',
      easeout: 'ease-out',
      'ease-out': 'ease-out',
      easeinout: 'ease-in-out',
      'ease-in-out': 'ease-in-out',
      easeineaseout: 'ease-in-out',
      'ease-in-ease-out': 'ease-in-out',
    };
    return map[raw.replace(/[-_\s]/g, '')] ?? 'ease-in';
  }

  private async runExitAnimation(exitCfg: Record<string, unknown>): Promise<void> {
    const el = this.hostRef?.nativeElement;
    if (!el || typeof el.animate !== 'function') {
      const onComplete = exitCfg['onComplete'] as string | undefined;
      if (onComplete) void execute(onComplete);
      return;
    }

    this.exitAnimation?.cancel();
    this.exitRunning = true;

    const to = (exitCfg['to'] || {}) as Record<string, unknown>;
    const toOpacity =
      to['opacity'] !== undefined
        ? Number(resolveBinding(to['opacity'], this.context))
        : undefined;
    const toTranslateY =
      to['translateY'] !== undefined
        ? Number(resolveBinding(to['translateY'], this.context))
        : undefined;
    const toTranslateX =
      to['translateX'] !== undefined
        ? Number(resolveBinding(to['translateX'], this.context))
        : undefined;
    const toScale =
      to['scale'] !== undefined
        ? Number(resolveBinding(to['scale'], this.context))
        : undefined;

    const duration = Number(exitCfg['duration'] ?? 300);
    const easing = this.mapEasing(exitCfg['easing'] as string | undefined);

    const from: Keyframe = {};
    const dest: Keyframe = {};

    if (toOpacity !== undefined && !Number.isNaN(toOpacity)) {
      from['opacity'] = 1;
      dest['opacity'] = toOpacity;
    }

    const parts: string[] = [];
    if (toTranslateY !== undefined && !Number.isNaN(toTranslateY) && toTranslateY !== 0) {
      parts.push(`translateY(${toTranslateY}px)`);
    }
    if (toTranslateX !== undefined && !Number.isNaN(toTranslateX) && toTranslateX !== 0) {
      parts.push(`translateX(${toTranslateX}px)`);
    }
    if (toScale !== undefined && !Number.isNaN(toScale) && toScale !== 1) {
      parts.push(`scale(${toScale})`);
    }
    if (parts.length) {
      from['transform'] = 'translateY(0px) translateX(0px) scale(1)';
      dest['transform'] = parts.join(' ');
    }

    if (
      Object.keys(from).length === 0 &&
      Object.keys(dest).length === 0
    ) {
      const onComplete = exitCfg['onComplete'] as string | undefined;
      if (onComplete) void execute(onComplete);
      this.exitRunning = false;
      return;
    }

    const origin = exitCfg['transformOrigin']
      ? String(resolveBinding(exitCfg['transformOrigin'], this.context))
      : '';
    if (origin) {
      el.style.transformOrigin = origin;
    }

    const exitAnim = el.animate([from, dest], {
      duration,
      easing,
      fill: 'forwards',
    });
    this.exitAnimation = exitAnim;

    try {
      await exitAnim.finished;
      const onComplete = exitCfg['onComplete'] as string | undefined;
      if (onComplete) {
        void execute(onComplete);
      }
    } catch {
      /* cancelled */
    } finally {
      this.exitRunning = false;
      this.applyBaseStyle();
    }
  }

  private maybeAnimateLayout(layoutCfg: Record<string, unknown>): void {
    const style = this.rnStyle;
    const hRaw = style['height'];
    const currentHeight =
      typeof hRaw === 'number'
        ? hRaw
        : typeof hRaw === 'string'
          ? parseFloat(hRaw)
          : undefined;

    if (currentHeight === undefined || currentHeight === 0) {
      return;
    }

    if (this.isFirstLayout) {
      this.prevLayoutHeight = currentHeight;
      this.isFirstLayout = false;
      return;
    }

    if (this.prevLayoutHeight === currentHeight) {
      return;
    }

    const el = this.hostRef?.nativeElement;
    if (!el || typeof el.animate !== 'function') {
      this.prevLayoutHeight = currentHeight;
      this.applyBaseStyle();
      return;
    }

    this.layoutAnimation?.cancel();
    const duration = Number(layoutCfg['duration'] ?? 300);
    const easing = this.mapEasing(layoutCfg['easing'] as string | undefined);

    const fromH = this.prevLayoutHeight ?? currentHeight;
    const layoutAnim = el.animate(
      [{ height: `${fromH}px` }, { height: `${currentHeight}px` }],
      { duration, easing, fill: 'forwards' }
    );
    this.layoutAnimation = layoutAnim;
    void layoutAnim.finished.then(() => {
      this.prevLayoutHeight = currentHeight;
      this.applyBaseStyle();
    });
  }
}
