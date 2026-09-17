import axios from 'axios';
import { spotcheckStore } from '../state/spotcheck-store';
import { SDK_VERSION } from '../constants';

type CaptureFn = (
  error: unknown,
  source: string,
  context?: Record<string, unknown>
) => void;

export const captureP0Error: CaptureFn = (error, source, context) => {
  console.error('[Spotcheck P0]', source, error, context);
  postSdkError('P0', error, source, context).catch(() => {});
};

export const captureP1Error: CaptureFn = (error, source, context) => {
  console.warn('[Spotcheck P1]', source, error, context);
  postSdkError('P1', error, source, context).catch(() => {});
};

async function postSdkError(
  level: 'P0' | 'P1',
  error: unknown,
  source: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const domain = spotcheckStore.getState().SpotCheckState.params.domainName;
    if (!domain) return;
    const msg = error instanceof Error ? error.message : String(error);
    await axios.post(
      `https://${domain}/api/internal/spotcheck/sdkErrors`,
      {
        level,
        source,
        message: msg,
        sdkVersion: SDK_VERSION,
        context: context ?? {},
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
  } catch {
    /* ignore */
  }
}

export function initializeSentry(): void {
  /* Web SDK routes via postSdkError; optional @sentry/browser can be added by host. */
}
