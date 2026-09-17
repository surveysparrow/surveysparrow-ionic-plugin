import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SpotCheck, initializeSpotChecks } from 'surveysparrow-ionic-plugin/angular-ui';

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
        domainName: 'kalai.in.ngrok.io',
        targetToken: 'tar-mEvMRcbYctzduhay59btya',
        userDetails: {
          email: 'kalai@gmail.com',
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
