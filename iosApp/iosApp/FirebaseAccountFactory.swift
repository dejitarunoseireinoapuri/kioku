import Foundation
import DeviceCheck
import FirebaseCore
import FirebaseAuth
import FirebaseFunctions
import FirebaseAppCheck
import GoogleSignIn

final class KiokuAppCheckFactory: NSObject, AppCheckProviderFactory {
    func createProvider(with app: FirebaseApp) -> (any AppCheckProvider)? {
        guard DCAppAttestService.shared.isSupported else { return nil }
        return AppAttestProvider(app: app)
    }
}

enum FirebaseAccountFactory {
    static let port: AppleAccountPort? = makePort()

    private static func makePort() -> AppleAccountPort? {
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let options = FirebaseOptions(contentsOfFile: path), options.projectID == "kioku-9454f",
              let clientID = options.clientID, !clientID.isEmpty,
              options.bundleID == Bundle.main.bundleIdentifier else { return nil }
        let schemes = (Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]])?
            .flatMap { $0["CFBundleURLSchemes"] as? [String] ?? [] } ?? []
        guard schemes.contains(clientID.split(separator: ".").reversed().joined(separator: ".")) else { return nil }
        AppCheck.setAppCheckProviderFactory(KiokuAppCheckFactory())
        FirebaseApp.configure(name: "kioku", options: options)
        guard let app = FirebaseApp.app(name: "kioku") else { return nil }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        return AppleAccountPort(auth: Auth.auth(app: app), functions: Functions.functions(app: app, region: "europe-west1"))
    }
}
