import { registerPlugin } from '@capacitor/core';

import type { SurveySparrowIonicPlugin } from './definitions';

const SurveySparrowIonicPlugin = registerPlugin<SurveySparrowIonicPlugin>('SurveySparrowIonicPlugin');

export * from './definitions';
export { SurveySparrowIonicPlugin };
