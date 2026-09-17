export interface SsSpotcheckListener {
  onSurveyLoaded?: (response: Record<string, unknown>) => Promise<void>;
  onSurveyResponse?: (response: Record<string, unknown>) => Promise<void>;
  onPartialSubmission?: (response: Record<string, unknown>) => Promise<void>;
  onCloseButtonTap?: () => Promise<void>;
}

export interface UserDetails {
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: number;
  [key: string]: unknown;
}

export interface Variables {
  sparrowLang?: string;
  [key: string]: unknown;
}

export interface CustomProperties {
  [key: string]: unknown;
}

export interface TrackScreenOptions {
  variables?: Variables;
  customProperties?: CustomProperties;
  userDetails?: UserDetails;
}

export interface SpotcheckProps {
  domainName: string;
  targetToken: string;
  userDetails?: UserDetails;
  variables?: Variables;
  customProperties?: CustomProperties;
  listener?: SsSpotcheckListener;
}

export interface InitializeSpotChecksProps extends SpotcheckProps {}

export interface TrackScreenProps {
  screen: string;
  options?: TrackScreenOptions;
}

export interface TrackEventProps {
  screen: string;
  event: Record<string, unknown>;
  options?: TrackScreenOptions;
}

/** @deprecated Legacy flat shape — prefer TrackScreenProps / SpotcheckProps */
export interface SpotcheckState {
  isVisible: boolean;
  spotcheckPosition: string;
  spotcheckURL: string;
  spotcheckID: number;
  spotcheckContactID: number;
  afterDelay: number;
  maxHeight: number;
  currentQuestionHeight: number;
  isFullScreenMode: boolean;
  isBannerImageOn: boolean;
  triggerToken: string;
  closeButtonStyle: Record<string, string>;
  isCloseButtonEnabled: boolean;
  isSpotPassed: boolean;
  isChecksPassed: boolean;
  customEventsSpotChecks: Record<string, unknown>[];
  targetToken: string;
  domainName: string;
  userDetails: UserDetails;
  variables: Variables;
  customProperties: CustomProperties;
  traceId: string;
  isClassicLoading: boolean;
  isChatLoading: boolean;
  isClassicLoadEventReceived: boolean;
  isChatLoadEventReceived: boolean;
  classicUrl: string;
  chatUrl: string;
  classicWebViewRef: unknown | null;
  chatWebViewRef: unknown | null;
  filteredSpotChecks: Record<string, unknown>[];
  spotCheckType: string;
  isMounted: boolean;
  textPosition: number;
  screenHeight: number;
  keyBoardHeight: number;
  spotChecksMode: string;
  avatarEnabled: boolean;
  avatarUrl: string;
  screenwiseUserDetails: Record<string, UserDetails | undefined>;
}
