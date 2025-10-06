import { InitializeSpotChecksProps, TrackEventProps, TrackScreenProps } from './types';
import { sendTrackScreenRequest, sendTrackEventRequest } from './api';
import { getSpotcheckStateService } from './helpers';

export const initializeSpotChecks = ({
  domainName,
  targetToken,
  userDetails = {},
  variables = {},
  customProperties = {},
}: InitializeSpotChecksProps) => {
  const spotcheckStateService = getSpotcheckStateService();
  spotcheckStateService.setState({
    domainName,
    targetToken,
    userDetails,
    variables,
    customProperties,
  });
};

export const trackScreen = async ({ screen, options }: TrackScreenProps) => {
  try {
    const response = await sendTrackScreenRequest({ screen, options });
    if (response.valid) {
      console.log('Screen Tracking succeeded.');
    } else {
      if ('error' in response) {
        throw new Error(response.error.toString());
      } else {
        throw new Error('Tracking failed without an explicit error.');
      }
    }
  } catch (error: any) {
    console.log(`Screen Tracking Failed. ${error.message}`);
  }
};

export const trackEvent = async ({ screen, event }: TrackEventProps) => {
  try {
    const response = await sendTrackEventRequest({ screen, event });
    if (response.valid) {
      console.log('TrackEvent succeeded.');
    } else {
      if ('error' in response) {
        throw new Error(response.error.toString());
      } else {
        throw new Error('Tracking failed without an explicit error.');
      }
    }
  } catch (error: any) {
    console.log(`Event Tracking Failed. ${error.message}`);
  }
};
