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
        
        let domain = call.getString("domain")
        let token = call.getString("token")
        let params = call.getObject("params") as? [String : String]
        let properties = call.getObject("properties")

        guard let domain = domain, let token = token, let params = params, let properties = properties else {
            call.reject("Invalid or missing parameters")
            return
        }

        DispatchQueue.main.async {
            self.implementation.loadFullScreenSurvey(domain: domain, token: token, params: params, properties: properties)
        }
    
    }
    
    @objc public func loadFullScreenSurveyWithValidation(_ call: CAPPluginCall) {

        let domain = call.getString("domain")
        let token = call.getString("token")
        let params = call.getObject("params") as? [String : String]
        let properties = call.getObject("properties")
        
        guard let domain = domain, let token = token, let params = params, let properties = properties else {
            call.reject("Invalid or missing parameters")
            return
        }

        DispatchQueue.main.async {
            self.implementation.loadFullScreenSurveyWithValidation(domain: domain, token: token, params: params, properties: properties)
        }
    }
}
