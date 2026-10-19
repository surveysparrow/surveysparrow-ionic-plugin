import { captureP1Error } from './sentry';

// Same key as the legacy Ionic SDK, so existing installs keep their visitor.
const UUID_KEY = 'SurveySparrowUUID';

const uuidV4 = (): string => {
  const c: any = typeof crypto !== 'undefined' ? crypto : null;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const generateTraceId = () => `${uuidV4()}-${Date.now()}`;

export const saveData = async (value: string) => {
  try {
    localStorage.setItem(UUID_KEY, value);
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', { action: 'saveData', errorMessage: error?.message });
  }
};

// isuuid: a new trace id; otherwise the stored visitor UUID.
export const loadData = async (isuuid: boolean = false) => {
  try {
    if (isuuid) return generateTraceId();
    return localStorage.getItem(UUID_KEY) || null;
  } catch (error: any) {
    captureP1Error(error, 'GENERAL', { action: 'loadData', isuuid, errorMessage: error?.message });
    return null;
  }
};
