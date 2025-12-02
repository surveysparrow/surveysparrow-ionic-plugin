import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import {
  SpotCheck,
  initializeSpotChecks,
} from 'surveysparrow-ionic-plugin/angular-ui';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, SpotCheck],
})
export class AppComponent implements OnInit {

  constructor() {
    this.initializeSpotChecks();
  }

  ngOnInit() {}

  private initializeSpotChecks() {
    try {
      initializeSpotChecks({
        domainName: 'gk7244.salesparrow.com',
        targetToken: 'tar-uMNeYYgkKJQAH7DkUDehoW',
        userDetails: {
          email: 'gokulkrishnaraju@surveysparrow.com',
        },
        variables: {
          sparrowLang: 'en',
        },
        customProperties: {},
      });
    } catch (error) {
      console.error('Failed to initialize SpotChecks:', error);
    }
  }
}
