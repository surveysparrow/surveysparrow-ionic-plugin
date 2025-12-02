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
  trackEvent
} from 'surveysparrow-ionic-plugin/angular-ui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class SettingsPage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
    this.trackSettingsScreen();
  }

  private async trackSettingsScreen() {
    try {
      await trackScreen({
        screen: 'SettingsScreen',
        options: {
          variables: {
            sparrowLang: 'en',
            pageType: 'settings',
            asdasdasd: "VARIABLE_VALUE"
          },
          userDetails: {
            email: 'test@gmail.com',
          },
        },
      });
    } catch (error) {
      console.log('Error tracking settings screen:', error);
    }
  }

  // this can be added/called in any button clicks 
  public async trackSettingsEvent() {
    try {
      await trackEvent({
        screen: 'SettingsScreen',
        event: {
          SettingsEvent: {
            eventTriggeredOn: Date.now().toString(),
          },
        },
      });
    } catch (error) {
      console.error('Error tracking settings event:', JSON.stringify(error));
    }
  }

  public navigateToHome() {
    this.router.navigate(['/home']);
  }
}
