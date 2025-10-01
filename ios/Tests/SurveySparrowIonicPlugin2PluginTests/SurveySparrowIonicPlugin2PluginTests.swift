import XCTest
@testable import SurveySparrowIonicPlugin2Plugin

class SurveySparrowIonicPlugin2Tests: XCTestCase {
    func testEcho() {
        // This is an example of a functional test case for a plugin.
        // Use XCTAssert and related functions to verify your tests produce the correct results.

        let implementation = SurveySparrowIonicPlugin2()
        let value = "Hello, World!"
        let result = implementation.echo(value)

        XCTAssertEqual(value, result)
    }
}
