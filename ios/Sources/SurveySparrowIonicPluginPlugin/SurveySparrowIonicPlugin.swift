import Foundation

@objc public class SurveySparrowIonicPlugin: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
