import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuilderTreeComponent } from './builder-tree.component';
import type { BuilderContext } from './builder-context';
import type { SchemaNode } from '../helpers/binding-resolver';
import { execute } from '../helpers/executables';
import { componentStore } from '../state/component-store';
import { getSpotCheckStateSnapshot, subscribeSpotcheckState } from '../state/spotcheck-store';

@Component({
  selector: 'ss-spotcheck-button-embed',
  standalone: true,
  imports: [CommonModule, forwardRef(() => BuilderTreeComponent)],
  template: `
    <ng-container *ngFor="let n of asArray(schema)">
      <ss-builder-tree [node]="n" [context]="mergedContext!"></ss-builder-tree>
    </ng-container>
  `,
})
export class SpotcheckButtonEmbedComponent implements OnInit, OnDestroy {
  @Input({ required: true }) parentContext!: BuilderContext;

  schema: SchemaNode | SchemaNode[] | null = null;
  mergedContext: BuilderContext | null = null;

  screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
  screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;

  private unsub?: () => void;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.unsub = subscribeSpotcheckState(() => void this.refresh());
    void this.refresh();
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
    void this.refresh();
  }

  asArray(s: SchemaNode | SchemaNode[] | null): SchemaNode[] {
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  }

  private async refresh(): Promise<void> {
    this.schema = componentStore.getState().componentState.schemas.spotCheckButton as
      | SchemaNode
      | SchemaNode[]
      | null;
    const styles = (await execute('spotCheckButton.getSpotCheckButtonStyles', {
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
    })) as Record<string, unknown> | null;
    const state = getSpotCheckStateSnapshot();
    this.mergedContext = {
      ...this.parentContext,
      state,
      styles: styles || {},
      screenHeight: this.screenHeight,
      screenWidth: this.screenWidth,
      handlers: {
        ...this.parentContext.handlers,
        handleSpotCheckButtonPress: () => {
          void execute('spotCheckButton.handleSpotCheckButtonPress');
        },
        handleSideTabLayout: (event: unknown) => {
          void execute('spotCheckButton.handleSideTabLayout', { event });
        },
      },
    };
    this.cdr.markForCheck();
  }
}
