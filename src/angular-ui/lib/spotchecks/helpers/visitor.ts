import { Device } from '@capacitor/device';

export interface VisitorInfo {
  deviceType: string;
  operatingSystem: string;
  screenResolution: { width: number; height: number };
  currentDate: Date;
  timezone: string;
}

export function getVisitorInfo(): VisitorInfo {
  const w = typeof window !== 'undefined' ? window.innerWidth : 0;
  const h = typeof window !== 'undefined' ? window.innerHeight : 0;
  return {
    deviceType: 'MOBILE',
    operatingSystem: 'web',
    screenResolution: {
      width: Math.round(w),
      height: Math.round(h),
    },
    currentDate: new Date(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export async function getOperatingSystemLabel(): Promise<string> {
  try {
    const info = await Device.getInfo();
    return info.operatingSystem === 'ios' ? 'iOS' : 'Android';
  } catch {
    return typeof navigator !== 'undefined' ? navigator.platform : 'web';
  }
}
