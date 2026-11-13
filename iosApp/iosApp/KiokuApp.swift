import SwiftUI
import GoogleSignIn

@main
struct KiokuApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .onOpenURL { _ = GIDSignIn.sharedInstance.handle($0) }
        }
    }
}
