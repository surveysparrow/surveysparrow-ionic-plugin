import axios from 'axios';

import { SPOTCHECK_INIT_FRAMEWORK } from '../constants';
import { componentStore } from '../state/component-store';
import { functionStore } from '../state/function-store';

import { captureP0Error } from './sentry';
import { resetWebViewInjectionTracker } from './webview-injection-tracker';

export async function getAllSpotcheckFunctions(domainName: string): Promise<unknown> {
  resetWebViewInjectionTracker();
  const url = `https://${domainName}/api/internal/spotcheck/mobile/init?framework=${SPOTCHECK_INIT_FRAMEWORK}`;
  try {
    const response = await axios.get(url);
    const { componentSchemas, ...functions } = response.data;
    functionStore.dispatch({ ...(functions as object), isLoaded: true } as any);
    if (componentSchemas) {
      componentStore.dispatch({
        schemas: componentSchemas,
        isLoaded: true,
      });
    }
    return response.data;
  } catch (error: unknown) {
    captureP0Error(error, 'SPOTCHECK_INITIALIZATION', {
      component: 'getAllSpotcheckFunctions',
      action: 'fetchFunctions',
      domainName,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
