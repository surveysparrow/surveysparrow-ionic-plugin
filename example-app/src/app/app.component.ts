import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SpotCheck, initializeSpotChecks } from 'surveysparrow-ionic-plugin/angular-ui';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, SpotCheck],
})
export class AppComponent {
  constructor() {
    initializeSpotChecks({
      domainName: 'kalai.in.ngrok.io',
      targetToken: 'tar-mEvMRcbYctzduhay59btya',
      userDetails: {},
      variables: { sparrowLang: 'en' },
      customProperties: {},
      listener: {
        onSurveyLoaded: async (response) => console.log('[SS] onSurveyLoaded', JSON.stringify(response)),
        onSurveyResponse: async (response) => console.log('[SS] onSurveyResponse', JSON.stringify(response)),
        onPartialSubmission: async (response) => console.log('[SS] onPartialSubmission', JSON.stringify(response)),
        onCloseButtonTap: async () => console.log('[SS] onCloseButtonTap'),
      },
    });
  }
}
