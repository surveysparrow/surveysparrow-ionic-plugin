export interface SsSpotcheckListener {
  onSurveyLoaded?: (response: Record<string, any>) => void | Promise<void>;
  onSurveyResponse?: (response: Record<string, any>) => void | Promise<void>;
  onPartialSubmission?: (response: Record<string, any>) => void | Promise<void>;
  onCloseButtonTap?: () => void | Promise<void>;
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

export interface SpotcheckProps {
  domainName: string;
  targetToken: string;
  userDetails?: UserDetails;
  variables?: Variables;
  customProperties?: CustomProperties;
  listener?: SsSpotcheckListener;
}

// Legacy name for the init options.
export type InitializeSpotChecksProps = SpotcheckProps;

export interface TrackScreenOptions {
  variables?: Variables;
  customProperties?: CustomProperties;
  userDetails?: UserDetails;
}

export interface TrackScreenProps {
  screen: string;
  options?: TrackScreenOptions;
}

export interface TrackEventProps {
  screen: string;
  event: Record<string, any>;
  options?: TrackScreenOptions;
}
