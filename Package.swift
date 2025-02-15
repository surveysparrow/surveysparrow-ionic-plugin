// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SurveysparrowIonicPlugin",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "SurveysparrowIonicPlugin",
            targets: ["SurveySparrowIonicPluginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "SurveySparrowIonicPluginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/SurveySparrowIonicPluginPlugin"),
        .testTarget(
            name: "SurveySparrowIonicPluginPluginTests",
            dependencies: ["SurveySparrowIonicPluginPlugin"],
            path: "ios/Tests/SurveySparrowIonicPluginPluginTests")
    ]
)