import Foundation
import Capacitor

@objc(SurveySparrowIonicPluginPlugin)
public class SurveySparrowIonicPluginPlugin: CAPPlugin, CAPBridgedPlugin {
    
    public let identifier = "SurveySparrowIonicPluginPlugin"
    public let jsName = "SurveySparrowIonicPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    
    private let implementation = SurveySparrowIonicPlugin()
    
    @objc public func loadFullScreenSurvey(_ call: CAPPluginCall) {
        
        let domain = call.getString("domain") as? String
        let token = call.getString("token") as? String
        let params = call.getObject("params") as? [String : String]
        let properties = call.getObject("properties") as? [String : Any]

        DispatchQueue.main.async {
            self.implementation.loadFullScreenSurvey(domain: domain, token: token, params: params, properties: properties)
        }
    
    }
    
    @objc public func loadFullScreenSurveyWithValidation(_ call: CAPPluginCall) {

        let domain = call.getString("domain") as? String
        let token = call.getString("token") as? String
        let params = call.getObject("params") as? [String : String]
        let properties = call.getObject("properties") as? [String : Any]

        DispatchQueue.main.async {
            self.implementation.loadFullScreenSurveyWithValidation(domain: domain, token: token, params: params, properties: properties)
        }
    }
}


// ?? self.domain ?? self.token as? [String: String] ?? self.params as? [String: Any] ?? self.properties
