import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(SurveySparrowIonicPlugin2Plugin)
public class SurveySparrowIonicPlugin2Plugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SurveySparrowIonicPlugin2Plugin"
    public let jsName = "SurveySparrowIonicPlugin2"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = SurveySparrowIonicPlugin2()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
}
