import { Component } from '@angular/core';
import { SpotCheckShellComponent } from './spotchecks/components/spot-check-shell.component';

@Component({
  selector: 'SpotCheck',
  template: `<ss-spot-check-root class="spotcheck-root-fill" />`,
  standalone: true,
  imports: [SpotCheckShellComponent],
  styles: [
    `
      :host {
        display: block;
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 100000;
        pointer-events: none;
      }
      .spotcheck-root-fill {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 100%;
        pointer-events: auto;
      }
    `,
  ],
})
export class SpotCheck {}
