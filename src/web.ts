import { WebPlugin } from '@capacitor/core';

import type { SurveySparrowIonicPlugin2Plugin } from './definitions';

export class SurveySparrowIonicPlugin2Web extends WebPlugin implements SurveySparrowIonicPlugin2Plugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
