import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SpotcheckState } from './types';

@Injectable({
  providedIn: 'root',
})
export class SpotcheckStateService {
  private initialState: SpotcheckState = {
    isVisible: false,
    spotcheckPosition: 'bottom',
    spotcheckURL: '',
    spotcheckID: 0,
    spotcheckContactID: 0,
    afterDelay: 0.0,
    maxHeight: 0.5,
    currentQuestionHeight: 0,
    isFullScreenMode: false,
    isBannerImageOn: false,
    triggerToken: '',
    closeButtonStyle: {},
    isCloseButtonEnabled: false,
    isSpotPassed: false,
    isChecksPassed: false,
    customEventsSpotChecks: [],
    targetToken: '',
    domainName: '',
    userDetails: {},
    variables: {},
    customProperties: {},
    traceId: '',
    isClassicLoading: true,
    isChatLoading: true,
    classicUrl: '',
    chatUrl: '',
    classicWebViewRef: null,
    chatWebViewRef: null,
    filteredSpotChecks: [],
    spotCheckType: '',
    isMounted: false,
    textPosition: 0,
    screenHeight: 0,
    keyBoardHeight: 0,
    spotChecksMode: '',
    avatarEnabled: false,
    avatarUrl: '',
    screenwiseUserDetails: {}
  };
  
  private spotcheckState = new BehaviorSubject<SpotcheckState>(this.initialState);
  state$ = this.spotcheckState.asObservable();

  setState(state: Partial<SpotcheckState>) {
    this.spotcheckState.next({ ...this.spotcheckState.value, ...state });
  }
  
  clearState() {
    this.spotcheckState.next(this.initialState);
  }

  getState() {
    return this.spotcheckState.getValue();
  }
}
