import {
  ChangeDetectorRef,
  Component,
  forwardRef,
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
  selector: 'ss-close-button-embed',
  standalone: true,
  imports: [CommonModule, forwardRef(() => BuilderTreeComponent)],
  template: `
    <ng-container *ngFor="let n of asArray(schema)">
      <ss-builder-tree [node]="n" [context]="mergedContext!"></ss-builder-tree>
    </ng-container>
  `,
})
export class CloseButtonEmbedComponent implements OnInit, OnDestroy {
  @Input({ required: true }) parentContext!: BuilderContext;

  schema: SchemaNode | SchemaNode[] | null = null;
  mergedContext: BuilderContext | null = null;

  private unsub?: () => void;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.unsub = subscribeSpotcheckState(() => void this.refresh());
    void this.refresh();
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  asArray(s: SchemaNode | SchemaNode[] | null): SchemaNode[] {
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  }

  private async refresh(): Promise<void> {
    this.schema = componentStore.getState().componentState.schemas.closeButton as
      | SchemaNode
      | SchemaNode[]
      | null;
    const styles = (await execute('closeButton.getCloseButtonStyles')) as Record<
      string,
      unknown
    > | null;
    const state = getSpotCheckStateSnapshot();
    this.mergedContext = {
      ...this.parentContext,
      state,
      styles: styles || {},
      handlers: {
        ...this.parentContext.handlers,
        handleClosePress: () => {
          void execute('closeButton.handleCloseButton');
        },
      },
    };
    this.cdr.markForCheck();
  }
}
