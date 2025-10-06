import { registerPlugin } from '@capacitor/core';

import type { SurveySparrowIonicPlugin2Plugin } from './definitions';

const SurveySparrowIonicPlugin2 = registerPlugin<SurveySparrowIonicPlugin2Plugin>('SurveySparrowIonicPlugin2', {
  web: () => import('./web').then((m) => new m.SurveySparrowIonicPlugin2Web()),
});

export * from './spotchecks';
export * from './definitions';
export { SurveySparrowIonicPlugin2 };
