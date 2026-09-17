import { Device } from '@capacitor/device';

export async function getUserAgent(): Promise<string> {
  let ua = 'Mozilla/5.0 ';
  try {
    const info = await Device.getInfo();
    const os = info.operatingSystem;
    if (os === 'ios') {
      ua += `(iPhone; CPU iPhone OS like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile`;
    } else {
      ua += `(Linux; Android; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36`;
    }
  } catch {
    ua += typeof navigator !== 'undefined' ? navigator.userAgent : '(compatible; Spotcheck Ionic)';
  }
  return ua;
}
