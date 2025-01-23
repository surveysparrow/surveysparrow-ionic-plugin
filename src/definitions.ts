export interface SurveySparrowIonicPluginPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
