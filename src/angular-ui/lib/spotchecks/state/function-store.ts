const initialFunctionState = {
  isLoaded: false,
  initializeSpotcheckComponent: null as string | null,
  trackScreen: null as string | null,
  trackEvent: null as string | null,
  handleNavigationChange: null as string | null,
  handleExitAnimationComplete: null as string | null,
  closeSpotcheckComponent: null as string | null,
  webviewComponent: {
    handleWebViewMessage: null as string | null,
    handleWebViewError: null as string | null,
    handleWebViewInjection: null as string | null,
    classicWebViewRefCallback: null as string | null,
    chatWebViewRefCallback: null as string | null,
  },
  closeButton: {
    handleCloseButton: null as string | null,
    getCloseButtonStyles: null as string | null,
  },
  wrapper: {
    getWrapperStyles: null as string | null,
  },
  spotCheckButton: {
    handleSpotCheckButtonPress: null as string | null,
    handleSideTabLayout: null as string | null,
    getSpotCheckButtonStyles: null as string | null,
  },
  sentry: {
    processSentryError: null as string | null,
  },
};

type FunctionStateInner = typeof initialFunctionState;

let functionStateInner: FunctionStateInner = { ...initialFunctionState };

const fnListeners = new Set<() => void>();

function mergeFunctionPayload(
  base: FunctionStateInner,
  patch: Partial<FunctionStateInner> & Record<string, unknown>
): FunctionStateInner {
  return {
    ...base,
    ...patch,
    webviewComponent: {
      ...base.webviewComponent,
      ...(patch.webviewComponent as object),
    },
    closeButton: {
      ...base.closeButton,
      ...(patch.closeButton as object),
    },
    wrapper: {
      ...base.wrapper,
      ...(patch.wrapper as object),
    },
    spotCheckButton: {
      ...base.spotCheckButton,
      ...(patch.spotCheckButton as object),
    },
    sentry: {
      ...base.sentry,
      ...(patch.sentry as object),
    },
  };
}

export const functionStore = {
  getState(): { functionState: FunctionStateInner } {
    return { functionState: functionStateInner };
  },

  dispatch(payload: Partial<FunctionStateInner>) {
    functionStateInner = mergeFunctionPayload(functionStateInner, payload);
    fnListeners.forEach((l) => l());
  },

  subscribe(listener: () => void): () => void {
    fnListeners.add(listener);
    return () => fnListeners.delete(listener);
  },
};

