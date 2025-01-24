import XCTest
import Capacitor
@testable import SurveySparrowIonicPluginPlugin

class SurveySparrowIonicPluginPluginTests: XCTestCase {
    
    var plugin: SurveySparrowIonicPluginPlugin!
    var mockCall: CAPPluginCall!
    
    override func setUp() {
        super.setUp()
        plugin = SurveySparrowIonicPluginPlugin()
    }
    
    override func tearDown() {
        plugin = nil
        mockCall = nil
        super.tearDown()
    }
    
    func testLoadFullScreenSurvey() {
        
        let domain = "gokulkrishnaraju1183.surveysparrow.com"
        let token = "tt-ChaSVQWRDF7"
        let params: [String: String] = ["emailaddress": "email@email.com", "email": "email@email.com"]
        let properties: [String: Any] = [
            "sparrowLang": "en",
            "isCloseButtonEnabled": true
        ]
        
        mockCall = CAPPluginCall(callbackId: "testCallbackId", options: [
            "domain": domain,
            "token": token,
            "params": params,
            "properties": properties
        ], success: { result, _ in
            XCTAssertNotNil(result)
        }, error: { error in
            XCTAssertNil(error)
        })
        
        plugin.loadFullScreenSurvey(mockCall)
        
        XCTAssertNotNil(plugin)
    }
    
    func testLoadFullScreenSurveyWithValidation() {
        
        let domain = "gokulkrishnaraju1183.surveysparrow.com"
        let token = "tt-ChaSVQWRDF7"
        let params: [String: String] = ["emailaddress": "email@email.com", "email": "email@email.com"]
        let properties: [String: Any] = [
            "sparrowLang": "en",
            "isCloseButtonEnabled": true
        ]
        
        mockCall = CAPPluginCall(callbackId: "testCallbackId", options: [
            "domain": domain,
            "token": token,
            "params": params,
            "properties": properties
        ], success: { result, _ in
            XCTAssertNotNil(result)
        }, error: { error in
            XCTAssertNil(error)
        })
        
        plugin.loadFullScreenSurveyWithValidation(mockCall)
        
        XCTAssertNotNil(plugin)
    }
}
