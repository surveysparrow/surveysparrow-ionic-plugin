import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'feedback-button',
    template: `
      <ion-button color="primary">
        [Plugin UI] {{label}}
      </ion-button>
    `,
    standalone: true,
    imports: [IonicModule]
  })
  export class FeedbackButtonComponent {
    @Input() label = 'Click Me';
  }
