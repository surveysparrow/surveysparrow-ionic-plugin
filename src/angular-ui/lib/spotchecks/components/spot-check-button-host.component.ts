import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotcheckButtonEmbedComponent } from './spotcheck-button-embed.component';
import type { BuilderContext } from './builder-context';
import { getSpotCheckStateSnapshot, subscribeSpotcheckState } from '../state/spotcheck-store';

@Component({
  selector: 'ss-spot-check-button-host',
  standalone: true,
  imports: [CommonModule, SpotcheckButtonEmbedComponent],
  template: `
    <ss-spotcheck-button-embed [parentContext]="baseContext"></ss-spotcheck-button-embed>
  `,
})
export class SpotCheckButtonHostComponent implements OnInit, OnDestroy {
  baseContext: BuilderContext = {
    state: getSpotCheckStateSnapshot(),
    handlers: {},
  };

  private unsub?: () => void;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.unsub = subscribeSpotcheckState(() => {
      this.baseContext = {
        ...this.baseContext,
        state: getSpotCheckStateSnapshot(),
      };
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }
}
