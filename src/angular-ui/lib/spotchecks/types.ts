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
  customEventsSpotChecks: Record<string, any>[];
  targetToken: string;
  domainName: string;
  userDetails: UserDetails;
  variables: Variables;
  customProperties: CustomProperties;
  traceId: string;
  isClassicLoading: boolean;
  isChatLoading: boolean;
  classicUrl: string;
  chatUrl: string;
  classicWebViewRef: any | null;
  chatWebViewRef: any | null;
  filteredSpotChecks: Record<string, any>[];
  spotCheckType: String;
  isMounted: boolean;
  textPosition: number;
  screenHeight: number;
  keyBoardHeight: number;
  spotChecksMode: string;
  avatarEnabled: boolean;
  avatarUrl: string;
  screenwiseUserDetails: Record<string, UserDetails | undefined>;
}

export interface UserDetails {
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobile?: number;
  [key: string]: any;
}

export interface Variables {
  sparrowLang?: string;
  [key: string]: any;
}

export interface CustomProperties {
  [key: string]: any;
}

export interface TrackScreenProps {
  screen: string;
  options?: {
    variables?: Variables;
    customProperties?: CustomProperties;
    userDetails?: UserDetails;
  };
}

export interface TrackEventProps {
  screen: string;
  event: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

export interface InitializeSpotChecksProps {
  domainName: string;
  targetToken: string;
  userDetails?: UserDetails;
  variables?: Variables;
  customProperties?: CustomProperties;
}
