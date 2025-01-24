export interface SurveySparrowIonicPluginPlugin {
  
    loadFullScreenSurvey(options: {
      domain: String;
      token: String;
      params: Array<Object>;
      properties: Object;
    }): Promise<void>;
  
    loadFullScreenSurveyWithValidation(options: {
      domain: String;
      token: String;
      params: Array<Object>;
      properties: Object;
    }): Promise<void>;
  
}
