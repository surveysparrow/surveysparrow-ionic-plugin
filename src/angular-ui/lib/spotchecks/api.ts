import { generateTraceId, getOS, setAppearance } from './helpers';
import { getStoredUUID, setUUID } from './storage';
import { TrackScreenProps, UserDetails, Variables, CustomProperties, TrackEventProps } from './types';
import { getSpotcheckStateService } from './helpers';
import axios from 'axios';

export const sendTrackScreenRequest = async ({
  screen,
  options,
}: TrackScreenProps) => {
  try {
    const spotcheckStateService = getSpotcheckStateService();
    const oldState = spotcheckStateService.getState();
    let variables = { ...oldState.variables } as Variables;
    let customProperties = { ...oldState.customProperties } as CustomProperties;
    let userDetails = { ...oldState.userDetails } as UserDetails;    

    if (options && options.variables && Object.keys(options.variables).length > 0) {
      variables = { ...variables, ...options.variables };
    }
    if (options && options.customProperties && Object.keys(options.customProperties).length > 0) {
      customProperties = { ...customProperties, ...options.customProperties };
    }
    if (options && options.userDetails && Object.keys(options.userDetails).length > 0) {
      userDetails = { ...userDetails, ...options.userDetails };
    }

    let traceId = oldState.traceId;
    if (!traceId) {
      traceId = generateTraceId();
    }

    if (!userDetails.uuid && !userDetails.email && !userDetails.mobile) {
      const uuid = getStoredUUID();
      if (uuid) {
        userDetails.uuid = uuid;
      }
    }

    spotcheckStateService.setState({
      traceId,
      screenwiseUserDetails: {
        [screen]: userDetails
      },
    });

    const state = spotcheckStateService.getState();
    let { isSpotPassed, isChecksPassed } = state;
    const payload = {
      screenName: screen,
      variables: variables,
      userDetails: userDetails,
      visitor: {
        deviceType: 'MOBILE',
        operatingSystem: await getOS(),
        screenResolution: {
          height: window.innerHeight,
          width: window.innerWidth,
        },
        currentDate: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      traceId: state.traceId,
      customProperties: customProperties,
    };

    const url = `https://${state.domainName}/api/internal/spotcheck/widget/${state.targetToken}/properties?isSpotCheck=true&sdk=IONIC`;
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if(response.status === 200) {
      const responseJson = response.data;

      if (responseJson.uuid) {
        setUUID(responseJson.uuid);
      }

      if (responseJson?.show) {
        if (responseJson?.show) {
          const appearance_response = await setAppearance(
            responseJson,
            screen,
            state.domainName,
            traceId,
            variables
          );
          if (appearance_response) {
            isSpotPassed = true;
            spotcheckStateService.setState({ isSpotPassed });
            return { valid: true };
          }
        } else {
          throw new Error('');
        }
      }
    
      if (!isSpotPassed && responseJson?.checkPassed) {
        if (responseJson.checkCondition) {
          const checkCondition = responseJson.checkCondition;
          spotcheckStateService.setState({ afterDelay: checkCondition.afterDelay || 0 });
          if (checkCondition.customEvent) {
            spotcheckStateService.setState({ customEventsSpotChecks: [responseJson] });
            throw new Error('');
          }
        }

        const appearance_response = await setAppearance(
          responseJson,
          screen,
          state.domainName,
          traceId,
          variables
        );
        if (appearance_response) {
          isChecksPassed = true;
          spotcheckStateService.setState({ isChecksPassed });
          return { valid: true };
        }
      }

      if (!isSpotPassed && !isChecksPassed && responseJson?.multiShow != null) {
        if (responseJson.multiShow) {
          spotcheckStateService.setState({ customEventsSpotChecks: responseJson.resultantSpotCheck });

          let selectedSpotCheck = {};
          let minDelay: number = Number.POSITIVE_INFINITY;

          for (const spotcheck of responseJson.resultantSpotCheck) {
            const checks = spotcheck?.checks || {};
            if (Object.keys(checks).length === 0) {
              minDelay = 0;
              selectedSpotCheck = spotcheck;
            } else if (checks.afterDelay != null) {
              const delay = parseFloat(checks.afterDelay);
              if (minDelay > delay) {
                minDelay = delay;
                selectedSpotCheck = spotcheck;
              }
            }
          }

          if (Object.keys(selectedSpotCheck).length > 0) {
            spotcheckStateService.setState({ afterDelay: minDelay });
            const appearance_response = await setAppearance(
              selectedSpotCheck,
              screen,
              state.domainName,
              traceId,
              variables
            );
            if (appearance_response) {
              return { valid: true };
            }
          }
        }
      }

      throw new Error(responseJson?.reason.toString());
    } else {
      throw new Error(`Received status code ${response.status}`);
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};


export const sendTrackEventRequest = async ({ screen, event }: TrackEventProps) => {
  try {
    const intMax = Number.POSITIVE_INFINITY;
    const state = getSpotcheckStateService().getState();
    let selectedSpotCheckID = intMax;
    let { isSpotPassed } = state;
    if (state.customEventsSpotChecks.length > 0) {
      const eventKeys = Object.keys(event);
      for (const spotCheck of state.customEventsSpotChecks) {
        const checks = spotCheck?.['checks'] ?? spotCheck?.['checkCondition'];

        if (checks) {
          const customEvent = checks?.customEvent;

          if (eventKeys.includes(customEvent?.eventName)) {
            selectedSpotCheckID =
              spotCheck?.['id'] ?? spotCheck?.['spotCheckId'] ?? intMax;

            if (selectedSpotCheckID !== intMax) {
              const payload = {
                screenName: screen,
                variables: state.variables,
                userDetails: state.screenwiseUserDetails[screen] || {},
                visitor: {
                  deviceType: 'MOBILE',
                  operatingSystem: await getOS(),
                  screenResolution: {
                    height: window.innerHeight,
                    width: window.innerWidth,
                  },
                  currentDate: new Date().toISOString(),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                spotCheckId: selectedSpotCheckID,
                eventTrigger: {
                  customEvent: event,
                },
                traceId: state.traceId,
                customProperties: state.customProperties,
              };

              const url = `https://${state.domainName}/api/internal/spotcheck/widget/${state.targetToken}/eventTrigger?isSpotCheck=true`;

              try {
                const response = await axios.post(url, payload, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                if (response.status === 200) {
                  const responseJson = response.data;
                  if (responseJson?.show != null) {
                    if (responseJson?.show) {
                      const appearance_response = await setAppearance(
                        responseJson,
                        screen,
                        state.domainName,
                        state.traceId,
                        state.variables
                      );

                      if (appearance_response) {
                        getSpotcheckStateService().setState({ isSpotPassed: true });
                        isSpotPassed = true;
                        return { valid: true };
                      }
                    }
                  }

                  if (!isSpotPassed && responseJson?.eventShow) {
                    if (responseJson?.checkCondition != null) {
                      const checkCondition = responseJson?.checkCondition;
                      getSpotcheckStateService().setState({
                        afterDelay: checkCondition?.afterDelay ?? 0,
                      });

                      if (checkCondition?.customEvent != null) {
                        getSpotcheckStateService().setState({
                          afterDelay: checkCondition?.customEvent?.delayInSeconds ?? 0,
                        });
                      }
                    }

                    const appearance_response = await setAppearance(
                      responseJson,
                      screen,
                      state.domainName,
                      state.traceId,
                      state.variables
                    );

                    if (appearance_response) {
                      return { valid: true };
                    }
                  }

                  throw new Error(responseJson?.reason.toString());
                } else {
                  throw new Error(`Received status code ${response.status}`);
                }
              } catch (error: any) {
                throw new Error(error.message);
              }
            }
          }
        }
      }
      throw new Error('');
    } else {
      throw new Error('');
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};