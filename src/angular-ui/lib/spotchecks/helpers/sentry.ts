// SDK errors go to SurveySparrow's API (backend sentry.processSentryError), never to Sentry servers.
import { spotcheckStore } from '../state/store';
import { SDK_VERSION, FRAMEWORK } from './version';

export type ErrorSource =
  | 'SDK_INITIALIZATION'
  | 'SPOTCHECK_INITIALIZATION'
  | 'TRACK_SCREEN'
  | 'TRACK_EVENT'
  | 'WEBVIEW_ERROR'
  | 'CLOSE_SPOTCHECK'
  | 'APP_CRASH'
  | 'GENERAL';

// Set by executables.ts at load time (avoids a circular import).
let executeRef: ((fn: string, params?: any) => Promise<any>) | null = null;
export const registerExecute = (fn: (fnName: string, params?: any) => Promise<any>) => {
  executeRef = fn;
};

const MAX_BREADCRUMBS = 30;
const sdkBreadcrumbs: any[] = [];

export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  sdkBreadcrumbs.push({ category: 'spotcheck', message, data, timestamp: Date.now() / 1000 });
  if (sdkBreadcrumbs.length > MAX_BREADCRUMBS) sdkBreadcrumbs.shift();
};

const MAX_BREADCRUMB_STRING = 200;
const capString = (value: string) => value.slice(0, MAX_BREADCRUMB_STRING);

// Breadcrumb hook for backend functions; drops bad input and never throws.
export const safeAddBreadcrumb = (message: unknown, data?: unknown) => {
  try {
    if (typeof message !== 'string') return;
    let clean: Record<string, any> | undefined;
    const proto = data && typeof data === 'object' ? Object.getPrototypeOf(data) : undefined;
    if (proto === Object.prototype || proto === null) {
      clean = {};
      Object.keys(data as object).forEach((key) => {
        const value = (data as any)[key];
        if (typeof value === 'string') clean![key] = capString(value);
        else if (value === null || typeof value === 'number' || typeof value === 'boolean') clean![key] = value;
      });
    }
    addBreadcrumb(capString(message), clean);
  } catch {}
};

// Flags an error as reported so execute() does not report it again.
const markReported = (error: unknown) => {
  try {
    if (error !== null && typeof error === 'object') {
      Object.defineProperty(error, '__ssReported', { value: true, configurable: true });
    }
  } catch {}
};

export const isReported = (error: unknown) => {
  try {
    return !!(error as any)?.__ssReported;
  } catch {
    return false;
  }
};

// Routes an event to the backend; never throws.
const sendToBackend = async (normalizedEvent: any) => {
  try {
    const result = executeRef
      ? await executeRef('sentry.processSentryError', {
        event: normalizedEvent,
        sdkType: FRAMEWORK,
        sdkVersion: SDK_VERSION,
      })
      : null;
    if (result) return;

    const { domainName, targetToken } = spotcheckStore.getState().SpotCheckState?.params || {};
    if (!domainName) return;
    await fetch(`https://${domainName}/api/internal/spotcheck/sdkErrors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorMessage: normalizedEvent.errorMessage,
        sdkType: FRAMEWORK,
        sdkVersion: SDK_VERSION,
        level: normalizedEvent.tags?.error_priority === 'P0' ? 'fatal' : 'error',
        tags: normalizedEvent.tags,
        extra: normalizedEvent.extra,
        breadcrumbs: normalizedEvent.breadcrumbs,
        contexts: { user: { spotcheck_token: targetToken || '', spotcheck_domain_name: domainName } },
      }),
    }).catch(() => {});
  } catch {
    // Reporting must never break the host app.
  }
};

const report = (error: unknown, priority: 'P0' | 'P1', source: ErrorSource, extra?: Record<string, any>) => {
  markReported(error);
  const err = error as any;
  sendToBackend({
    errorMessage: err?.message || String(error),
    tags: {
      error_priority: priority,
      severity: priority === 'P0' ? 'CRITICAL' : 'HIGH',
      errorType: source,
    },
    contexts: {},
    extra: extra || {},
    breadcrumbs: [...sdkBreadcrumbs],
    exceptions: [{
      type: err?.name || 'Error',
      value: err?.message || String(error),
      stack: String(err?.stack || '').slice(0, 2000),
    }],
    timestamp: Date.now() / 1000,
    platform: 'javascript',
  });
};

export const captureP0Error = (error: unknown, source: ErrorSource, extra?: Record<string, any>) =>
  report(error, 'P0', source, extra);

export const captureP1Error = (error: unknown, source: ErrorSource, extra?: Record<string, any>) =>
  report(error, 'P1', source, extra);
