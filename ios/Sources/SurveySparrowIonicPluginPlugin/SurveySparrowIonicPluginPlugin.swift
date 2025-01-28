import Foundation
import Capacitor

@objc(SurveySparrowIonicPluginPlugin)
public class SurveySparrowIonicPluginPlugin: CAPPlugin, CAPBridgedPlugin {
    
    public let identifier = "SurveySparrowIonicPluginPlugin"
    public let jsName = "SurveySparrowIonicPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "loadFullScreenSurvey", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "loadFullScreenSurveyWithValidation", returnType: CAPPluginReturnNone)
    ]
    
    private let implementation = SurveySparrowIonicPlugin()
    
    @objc public func loadFullScreenSurvey(_ call: CAPPluginCall) {
        handleFullScreenSurvey(call, withValidation: false)
    }
    
    @objc public func loadFullScreenSurveyWithValidation(_ call: CAPPluginCall) {
        handleFullScreenSurvey(call, withValidation: true)
    }
    
    private func handleFullScreenSurvey(_ call: CAPPluginCall, withValidation: Bool) {
        guard
            let domain = call.getString("domain"),
            let token = call.getString("token"),
            let params = call.getObject("params") as? [String: String],
            var properties = call.getObject("properties")
        else {
            call.reject("Invalid or missing parameters")
            return
        }
        
        if let langCode = properties["langCode"] {
            properties["sparrowLang"] = langCode
            properties.removeValue(forKey: "langCode")
        } else {
            properties["sparrowLang"] = "en"
        }
        
        DispatchQueue.main.async {
            if withValidation {
                self.implementation.loadFullScreenSurveyWithValidation(domain: domain, token: token, params: params, properties: properties)
            } else {
                self.implementation.loadFullScreenSurvey(domain: domain, token: token, params: params, properties: properties)
            }
        }
    }
}
