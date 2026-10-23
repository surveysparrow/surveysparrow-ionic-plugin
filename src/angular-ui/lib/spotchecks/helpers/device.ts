import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

let deviceInfo: any = null;

const getDeviceInfo = async () => {
  if (deviceInfo) return deviceInfo;
  try {
    deviceInfo = await Device.getInfo();
  } catch {
    deviceInfo = { platform: Capacitor.getPlatform(), operatingSystem: 'unknown', osVersion: '' };
  }
  return deviceInfo;
};

// Legacy Ionic visitor: operatingSystem from @capacitor/device (cached at init), size from the window.
export const getVisitorInfo = () => {
  const info = deviceInfo || {};
  return {
    deviceType: 'MOBILE',
    operatingSystem: info.operatingSystem || 'unknown',
    screenResolution: {
      width: Math.round(window.innerWidth),
      height: Math.round(window.innerHeight),
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

export const loadDeviceInfo = () => getDeviceInfo();

// Raw device facts; the backend keeps the SDK version per app build.
export const getDeviceFacts = async () => {
  const info = await getDeviceInfo();
  const facts: Record<string, unknown> = {
    os: info.platform === 'web' ? 'web' : info.platform,
    osVersion: String(info.osVersion || ''),
    isTablet: false,
    ...(info.model ? { model: String(info.model) } : {}),
  };
  if (Capacitor.isNativePlatform()) {
    try {
      // @capacitor/app is optional; its native plugin registers here when installed.
      const app: any = (Capacitor as any).Plugins?.App;
      const appInfo = app?.getInfo ? await app.getInfo() : null;
      if (appInfo?.version) facts['appVersion'] = String(appInfo.version);
      if (appInfo?.build) facts['appBuild'] = String(appInfo.build);
    } catch {}
  }
  return facts;
};
