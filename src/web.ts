import { WebPlugin } from '@capacitor/core';

import type { SurveySparrowIonicPluginPlugin } from './definitions';

export class SurveySparrowIonicPluginWeb extends WebPlugin implements SurveySparrowIonicPluginPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
