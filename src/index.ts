import { registerPlugin } from '@capacitor/core';

import type { SurveySparrowIonicPluginPlugin } from './definitions';

const SurveySparrowIonicPlugin = registerPlugin<SurveySparrowIonicPluginPlugin>('SurveySparrowIonicPlugin', {
  web: () => import('./web').then((m) => new m.SurveySparrowIonicPluginWeb()),
});

export * from './definitions';
export { SurveySparrowIonicPlugin };
