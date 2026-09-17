import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, type OnDestroy, type OnInit } from '@angular/core';

import type { SchemaNode } from '../helpers/binding-resolver';
import { execute, dispatchWrapper } from '../helpers/executables';
import {
  getWebViewInjectionDepsKey,
  shouldRunWebViewInjection,
} from '../helpers/webview-injection-tracker';
import { componentStore } from '../state/component-store';
import { getSpotCheckStateSnapshot, subscribeSpotcheckState } from '../state/spotcheck-store';

import type { BuilderContext } from './builder-context';
import { SpotcheckBuilderComponent } from './spotcheck-builder.component';

const LOG = '[Spotcheck:ionic-webview-host]';

@Component({
  selector: 'ss-webview-host',
  standalone: true,
  imports: [CommonModule, SpotcheckBuilderComponent],
  template: `
    <ss-spotcheck-builder
      *ngIf="webviewSchema && loaded"
      [schema]="webviewSchema"
      [context]="ctx"
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
export class WebviewHostComponent implements OnInit, OnDestroy {
  webviewSchema: SchemaNode | SchemaNode[] | null = null;
  loaded = false;

  ctx: BuilderContext = {
    state: getSpotCheckStateSnapshot(),
    handlers: {},
  };

  private unsubComponent?: () => void;
  private unsubState?: () => void;
  private vvListener?: () => void;
  private lastHostLog: { loaded: boolean; hasSchema: boolean } | null = null;

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const applyComponentState = () => {
      const st = componentStore.getState().componentState;
      this.webviewSchema = st.schemas.webviewComponent as
        | SchemaNode
        | SchemaNode[]
        | null;
      this.loaded = st.isLoaded;
      const hasSchema = !!this.webviewSchema;
      const willShowBuilder = !!(this.webviewSchema && this.loaded);
      const gateChanged =
        this.lastHostLog === null ||
        this.lastHostLog.loaded !== this.loaded ||
        this.lastHostLog.hasSchema !== hasSchema;
      if (gateChanged) {
        this.lastHostLog = { loaded: this.loaded, hasSchema };
        console.info(`${LOG} builder gate`, {
          loaded: this.loaded,
          hasWebviewSchema: hasSchema,
          willShowBuilder,
        });
      }
    };

    applyComponentState();
    this.unsubComponent = componentStore.subscribe(() => {
      applyComponentState();
      this.cdr.markForCheck();
    });

    this.syncContext();
    this.unsubState = subscribeSpotcheckState(() => {
      this.syncContext();
      this.maybeInject();
    });

    this.maybeInject();

    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      const onResize = () => {
        const kh = Math.max(0, window.innerHeight - (vv.height ?? 0));
        dispatchWrapper({
          spotCheckDetails: { keyBoardHeight: kh },
          webViewDetails: { scrollEnabled: kh < 8 },
        });
      };
      vv.addEventListener('resize', onResize);
      this.vvListener = () => vv.removeEventListener('resize', onResize);
    }
  }

  ngOnDestroy(): void {
    this.unsubComponent?.();
    this.unsubState?.();
    this.vvListener?.();
  }

  private maybeInject(): void {
    const state = getSpotCheckStateSnapshot();
    const run = shouldRunWebViewInjection(state);
    if (run) {
      const key = getWebViewInjectionDepsKey(state);
      console.info(`${LOG} handleWebViewInjection invoked`, {
        injectionKeyLen: key.length,
        injectionKeyHead: key.length > 200 ? `${key.slice(0, 200)}…` : key,
      });
      void execute('webviewComponent.handleWebViewInjection');
    }
  }

  private syncContext(): void {
    this.ctx = {
      state: getSpotCheckStateSnapshot(),
      handlers: {
        classicWebViewRefCallback: (ref: unknown) => {
          void execute('webviewComponent.classicWebViewRefCallback', { ref });
        },
        chatWebViewRefCallback: (ref: unknown) => {
          void execute('webviewComponent.chatWebViewRefCallback', { ref });
        },
        handleOnMessage: (event: unknown) => {
          void execute('webviewComponent.handleWebViewMessage', { event });
        },
        handleOnError: (error: unknown) => {
          void execute('webviewComponent.handleWebViewError', { error });
        },
      },
    };
    this.cdr.markForCheck();
  }
}
