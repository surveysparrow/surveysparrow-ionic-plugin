export interface SurveySparrowIonicPluginPlugin {
  
    loadFullScreenSurvey(options: {
      domain: String;
      token: String;
      properties: Object;
    }): Promise<void>;
  
    loadFullScreenSurveyWithValidation(options: {
      domain: String;
      token: String;
      params: Object;
      properties: Object;
    }): Promise<void>;
  
}
