import {
  execute,
  flushPendingExecutes,
  setListener,
} from './helpers/executables';
import { getAllSpotcheckFunctions } from './helpers/init';
import { captureP0Error, initializeSentry } from './helpers/sentry';
import { getUserAgent } from './helpers/user-agent';
import { getVisitorInfo, getOperatingSystemLabel } from './helpers/visitor';
import {
  getSpotCheckStateSnapshot,
  spotcheckStore,
  updateState,
} from './state/spotcheck-store';
import type {
  SpotcheckProps,
  TrackEventProps,
  TrackScreenOptions,
  TrackScreenProps,
} from './types';

export { SDK_VERSION } from './constants';

function resolveTrackOptions(
  input?: TrackScreenOptions
): Required<
  Pick<TrackScreenOptions, 'variables' | 'customProperties' | 'userDetails'>
> {
  return {
    variables: input?.variables ?? {},
    customProperties: input?.customProperties ?? {},
    userDetails: input?.userDetails ?? {},
  };
}

export const initializeSpotChecks = async (
  params: SpotcheckProps
): Promise<void> => {
  initializeSentry();
  try {
    if (params.listener) {
      setListener(params.listener);
    }
    const userAgent = await getUserAgent();
    const os = await getOperatingSystemLabel();
    const visitor = { ...getVisitorInfo(), operatingSystem: os };
    const prev = getSpotCheckStateSnapshot().params;
    spotcheckStore.dispatch(
      updateState({
        params: {
          ...prev,
          userAgent,
          domainName: params.domainName,
          targetToken: params.targetToken,
          userDetails: params.userDetails ?? {},
          variables: params.variables ?? {},
          customProperties: params.customProperties ?? {},
          visitor,
          framework: 'ionic',
        },
      })
    );
  } catch (error: unknown) {
    captureP0Error(error, 'SDK_INITIALIZATION', {
      action: 'initializeSpotChecks:setup',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  try {
    await getAllSpotcheckFunctions(params.domainName);
    await execute('initializeSpotcheckComponent', params);
    await flushPendingExecutes();
  } catch (error: unknown) {
    captureP0Error(error, 'SPOTCHECK_INITIALIZATION', {
      action: 'initializeSpotChecks',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export async function trackScreen(
  screenOrProps: string | TrackScreenProps,
  optionsArg?: TrackScreenOptions
): Promise<void> {
  const screen =
    typeof screenOrProps === 'string' ? screenOrProps : screenOrProps.screen;
  const options = resolveTrackOptions(
    typeof screenOrProps === 'string'
      ? optionsArg
      : screenOrProps.options
  );
  try {
    await execute('trackScreen', { screen, options });
  } catch (error: unknown) {
    console.error('[Spotcheck] track › trackScreen error', screen, error);
    throw error;
  }
}

export async function trackEvent(
  screenOrProps: string | TrackEventProps,
  eventArg?: Record<string, unknown>,
  optionsArg?: TrackScreenOptions
): Promise<void> {
  let screen: string;
  let event: Record<string, unknown>;
  let options: ReturnType<typeof resolveTrackOptions>;
  if (typeof screenOrProps === 'string') {
    screen = screenOrProps;
    if (eventArg === undefined) {
      throw new Error('trackEvent: `event` is required');
    }
    event = eventArg;
    options = resolveTrackOptions(optionsArg);
  } else {
    screen = screenOrProps.screen;
    if (screenOrProps.event == null) {
      throw new Error('trackEvent: `event` is required');
    }
    event = screenOrProps.event;
    options = resolveTrackOptions(screenOrProps.options);
  }
  try {
    void execute('trackEvent', { screen, event, options });
  } catch (error: unknown) {
    console.error('[Spotcheck] track › trackEvent error', screen, error);
    throw error;
  }
}
