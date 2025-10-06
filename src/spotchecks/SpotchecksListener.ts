import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotchecksListener {
  // Event subjects for survey events
  private surveyLoadStartedSubject = new Subject<any>();
  private surveyCompletedSubject = new Subject<any>();
  
  // Observable streams that components can subscribe to
  surveyLoadStarted$ = this.surveyLoadStartedSubject.asObservable();
  surveyCompleted$ = this.surveyCompletedSubject.asObservable();

  // Methods to emit survey events
  emitSurveyLoadStarted(data?: any) {
    this.surveyLoadStartedSubject.next(data);
  }

  emitSurveyCompleted(data?: any) {
    this.surveyCompletedSubject.next(data);
  }

  // Method to clean up resources if needed
  destroy() {
    this.surveyLoadStartedSubject.complete();
    this.surveyCompletedSubject.complete();
  }
}
