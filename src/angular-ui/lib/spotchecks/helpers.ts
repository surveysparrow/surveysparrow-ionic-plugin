import { v4 as uuidv4 } from 'uuid';
import { Device } from '@capacitor/device';
import { SpotcheckState } from './types';
import axios from 'axios';
import { SpotcheckStateService } from './SpotcheckStateService';

let globalSpotcheckStateService: SpotcheckStateService;

export const getSpotcheckStateService = (): SpotcheckStateService => {
  if (!globalSpotcheckStateService) {
    globalSpotcheckStateService = new SpotcheckStateService();
  }
  return globalSpotcheckStateService;
};

export function generateTraceId() {
  const uuidString = uuidv4();
  const timestamp = Date.now();
  return `${uuidString}-${timestamp}`;
}

export const ischatSurvey = (type: String) => {
  return (
    type === 'Conversational' ||
    type === 'CESChat' ||
    type === 'NPSChat' ||
    type === 'CSATChat'
  );
};

export const getOS = async () => {
  const info = await Device.getInfo();
  return info.operatingSystem;
};

export const setAppearance = async (
  responseJson: any,
  screen: string,
  domainName: string,
  traceId: string,
  variables: Record<string, any>
) => {
  try {
    const spotcheckStateService = getSpotcheckStateService();
    let state = spotcheckStateService.getState();

    if (responseJson) {
      const currentSpotcheck = state.filteredSpotChecks.find(
        (spotcheck) =>
          spotcheck['id'] === responseJson?.spotCheckId ||
          spotcheck['id'] === responseJson?.id
      );

      const appearance = responseJson?.appearance;
      let chat = false;

      let updatedState: Partial<SpotcheckState> = {};

      if (appearance) {
        const {
          position,
          closeButton,
          colors,
          cardProperties,
          mode,
          bannerImage,
        } = appearance;
        const { maxHeight } = cardProperties || {};

        updatedState = {
          spotcheckPosition:
            position === 'top_full' || position === 'center_top'
              ? 'top'
              : position === 'center_center'
              ? 'center'
              : 'bottom',
          isCloseButtonEnabled: closeButton ?? true,
          closeButtonStyle: colors?.overrides ?? {},
          maxHeight: maxHeight ? parseFloat(maxHeight) / 100 : 0,
          spotCheckType:
            ischatSurvey(currentSpotcheck?.['survey']?.surveyType) &&
            mode === 'fullScreen'
              ? 'chat'
              : 'classic',
          isFullScreenMode: mode === 'fullScreen',
          isBannerImageOn: bannerImage?.enabled ?? false,
          spotChecksMode: mode,
          avatarEnabled: appearance?.avatar?.enabled ?? false,
          avatarUrl: appearance?.avatar?.avatarUrl ?? '',
        };

        chat = updatedState.spotCheckType === 'chat';
      }

      const spotCheckId = responseJson?.spotCheckId ?? 0;
      const spotCheckContactId =
        responseJson?.spotCheckContactId ??
        responseJson?.spotCheckContact?.id ??
        0;
      const triggerToken = responseJson?.triggerToken ?? '';

      updatedState = {
        ...updatedState,
        spotcheckID: spotCheckId,
        spotcheckContactID: spotCheckContactId,
        triggerToken,
      };

      const baseSpotcheckURL = `https://${domainName}/s/spotcheck/${triggerToken}/${
        chat ? 'config' : 'bootstrap'
      }?spotcheckContactId=${spotCheckContactId}&traceId=${traceId}&spotcheckUrl=${screen}`;

      let fullSpotcheckURL = baseSpotcheckURL;

      Object.entries(variables).forEach(([key, value]) => {
        fullSpotcheckURL += `&${key}=${value}`;
      });

      updatedState.spotcheckURL = fullSpotcheckURL;
      spotcheckStateService.setState(updatedState);

      try {
        const response = await axios.get(fullSpotcheckURL);
        const themeInfo = response.data.config.generatedCSS;
        const theme_payload = { type: 'THEME_UPDATE_SPOTCHECK', themeInfo };
        state = spotcheckStateService.getState();

        let webViewRef = chat ? state.chatWebViewRef : state.classicWebViewRef;
        let isLoading = chat ? state.isChatLoading : state.isClassicLoading;

        const resetStateData = {
          type: 'RESET_STATE',
          state: {
            ...(response.data || {}),
            skip: true,
            spotCheckAppearance: {
              ...(appearance || {}),
              targetType: 'MOBILE',
            },
            spotcheckUrl: screen,
            traceId,
            elementBuilderParams: {
              ...(variables || {}),
            },
          },
        };

        const sendMessageToIframe = (iframe: HTMLIFrameElement, data: any) => {
          if (iframe && iframe.contentWindow) {
            try {
              iframe.contentWindow.postMessage(data, '*');
            } catch (error) {
              console.error('❌ Failed to send message to iframe:', error);
            }
          }
        };

        const communicateWithWebView = async (iframe: HTMLIFrameElement) => {
          await new Promise(resolve => setTimeout(() => {
            sendMessageToIframe(iframe, resetStateData);
            sendMessageToIframe(iframe, theme_payload);
            resolve(true);
          }, 2000));
        };

        if (webViewRef) {
          if (isLoading === false) {
            communicateWithWebView(webViewRef);
            start();
            return true;
          } else {
            // todo: recheck this
            const unsubscribe = spotcheckStateService.state$.subscribe(
              (currentState) => {
                const {
                  isChatLoading,
                  isClassicLoading,
                  chatWebViewRef,
                  classicWebViewRef,
                } = currentState;

                if ((!isChatLoading && chat) || (!isClassicLoading && !chat)) {
                  unsubscribe.unsubscribe();
                  const activeWebViewRef = chat
                    ? chatWebViewRef
                    : classicWebViewRef;
                  if (activeWebViewRef) {
                    communicateWithWebView(activeWebViewRef);
                    start();
                  } else {
                    console.warn(
                      '⚠️ Active WebView ref is null after loading completed'
                    );
                  }
                }
              }
            );
            return true;
          }
        } else {
          const unsubscribeWebView = spotcheckStateService.state$.subscribe(
            (currentState) => {
              const updatedWebViewRef = chat
                ? currentState.chatWebViewRef
                : currentState.classicWebViewRef;
              const updatedIsLoading = chat
                ? currentState.isChatLoading
                : currentState.isClassicLoading;

              if (updatedWebViewRef) {
                if (!updatedIsLoading) {
                  unsubscribeWebView.unsubscribe();
                  communicateWithWebView(updatedWebViewRef);
                  start();
                } else {
                  console.log('⏳ WebView ref available but still loading...');
                }
              }
            }
          );
          return true;
        }
      } catch (error: any) {
        throw new Error(error.message);
      }
    }
    throw new Error('Something went wrong');
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const start = () => {
  const state = getSpotcheckStateService().getState();
  setTimeout(() => {
    getSpotcheckStateService().setState({ isVisible: true });
  }, state.afterDelay * 1000);
};

export const closeSpotCheck = async () => {
  try {
    const stateService = getSpotcheckStateService();
    const state = stateService.getState();
    const payload = {
      traceId: state.traceId,
      triggerToken: state.triggerToken,
    };

    const response = await fetch(
      `https://${state.domainName}/api/internal/spotcheck/dismiss/${state.spotcheckContactID}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.status != 200) {
      console.log(`Error: ${response.status}`);
    }
  } catch (error) {
    console.log('Error parsing JSON:', error);
  }
};

export const handleSurveyEnd = () => {
  const stateService = getSpotcheckStateService();
  const state = stateService.getState();
  const webViewRef =
    state.spotCheckType === 'chat'
      ? state.chatWebViewRef
      : state.classicWebViewRef;

  webViewRef?.current?.injectJavaScript(`
      (function() {
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify({ type: 'UNMOUNT_APP' })}
        }));
      })();
    `);

  const updatedState: Partial<SpotcheckState> = {
    isVisible: false,
    isCloseButtonEnabled: false,
    isFullScreenMode: false,
    spotcheckID: 0,
    currentQuestionHeight: 0,
    closeButtonStyle: {},
    spotcheckContactID: 0,
    spotcheckURL: '',
    spotcheckPosition: 'bottom',
    isMounted: false,
    spotCheckType: '',
    screenHeight: 0,
    keyBoardHeight: 0,
    textPosition: 0,
    spotChecksMode: '',
    avatarEnabled: false,
    avatarUrl: '',
  };

  stateService.setState(updatedState);
};

export const getSpotcheckComponentCssStyles = (state: SpotcheckState) => { 
  let styles = {}
  let wrapperStyles = {}
  let padding = 30;
  if (state.isFullScreenMode && state.isVisible) {
    wrapperStyles = {
      display: 'flex',
      height: '100%',
    };
    styles = {
      display: 'flex',
      height: '100%',
    };
  }
  
  if (state.isVisible && state.isMounted) {

    let height = Math.min(state.currentQuestionHeight, (state.maxHeight * window.innerHeight));
    if(state.spotChecksMode === 'miniCard') {
      padding = 45;
      if(state.avatarEnabled) {
        height = height - 56;
      }
      if(state.isCloseButtonEnabled) {
        height = height - 40;
      }
    }

    switch (state.spotcheckPosition) {
      case 'bottom':
        styles = {
          display: 'flex',
          height: height+'px',
        };
        wrapperStyles = {
          display: 'flex',
          justifyContent: 'flex-end',
        };
        break;
        
        case 'top':
          styles = {
            display: 'flex',
            height: height+'px',
          };
          wrapperStyles = {
            display: 'flex',
            justifyContent: 'flex-start',
          };
        break;
          
        case 'center':
          styles = {
            display: 'flex',
            height: height+'px',
          };
          wrapperStyles = {
            display: 'flex',
            justifyContent: 'center',
          };
        break;
        
      default:
        break;
    }
  }
  
  return {
    wrapperStyles: {
      position: 'fixed', 
      width: '100%', 
      height: '100%', 
      top: '0', 
      left: '0', 
      backgroundColor: 'rgba(0, 0, 0, 0.3)', 
      zIndex: '99999999',
      display: 'none',
      flexDirection: 'column',
      paddingTop: padding+'px',
      paddingBottom: padding+'px',
      ...wrapperStyles
    },
    styles: {
      display: 'none',
      flexDirection: 'column',
      ...styles,
    }
  };
};

export const closeSpotCheckAndHandleSurveyEnd = async () => {
  await closeSpotCheck();
  handleSurveyEnd();
};