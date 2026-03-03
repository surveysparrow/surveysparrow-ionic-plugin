import { Subject } from 'rxjs';
import type { Subscription } from 'rxjs';

export type SpotCheckEventType =
  | 'surveyCompleted'
  | 'surveyDismissed'
  | 'surveyLoadStarted';

export interface SpotCheckEvent {
  type: SpotCheckEventType;
  data?: any;
}

type EventCallback = (data?: any) => void;

class SpotCheckEventListenerService {
  private eventSubject = new Subject<SpotCheckEvent>();
  private event$ = this.eventSubject.asObservable();

  emit(type: SpotCheckEventType, data?: any): void {
    this.eventSubject.next({ type, data });
  }

  addListener(
    eventType: SpotCheckEventType,
    callback: EventCallback
  ): Subscription {
    return this.event$.subscribe((event: SpotCheckEvent) => {
      if (event.type === eventType) {
        callback(event.data);
      }
    });
  }
}

let globalInstance: SpotCheckEventListenerService;

export const getSpotCheckEventListener = (): SpotCheckEventListenerService => {
  if (!globalInstance) {
    globalInstance = new SpotCheckEventListenerService();
  }
  return globalInstance;
};

export const addSpotCheckListener = (
  eventType: SpotCheckEventType,
  callback: EventCallback
): Subscription => {
  return getSpotCheckEventListener().addListener(eventType, callback);
};
