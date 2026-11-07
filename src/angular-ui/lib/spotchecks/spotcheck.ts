import { componentStore, functionStore, spotcheckStore } from './state/store';
import { execute, markInitialized } from './helpers/executables';
import { setListener } from './helpers/listener';
import { getDeviceFacts, getVisitorInfo, loadDeviceInfo } from './helpers/device';
import { addBreadcrumb, captureP0Error } from './helpers/sentry';
import { FRAMEWORK } from './helpers/version';
import type {
  SpotcheckProps,
  TrackEventProps,
  TrackScreenOptions,
  TrackScreenProps,
} from './types';

export { SDK_VERSION } from './helpers/version';

const INIT_TIMEOUT_MS = 15000;

// Backend functions, schemas and page script for this SDK (framework=ionic).
const getAllSpotcheckFunctions = async (domainName: string) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), INIT_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://${domainName}/api/internal/spotcheck/mobile/init?framework=${FRAMEWORK}`,
      { signal: controller?.signal, cache: 'no-store' },
    );
    if (!response.ok) throw new Error(`mobile/init failed with status ${response.status}`);
    const data = await response.json().catch(() => null);
    // A non-JSON 200 (e.g. captive portal) counts as a failed init.
    if (!data || typeof data !== 'object' || typeof data.initializeSpotcheckComponent !== 'string') {
      throw new Error('Invalid mobile/init response');
    }
    const { componentSchemas, config, ...functions } = data;
    functionStore.dispatch({ ...functions, isLoaded: true });
    componentStore.dispatch({ schemas: componentSchemas || {}, config: config || {}, isLoaded: Boolean(componentSchemas) });
    return data;
  } catch (error: any) {
    captureP0Error(error, 'SPOTCHECK_INITIALIZATION', {
      component: 'getAllSpotcheckFunctions',
      action: 'fetchFunctions',
      domainName,
      errorMessage: error?.message,
    });
    console.error('Error fetching spotcheck functions:', error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

// Synchronous: trackScreen must reach execute in the same tick as a following trackEvent.
const refreshVisitor = () => {
  try {
    spotcheckStore.dispatch({ params: { visitor: getVisitorInfo() } });
  } catch {}
};

// Init retry: a failed init (e.g. offline at launch) is retried on the next track call.
const INIT_RETRY_GAP_MS = 10000;
let lastInitParams: SpotcheckProps | null = null;
let initStatus: 'idle' | 'running' | 'done' | 'failed' = 'idle';
let lastInitAttempt = 0;

const retryInitIfFailed = () => {
  if (initStatus !== 'failed' || !lastInitParams) return;
  if (Date.now() - lastInitAttempt < INIT_RETRY_GAP_MS) return;
  initializeSpotChecks(lastInitParams).catch(() => {});
};

export const initializeSpotChecks = async (params: SpotcheckProps): Promise<void> => {
  lastInitParams = params;
  initStatus = 'running';
  lastInitAttempt = Date.now();
  try {
    setListener(params?.listener);
    if (params?.domainName) spotcheckStore.dispatch({ params: { domainName: params.domainName } });
    await loadDeviceInfo();
    refreshVisitor();
    const device = await getDeviceFacts();
    await getAllSpotcheckFunctions(params.domainName);
    const { listener, ...initParams } = params;
    await execute('initializeSpotcheckComponent', { ...initParams, framework: FRAMEWORK, device });
    await markInitialized();
    initStatus = 'done';
  } catch (error: any) {
    // Legacy never threw into the host app; failures go to the backend and the console.
    console.error('Error initializing spotchecks:', error);
    initStatus = 'failed';
  }
};

const resolveTrackOptions = (input?: TrackScreenOptions) => ({
  variables: input?.variables ?? {},
  customProperties: input?.customProperties ?? {},
  userDetails: input?.userDetails ?? {},
});

export async function trackScreen(screen: string, options?: TrackScreenOptions): Promise<void>;
export async function trackScreen(props: TrackScreenProps): Promise<void>;
export async function trackScreen(screenOrProps: string | TrackScreenProps, optionsArg?: TrackScreenOptions) {
  const screen = typeof screenOrProps === 'string' ? screenOrProps : screenOrProps?.screen;
  const options = resolveTrackOptions(typeof screenOrProps === 'string' ? optionsArg : screenOrProps?.options);
  if (!screen) {
    console.error('trackScreen: `screen` is required');
    return;
  }
  addBreadcrumb('trackScreen', { screen });
  retryInitIfFailed();
  try {
    refreshVisitor();
    await execute('trackScreen', { screen, options });
  } catch (error) {
    // Legacy only logged; never throw into the host app.
    console.error('Error tracking screen:', error);
  }
}

export async function trackEvent(screen: string, event: Record<string, any>, options?: TrackScreenOptions): Promise<void>;
export async function trackEvent(props: TrackEventProps): Promise<void>;
export async function trackEvent(
  screenOrProps: string | TrackEventProps,
  eventArg?: Record<string, any>,
  optionsArg?: TrackScreenOptions,
) {
  const isString = typeof screenOrProps === 'string';
  const screen = isString ? screenOrProps : screenOrProps?.screen;
  const event = isString ? eventArg : screenOrProps?.event;
  if (!screen) {
    console.error('trackEvent: `screen` is required');
    return;
  }
  if (event == null) {
    console.error('trackEvent: `event` is required');
    return;
  }
  const options = resolveTrackOptions(isString ? optionsArg : screenOrProps.options);
  addBreadcrumb('trackEvent', { screen, event: Object.keys(event || {}).join(',') });
  retryInitIfFailed();
  try {
    await execute('trackEvent', { screen, event, options });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Closes any open spotcheck and its button (screen changes the SDK can't detect).
export async function closeSpotChecks(): Promise<void> {
  addBreadcrumb('closeSpotChecks', {});
  await execute('handleNavigationChange', { reason: 'close' });
}
