import { Component } from '@angular/core';
import { SurveySparrowIonicPlugin } from 'surveysparrow-ionic-plugin';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor() {}

  loadSurvey() {    
    SurveySparrowIonicPlugin.loadFullScreenSurvey({
      domain: "",
      token: "",
      params: {},
      properties: {"langCode": "nl"}
    }).then(() => {
      console.log('Survey loaded successfully');
    }).catch((error) => {
      console.error('Error loading survey:', error);
    });
  }

  loadSurveyWithValidation() {
    SurveySparrowIonicPlugin.loadFullScreenSurveyWithValidation({
      domain: "",
      token: "",
      params: {},
      properties: {"langCode": "nl"}
    }).then(() => {
      console.log('Survey loaded successfully');
    }).catch((error) => {
      console.error('Error loading survey:', error);
    });
  }
}
