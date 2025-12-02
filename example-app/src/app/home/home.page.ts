import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';

import {
  trackScreen,
  trackEvent,
} from 'surveysparrow-ionic-plugin/angular-ui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.trackHomeScreen();
  }

  private async trackHomeScreen() {
    try {
      await trackScreen({
        screen: 'HomeScreen',
        options: {
          variables: {
            sparrowLang: 'en',
            pageType: 'home',
            asdasdasd: "VARIABLE_VALUE"
          },
          userDetails: {
            email: 'test@gmail.com',
          },
        },
      });
    } catch (error) {
      console.log('Error tracking home screen:', error);
    }
  }

  public async trackHomeEvent() {
    try {
      await trackEvent({
        screen: 'HomeScreen',
        event: {
          HomeEvent: {
            eventTriggeredOn: Date.now().toString(),
          },
        },
      });
    } catch (error) {
      console.error('Error tracking home event:', JSON.stringify(error));
    }
  }

  public navigateToSettings() {
    this.router.navigate(['/settings']);
  }
}
