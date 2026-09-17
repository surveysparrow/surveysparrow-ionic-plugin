import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotcheckBuilderComponent } from './spotcheck-builder.component';
import type { BuilderContext } from './builder-context';
import type { SchemaNode } from '../helpers/binding-resolver';
import { execute } from '../helpers/executables';
import { componentStore } from '../state/component-store';
import { getSpotCheckStateSnapshot, subscribeSpotcheckState } from '../state/spotcheck-store';
import { WebviewHostComponent } from './webview-host.component';

@Component({
  selector: 'ss-wrapper-host',
  standalone: true,
  imports: [CommonModule, SpotcheckBuilderComponent, WebviewHostComponent],
  template: `
    <ng-template #webviewSlot>
      <ss-webview-host />
    </ng-template>
    <ss-spotcheck-builder
      *ngIf="wrapperSchema && loaded && webviewSlot"
      [schema]="wrapperSchema"
      [context]="buildContext(webviewSlot!)"
    ></ss-spotcheck-builder>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 100%;
      }
    `,
  ],
})
export class WrapperHostComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('webviewSlot') webviewSlot?: TemplateRef<unknown>;

  styles: Record<string, unknown> = {};
  wrapperSchema: SchemaNode | SchemaNode[] | null = null;
  loaded = false;

  screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
  screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;

  private unsubComponent?: () => void;
  private unsubState?: () => void;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.unsubComponent = componentStore.subscribe(() => {
      const st = componentStore.getState().componentState;
      this.wrapperSchema = st.schemas.wrapper as SchemaNode | SchemaNode[] | null;
      this.loaded = st.isLoaded;
      this.cdr.markForCheck();
    });
    this.unsubState = subscribeSpotcheckState(() => void this.refreshStyles());
    void this.refreshStyles();
  }

  ngOnDestroy(): void {
    this.unsubComponent?.();
    this.unsubState?.();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
    void this.refreshStyles();
  }

  buildContext(tpl: TemplateRef<unknown>): BuilderContext {
    return {
      state: getSpotCheckStateSnapshot(),
      styles: this.styles,
      slots: { children: tpl },
      handlers: {},
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
    };
  }

  private async refreshStyles(): Promise<void> {
    await execute('wrapper.getWrapperStyles', {
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
      setStyles: (s: unknown) => {
        this.styles = { ...this.styles, ...(s as object) };
        this.cdr.markForCheck();
      },
    });
  }
}
