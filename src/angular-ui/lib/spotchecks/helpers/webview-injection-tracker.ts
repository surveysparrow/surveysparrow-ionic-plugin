import type { SpotCheckRootState } from '../state/spotcheck-store';

export function getWebViewInjectionDepsKey(state: SpotCheckRootState): string {
  const w = state.webViewDetails;
  let injection: unknown = w.webViewInjectionData;
  try {
    injection =
      typeof injection === 'string'
        ? injection
        : JSON.stringify(injection ?? null);
  } catch {
    try {
      injection = String(injection);
    } catch {
      injection = '[unserializable]';
    }
  }
  return JSON.stringify({
    chatLoading: w.isChatLoading,
    classicLoading: w.isClassicLoading,
    injection,
  });
}

let lastInjectionKey = '';

export function shouldRunWebViewInjection(state: SpotCheckRootState): boolean {
  const key = getWebViewInjectionDepsKey(state);
  if (key === lastInjectionKey) {
    return false;
  }
  lastInjectionKey = key;
  return true;
}

export function resetWebViewInjectionTracker(): void {
  lastInjectionKey = '';
}
