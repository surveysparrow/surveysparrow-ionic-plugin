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
      domain: "gokulkrishnaraju1183.surveysparrow.com",
      token: "ntt-3gxSi3LDc42hSy7FESGYhQ",
      params: {"email": "gk@ss.com", "emailaddress": "gokul@ss.com"},
      properties: {"langCode": "ta"}
    }).then(() => {
      console.log('Survey loaded successfully');
    }).catch((error) => {
      console.error('Error loading survey:', error);
    });
  }

  loadSurveyWithValidation() {
    SurveySparrowIonicPlugin.loadFullScreenSurveyWithValidation({
      domain: "gokulkrishnaraju1183.surveysparrow.com",
      token: "ntt-3gxSi3LDc42hSy7FESGYhQ",
      params: {"email": "gokul@ss.com", "emailaddress": "gokul@ss.com"},
      properties: {"langCode": "ta"}
    }).then(() => {
      console.log('Survey loaded successfully');
    }).catch((error) => {
      console.error('Error loading survey:', error);
    });
  }
}
