
import Foundation
import SwiftUI

@objc public class SurveySparrowIonicPlugin: NSObject {
    
    @objc public func loadFullScreenSurvey(domain: String, token: String, params: [String: String],  properties: [String: Any]) {
        DispatchQueue.main.async {
            let ssSurveyViewController = SsSurveyViewController()
            ssSurveyViewController.domain = domain
            ssSurveyViewController.token = token
            ssSurveyViewController.params = params
            ssSurveyViewController.modalPresentationStyle = .fullScreen
            ssSurveyViewController.properties = properties
            ssSurveyViewController.getSurveyLoadedResponse = true
            ssSurveyViewController.surveyDelegate = SsDelegate()
            
            if let topViewController = UIApplication.shared.windows.first?.rootViewController {
                topViewController.present(ssSurveyViewController, animated: true, completion: nil)
            }
        }
    }
    
    @objc public func loadFullScreenSurveyWithValidation(domain: String, token: String, params: [String: String],  properties: [String: Any]) {
        FullScreenSurveyWithValidation(domain: domain, token: token, properties: properties, params: params).startFullScreenSurveyWithValidation()
    }
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
            delegate: SsDelegate(),
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
