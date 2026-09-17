import { spotcheckStore, updateState } from '../state/spotcheck-store';
import { functionStore } from '../state/function-store';
import { saveData, loadData } from './storage';
import { captureP0Error, captureP1Error } from './sentry';
import { pauseDefaultKeyboardBehavior, resumeDefaultKeyboardBehavior } from './keyboard';
import type { SsSpotcheckListener } from '../types';
import { SDK_VERSION } from '../constants';
import { getSpotCheckEventListener } from '../SpotCheckEventListener';

const pauseKeyboard = pauseDefaultKeyboardBehavior;
const resumeKeyboard = resumeDefaultKeyboardBehavior;

let spotcheckListener: SsSpotcheckListener = {};

export const setListener = (listener: SsSpotcheckListener) => {
  spotcheckListener = listener || {};
};

function bridgedListener(): SsSpotcheckListener {
  const ev = getSpotCheckEventListener();
  return {
    ...spotcheckListener,
    onSurveyResponse: async (response) => {
      ev.emit('surveyCompleted', response);
      await spotcheckListener.onSurveyResponse?.(response);
    },
    onCloseButtonTap: async () => {
      ev.emit('surveyDismissed');
      await spotcheckListener.onCloseButtonTap?.();
    },
    onSurveyLoaded: async (response) => {
      ev.emit('surveyLoadStarted', response);
      await spotcheckListener.onSurveyLoaded?.(response);
    },
    onPartialSubmission: spotcheckListener.onPartialSubmission,
  };
}

export const dispatchWrapper = (stateUpdate: Record<string, unknown>) => {
  try {
    spotcheckStore.dispatch(updateState(stateUpdate as any));
  } catch (error: unknown) {
    captureP1Error(error, 'GENERAL', {
      action: 'dispatchWrapper',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
};

type PendingCall = { functionName: string; params?: unknown };

const pendingExecutes: PendingCall[] = [];

function isTrackScreenOrEvent(functionName: string): boolean {
  return functionName === 'trackScreen' || functionName === 'trackEvent';
}

export const flushPendingExecutes = async () => {
  while (pendingExecutes.length > 0) {
    const item = pendingExecutes.shift();
    if (item) {
      await execute(item.functionName, item.params);
    }
  }
};

export const execute = async (
  functionName: string,
  params?: unknown
): Promise<unknown> => {
  let func: (...args: unknown[]) => unknown;
  let payload: Record<string, unknown>;

  try {
    const functionState = functionStore.getState();

    if (!functionState.functionState.isLoaded) {
      if (isTrackScreenOrEvent(functionName)) {
        pendingExecutes.push({ functionName, params });
      }
      return null;
    }

    const pathParts = functionName.split('.');
    let functionString: unknown = functionState.functionState as unknown;
    for (const part of pathParts) {
      functionString = (functionString as Record<string, unknown>)?.[part];
    }

    if (!functionString || typeof functionString !== 'string') {
      console.error(`Function ${functionName} not found`);
      return null;
    }

    const baseParams =
      params && typeof params === 'object'
        ? { ...(params as object) }
        : {};
    payload = {
      params: { ...baseParams, sdkVersion: SDK_VERSION },
      state: spotcheckStore.getState(),
      dispatchWrapper,
      storage: { saveData, loadData },
      listener: bridgedListener(),
      sentry: { captureP0Error, captureP1Error },
      keyboard: {
        pauseDefaultKeyboardBehavior: pauseKeyboard,
        resumeDefaultKeyboardBehavior: resumeKeyboard,
      },
    };

    func = eval(`(${functionString})`) as (...args: unknown[]) => unknown;
  } catch (error: unknown) {
    captureP1Error(error, 'GENERAL', {
      action: 'execute:setup',
      functionName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  try {
    const result = await func(payload);
    return result;
  } catch (error: unknown) {
    captureP1Error(error, 'GENERAL', {
      action: 'execute:runtime',
      functionName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    console.error(`[execute] ${functionName}:`, error);
    return null;
  }
};
