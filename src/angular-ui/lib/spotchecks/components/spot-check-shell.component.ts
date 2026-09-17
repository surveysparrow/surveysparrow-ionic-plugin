import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WrapperHostComponent } from './wrapper-host.component';
import { SpotCheckButtonHostComponent } from './spot-check-button-host.component';

@Component({
  selector: 'ss-spot-check-root',
  standalone: true,
  imports: [CommonModule, WrapperHostComponent, SpotCheckButtonHostComponent],
  template: `
    <ss-wrapper-host />
    <ss-spot-check-button-host />
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
export class SpotCheckShellComponent {}
