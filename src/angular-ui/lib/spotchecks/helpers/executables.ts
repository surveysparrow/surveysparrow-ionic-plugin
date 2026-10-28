import { functionStore, spotcheckStore } from '../state/store';
import { saveData, loadData } from './storage';
import { sdkListener } from './listener';
import { captureP0Error, captureP1Error, addBreadcrumb, safeAddBreadcrumb, isReported, registerExecute } from './sentry';
import { SDK_VERSION } from './version';

export const dispatchWrapper = (stateUpdate: any) => {
  try {
    spotcheckStore.dispatch(stateUpdate);
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', { action: 'dispatchWrapper', errorMessage: error?.message });
  }
};

type PendingCall = { functionName: string; params?: any };

const pendingExecutes: PendingCall[] = [];
const MAX_PENDING_EXECUTES = 20;

const isTrackScreenOrEvent = (functionName: string) =>
  functionName === 'trackScreen' || functionName === 'trackEvent';

const flushPendingExecutes = async () => {
  while (pendingExecutes.length > 0) {
    const item = pendingExecutes.shift();
    if (item) await execute(item.functionName, item.params);
  }
};

// Track calls wait until initializeSpotcheckComponent has finished.
let isInitialized = false;

export const markInitialized = async () => {
  isInitialized = true;
  await flushPendingExecutes();
};

// Reporting failures are not reported again (avoids loops).
const isSentryFunction = (functionName: string) => functionName.startsWith('sentry.');

// Style getters run on every render; they would push useful breadcrumbs out.
const isBreadcrumbWorthy = (functionName: string) =>
  !isSentryFunction(functionName) && !/\.get\w*Styles$/.test(functionName);

// Message type only; never survey content.
const describeParams = (functionName: string, params?: any) => {
  if (functionName !== 'webviewComponent.handleWebViewMessage') return {};
  try {
    return { messageType: JSON.parse(params?.event?.nativeEvent?.data)?.type };
  } catch {
    return {};
  }
};

const lookup = (functionName: string): any => {
  let current: any = functionStore.getState().functionState;
  for (const part of functionName.split('.')) current = current?.[part];
  return current;
};

// True when the backend sent this function (dotted path), e.g. for schema `$execute`.
export const hasFunction = (functionName: string): boolean => typeof lookup(functionName) === 'string';

// The SDK has no native keyboard mode to change; the overlay follows the keyboard instead.
const keyboard = {
  pauseDefaultKeyboardBehavior: () => {},
  resumeDefaultKeyboardBehavior: () => {},
};

export const execute = async (functionName: string, params?: any): Promise<any> => {
  let func: any;
  let payload: any;

  try {
    if (isTrackScreenOrEvent(functionName) && !isInitialized) {
      pendingExecutes.push({ functionName, params });
      // Cap the queue while init keeps failing; oldest calls go first.
      if (pendingExecutes.length > MAX_PENDING_EXECUTES) pendingExecutes.shift();
      return null;
    }

    if (!functionStore.getState().functionState.isLoaded) return null;

    const functionString = lookup(functionName);
    if (!functionString || typeof functionString !== 'string') {
      console.error(`Function ${functionName} not found`);
      return null;
    }

    payload = {
      params: { ...params, sdkVersion: SDK_VERSION },
      state: spotcheckStore.getState(),
      dispatchWrapper,
      storage: { saveData, loadData },
      listener: sdkListener,
      sentry: { captureP0Error, captureP1Error, addBreadcrumb: safeAddBreadcrumb },
      keyboard,
    };

    // Fresh evaluation per call like the other SDKs; indirect eval keeps it in global scope.
    func = (0, eval)(`(${functionString})`);
    if (isBreadcrumbWorthy(functionName)) {
      addBreadcrumb('execute', { functionName, ...describeParams(functionName, params) });
    }
  } catch (error: any) {
    if (isSentryFunction(functionName)) return null;
    captureP1Error(error, 'GENERAL', { action: 'execute:setup', functionName, errorMessage: error?.message });
    return null;
  }

  try {
    return await func(payload);
  } catch (error: any) {
    if (isSentryFunction(functionName)) return null;
    // Skip when the function already reported this error itself.
    if (!isReported(error)) {
      captureP1Error(error, 'GENERAL', { action: 'execute:runtime', functionName, errorMessage: error?.message });
    }
    console.error(`[execute] ${functionName}:`, error);
    return null;
  }
};

registerExecute(execute);
