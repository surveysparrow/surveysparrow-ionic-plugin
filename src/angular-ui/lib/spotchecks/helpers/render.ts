import type { ChangeDetectorRef } from '@angular/core';
import { captureP0Error } from './sentry';

// Render guard, like RN's error boundary: a failed draw hides SpotCheck, the app keeps running,
// and it is reported once as APP_CRASH.
let crashed = false;
const crashListeners = new Set<() => void>();

export const hasCrashed = () => crashed;

export const onCrash = (listener: () => void) => {
  crashListeners.add(listener);
  return () => {
    crashListeners.delete(listener);
  };
};

export const guardedDetectChanges = (cdr: ChangeDetectorRef, action: string) => {
  if (crashed) return;
  try {
    cdr.detectChanges();
  } catch (error: any) {
    crashed = true;
    captureP0Error(error, 'APP_CRASH', { action, errorMessage: error?.message });
    crashListeners.forEach((listener) => {
      try {
        listener();
      } catch {}
    });
  }
};

// Runs fn once per microtask however often it is requested (many dispatches, one render).
export const batched = (fn: () => void) => {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      fn();
    });
  };
};
