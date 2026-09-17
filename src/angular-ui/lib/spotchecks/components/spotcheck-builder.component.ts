import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuilderTreeComponent } from './builder-tree.component';
import type { BuilderContext } from './builder-context';
import type { SchemaNode } from '../helpers/binding-resolver';

@Component({
  selector: 'ss-spotcheck-builder',
  standalone: true,
  imports: [CommonModule, BuilderTreeComponent],
  template: `
    <ng-container *ngIf="schema">
      <ss-builder-tree
        *ngFor="let n of asArray(schema); trackBy: trackByIx"
        [node]="n"
        [context]="context"
      ></ss-builder-tree>
    </ng-container>
  `,
})
export class SpotcheckBuilderComponent {
  @Input() schema: SchemaNode | SchemaNode[] | null = null;
  @Input({ required: true }) context!: BuilderContext;

  asArray(s: SchemaNode | SchemaNode[] | null): SchemaNode[] {
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  }

  trackByIx(i: number): number {
    return i;
  }
}
