import { registerPlugin } from '@capacitor/core';

import type { SurveySparrowIonicPluginPlugin } from './definitions';

const SurveySparrowIonicPlugin = registerPlugin<SurveySparrowIonicPluginPlugin>('SurveySparrowIonicPlugin');

export * from './definitions';
export { SurveySparrowIonicPlugin };

export * from './spotchecks/lib/public-api';
