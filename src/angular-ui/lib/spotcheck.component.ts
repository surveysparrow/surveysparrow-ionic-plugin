import { Component } from '@angular/core';
import { SpotCheckComponent } from './spotchecks/SpotCheckComponent';

@Component({
  selector: 'SpotCheck',
  template: `<SpotCheckComponent />`,
  standalone: true,
  imports: [SpotCheckComponent],
})
export class SpotCheck {}
