type Listener = () => void;

// Minimal observable store; components re-render on every change.
export class Store<T> {
  private listeners = new Set<Listener>();

  constructor(private state: T, private reducer: (state: T, update: any) => T) {}

  getState(): T {
    return this.state;
  }

  dispatch(update: any): void {
    this.state = this.reducer(this.state, update);
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('[SpotCheck] store listener failed', error);
      }
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Same shape and merge rules as the other SDKs (backend functions read state.SpotCheckState).
const initialSpotcheckState: any = {
  allSpotChecksInToken: [],
  customEventsSpotChecks: [],
  filteredSpotChecks: [],
  showSpotCheck: false,

  currentSpotcheck: {
    spotcheckURL: '',
    spotcheckID: 0,
    spotcheckContactID: 0,
    triggerToken: '',
    screenName: '',
    afterDelay: 0,
    isChat: false,
    appearance: {},
  },

  params: {
    targetToken: '',
    domainName: '',
    userDetails: {},
    variables: {},
    customProperties: {},
    visitor: {},
    framework: 'ionic',
    userAgent: '',
    traceId: '',
  },

  spotCheckDetails: {
    keyBoardHeight: 0,
    textPosition: 0,
    isMounted: false,
    isVisible: false,
    isExiting: false,
    currentQuestionHeight: 0,
    miniCardHeight: 0,
    sideTabButtonWidth: 0,
    isFullScreenMode: false,
    spotCheckType: null,
    position: 'bottom',
    mode: '',
    closeButton: {
      isEnabled: false,
      color: '#000000',
      isMiniCard: false,
    },
    isSpotCheckButton: false,
    spotCheckButtonConfig: {},
    showSurveyContent: true,
    avatarEnabled: false,
    avatarUrl: '',
    isRTLLanguage: false,
  },

  webViewDetails: {
    isChatEnabled: false,
    isClassicEnabled: false,
    isClassicLoading: true,
    isChatLoading: true,
    chatUrl: null,
    classicUrl: null,
    isCurrentSpotcheckChat: null,
    canShowClassic: false,
    canShowChat: false,
    webViewInjectionData: null,
    chatWebViewRef: null,
    classicWebViewRef: null,
  },
};

const NESTED_KEYS = ['currentSpotcheck', 'spotCheckDetails', 'webViewDetails', 'params'];

const spotcheckReducer = (state: any, update: any) => {
  const payload = update || {};
  const sc = state.SpotCheckState;
  const next: any = { ...sc, ...payload };
  NESTED_KEYS.forEach((key) => {
    next[key] = { ...sc[key], ...(payload[key] || {}) };
  });
  return { SpotCheckState: next };
};

export const spotcheckStore = new Store<any>({ SpotCheckState: initialSpotcheckState }, spotcheckReducer);

export const functionStore = new Store<any>(
  { functionState: { isLoaded: false } },
  (state, update) => ({ functionState: { ...state.functionState, ...(update || {}) } }),
);

export const componentStore = new Store<any>(
  { componentState: { isLoaded: false, schemas: {} } },
  (state, update) => ({ componentState: { ...state.componentState, ...(update || {}) } }),
);
