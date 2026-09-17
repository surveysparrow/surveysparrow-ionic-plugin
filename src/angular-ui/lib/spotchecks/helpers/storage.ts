import { v4 as uuidv4 } from 'uuid';
import { captureP1Error } from './sentry';

const UUID_KEY = 'SurveySparrowUUID';

const generateTraceId = () => `${uuidv4()}-${Date.now()}`;

export const saveData = async (value: string): Promise<void> => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(UUID_KEY, value);
    }
  } catch (error: unknown) {
    captureP1Error(error, 'GENERAL', {
      action: 'saveData',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
};

export const loadData = async (isTraceId = false): Promise<string> => {
  try {
    if (isTraceId) {
      return generateTraceId();
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(UUID_KEY) ?? '';
    }
    return '';
  } catch (error: unknown) {
    captureP1Error(error, 'GENERAL', {
      action: 'loadData',
      isTraceId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return '';
  }
};
