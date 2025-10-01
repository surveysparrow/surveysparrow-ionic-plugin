// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SurveysparrowIonicPlugin2",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "SurveysparrowIonicPlugin2",
            targets: ["SurveySparrowIonicPlugin2Plugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "SurveySparrowIonicPlugin2Plugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/SurveySparrowIonicPlugin2Plugin"),
        .testTarget(
            name: "SurveySparrowIonicPlugin2PluginTests",
            dependencies: ["SurveySparrowIonicPlugin2Plugin"],
            path: "ios/Tests/SurveySparrowIonicPlugin2PluginTests")
    ]
)