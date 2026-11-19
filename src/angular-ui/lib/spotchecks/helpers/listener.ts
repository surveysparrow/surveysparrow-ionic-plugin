import { Subscription } from 'rxjs';
import type { SsSpotcheckListener } from '../types';

// Legacy Ionic events, still supported next to the init `listener`.
export type SpotCheckEventType = 'surveyCompleted' | 'surveyDismissed' | 'surveyLoadStarted';

type EventCallback = (data?: any) => void;

const legacyCallbacks = new Map<SpotCheckEventType, Set<EventCallback>>();

const emit = (type: SpotCheckEventType, data?: any) => {
  legacyCallbacks.get(type)?.forEach((callback) => {
    try {
      runInApp(() => callback(data));
    } catch (error) {
      console.error(`[SpotCheck] ${type} listener failed`, error);
    }
  });
};

// Returns an RxJS Subscription, as the legacy SDK did.
export const addSpotCheckListener = (eventType: SpotCheckEventType, callback: EventCallback): Subscription => {
  if (!legacyCallbacks.has(eventType)) legacyCallbacks.set(eventType, new Set());
  legacyCallbacks.get(eventType)!.add(callback);
  return new Subscription(() => {
    legacyCallbacks.get(eventType)?.delete(callback);
  });
};

let appListener: SsSpotcheckListener = {};

// Set by <SpotCheck>: runs app callbacks inside the Angular zone.
let runInApp: <T>(fn: () => T) => T = (fn) => fn();
export const setAppRunner = (runner: <T>(fn: () => T) => T) => {
  runInApp = runner;
};

export const setListener = (listener?: SsSpotcheckListener) => {
  appListener = listener || {};
};

// What backend functions call: the app's listener first, then the legacy events.
export const sdkListener: Required<SsSpotcheckListener> = {
  onSurveyLoaded: async (data) => {
    await runInApp(() => appListener.onSurveyLoaded?.(data));
    // 2.0.3 passed surveyDetails.
    emit('surveyLoadStarted', data?.['surveyDetails'] ?? data);
  },
  onSurveyResponse: async (data) => {
    await runInApp(() => appListener.onSurveyResponse?.(data));
    // Legacy Ionic passed the response array.
    emit('surveyCompleted', data?.['response'] ?? data);
  },
  onPartialSubmission: async (data) => {
    await runInApp(() => appListener.onPartialSubmission?.(data));
  },
  onCloseButtonTap: async () => {
    await runInApp(() => appListener.onCloseButtonTap?.());
    emit('surveyDismissed');
  },
};
