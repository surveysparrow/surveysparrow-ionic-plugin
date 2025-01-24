export interface SurveySparrowIonicPlugin {
  
    loadFullScreenSurvey(options: {
      domain: String;
      token: String;
      params: Array<Object>;
      properties: Object;
    }): Promise<void>;
  
}
