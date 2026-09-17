import { getVisitorInfo } from '../helpers/visitor';

function mergeNested<T extends Record<string, unknown>>(
  base: T,
  patch: Partial<T> | undefined
): T {
  if (!patch) return base;
  const next = { ...base, ...patch } as T;
  if (patch['currentSpotcheck' as keyof T] !== undefined) {
    (next as any).currentSpotcheck = {
      ...(base as any).currentSpotcheck,
      ...(patch as any).currentSpotcheck,
    };
  }
  if (patch['spotCheckDetails' as keyof T] !== undefined) {
    (next as any).spotCheckDetails = {
      ...(base as any).spotCheckDetails,
      ...(patch as any).spotCheckDetails,
    };
  }
  if (patch['webViewDetails' as keyof T] !== undefined) {
    (next as any).webViewDetails = {
      ...(base as any).webViewDetails,
      ...(patch as any).webViewDetails,
    };
  }
  if (patch['params' as keyof T] !== undefined) {
    (next as any).params = {
      ...(base as any).params,
      ...(patch as any).params,
    };
  }
  return next;
}

const webViewInjectedJs = `
  document.addEventListener('focusin', function(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      var rect = event.target.getBoundingClientRect();
      var yPosition = rect.y + window.scrollY;
      window.parent.postMessage(JSON.stringify({
        type: 'position',
        y: yPosition
      }), '*');
    }
  });
  window.flutterSpotCheckData = {
    postMessage: function(data) {
      window.parent.postMessage(typeof data === 'string' ? data : JSON.stringify(data), '*');
    }
  };
  (function() {
    const observer = new MutationObserver(function() {
      var input = document.querySelector(".ss-language-selector__select__input input");
      if (input) { input.setAttribute("readonly", "true"); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  (function() {
    var styleTag = document.createElement("style");
    styleTag.innerHTML = '.surveysparrow-chat__wrapper .ss-language-selector--wrapper { margin-right: 45px; } .close-btn-chat--spotchecks { display: none !important; }';
    document.head.appendChild(styleTag);
  })();
`;

export const createInitialSpotCheckState = () => ({
  allSpotChecksInToken: [] as unknown[],
  customEventsSpotChecks: [] as unknown[],
  filteredSpotChecks: [] as unknown[],
  showSpotCheck: false,

  currentSpotcheck: {
    spotcheckURL: '',
    spotcheckID: 0,
    spotcheckContactID: 0,
    triggerToken: '',
    screenName: '',
    afterDelay: 0,
    isChat: false,
    appearance: {} as Record<string, unknown>,
  },

  params: {
    targetToken: '',
    domainName: '',
    userDetails: {} as Record<string, unknown>,
    variables: {} as Record<string, unknown>,
    customProperties: {} as Record<string, unknown>,
    visitor: getVisitorInfo(),
    framework: 'ionic',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    traceId: '',
  },

  spotCheckDetails: {
    keyBoardHeight: 0,
    textPosition: 0,
    isMounted: false,
    isVisible: false,
    isExiting: false,
    currentQuestionHeight: 500,
    miniCardHeight: 0,
    sideTabButtonWidth: 0,
    isFullScreenMode: false,
    spotCheckType: null as string | null,
    position: 'bottom',
    mode: '',
    closeButton: {
      isEnabled: false,
      color: '#000000',
      isMiniCard: false,
    },
    isSpotCheckButton: false,
    spotCheckButtonConfig: {} as Record<string, unknown>,
    showSurveyContent: true,
    avatarEnabled: false,
    avatarUrl: '',
  },

  webViewDetails: {
    isChatEnabled: false,
    isClassicEnabled: false,
    isClassicLoading: true,
    isChatLoading: true,
    chatUrl: null as string | null,
    classicUrl: null as string | null,
    isCurrentSpotcheckChat: null as boolean | null,
    canShowClassic: false,
    canShowChat: false,
    webViewInjectionData: null as unknown,
    scrollEnabled: true,
    webViewConfig: {
      injectedJavaScript: webViewInjectedJs,
      webviewDebuggingEnabled: false,
      geolocationEnabled: true,
      mediaPlaybackRequiresUserAction: false,
      originWhitelist: ['*'],
      allowsInlineMediaPlayback: true,
      javaScriptEnabled: true,
      domStorageEnabled: true,
    },
    chatWebViewRef: null as unknown,
    classicWebViewRef: null as unknown,
  },
});

let spotCheckState = createInitialSpotCheckState();

export type SpotCheckRootState = ReturnType<typeof createInitialSpotCheckState>;

export function updateState(payload: Partial<SpotCheckRootState>) {
  return { type: 'SpotCheckState/updateState' as const, payload };
}

export const spotcheckStore = {
  getState(): { SpotCheckState: SpotCheckRootState } {
    return { SpotCheckState: spotCheckState };
  },

  dispatch(updateStateAction: {
    type: string;
    payload?: Partial<SpotCheckRootState>;
  }) {
    if (updateStateAction.type !== 'SpotCheckState/updateState') return;
    const payload = updateStateAction.payload;
    if (!payload) return;
    spotCheckState = mergeNested(
      spotCheckState as unknown as Record<string, unknown>,
      payload as Record<string, unknown>
    ) as SpotCheckRootState;
    listeners.forEach((fn) => fn());
  },

  reset() {
    spotCheckState = createInitialSpotCheckState();
    listeners.forEach((fn) => fn());
  },
};

const listeners = new Set<() => void>();

export function subscribeSpotcheckState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSpotCheckStateSnapshot(): SpotCheckRootState {
  return spotCheckState;
}
