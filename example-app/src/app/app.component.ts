import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import {
  SpotCheck,
  initializeSpotChecks,
  addSpotCheckListener,
} from 'surveysparrow-ionic-plugin/angular-ui';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, SpotCheck],
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor() {
    this.initializeSpotChecks();
    this.setupEventListeners();
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners() {
    this.subscriptions.push(
      addSpotCheckListener('surveyCompleted', (data) => {
        console.log('surveyCompleted triggered', data);
      }),
      addSpotCheckListener('surveyDismissed', () => {
        console.log('surveyDismissed by closebutton triggered');
      }),
      addSpotCheckListener('surveyLoadStarted', (data) => {
        console.log('surveyLoadStarted triggered', data);
      }),
    );
  }

  private initializeSpotChecks() {
    try {
      initializeSpotChecks({
        domainName: "kalaiselvanstorage233128.surveysparrow.com",
        targetToken: "tar-mpGJdyH99ukrJ1UbQZjt9g",
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
