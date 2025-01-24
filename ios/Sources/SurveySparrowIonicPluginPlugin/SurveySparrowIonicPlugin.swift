
import Foundation
import SwiftUI
import SurveySparrowSdk

@objc public class SurveySparrowIonicPlugin: NSObject {
    
    @objc public func loadFullScreenSurvey(domain: String, token: String, params: [String: String],  properties: [String: Any]) {
        FullScreenSurveyView(domain: domain, token: token, params: params, properties: properties)
    }
    
    @objc public func loadFullScreenSurveyWithValidation(domain: String, token: String, params: [String: String],  properties: [String: Any]) {
        FullScreenSurveyWithValidation(domain: domain, token: token, properties: properties, params: params).startFullScreenSurveyWithValidation()
    }
}

struct FullScreenSurveyView: UIViewControllerRepresentable {
    
    var domain: String
    var token: String
    let params: [String: String]
    let properties: [String: Any]
    
    @State private var isSurveyLoaded: Bool = false

    func makeUIViewController(context: Context) -> SsSurveyViewController{
        let ssSurveyViewController = SsSurveyViewController()
        ssSurveyViewController.domain = domain
        ssSurveyViewController.token = token
        ssSurveyViewController.params = params
        ssSurveyViewController.properties = properties
        ssSurveyViewController.getSurveyLoadedResponse = true
        ssSurveyViewController.surveyDelegate = SurveyDelegate()
        return ssSurveyViewController
    }

    func updateUIViewController(_ uiViewController: SsSurveyViewController, context: Context) {}

}

struct FullScreenSurveyWithValidation {
    
    let domain: String?
    let token: String?
    let properties: [String: Any]
    let params: [String: String]?
    
    func startFullScreenSurveyWithValidation() {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            print("Error: Unable to access rootViewController.")
            return
        }
        
        let surveyView = SsSurveyView(properties: properties)
        surveyView.loadFullscreenSurvey(
            parent: rootViewController,
            delegate: SurveyDelegate(),
            domain: domain,
            token: token,
            params: params
        )
    }
}

class SsDelegate: SsSurveyDelegate {
    public func handleSurveyResponse(response: [String: AnyObject]) {
        print(response)
    }
    
    public func handleSurveyLoaded(response: [String: AnyObject]) {
        print(response)
    }
    
    public func handleSurveyValidation(response: [String: AnyObject]) {
        print(response)
    }
    
    public func handleCloseButtonTap() {
        print("CloseButtonTapped")
    }
}
