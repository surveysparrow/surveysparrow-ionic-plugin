// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SurveysparrowIonicPlugin",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "SurveysparrowIonicPlugin",
            targets: ["SurveySparrowIonicPluginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/surveysparrow/surveysparrow-ios-sdk.git", exact: "1.0.6"),
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "SurveySparrowIonicPluginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "SurveySparrowSdk", package: "surveysparrow-ios-sdk")
            ],
            path: "ios/Sources/SurveySparrowIonicPluginPlugin"),
        .testTarget(
            name: "SurveySparrowIonicPluginPluginTests",
            dependencies: ["SurveySparrowIonicPluginPlugin"],
            path: "ios/Tests/SurveySparrowIonicPluginPluginTests")
    ]
)