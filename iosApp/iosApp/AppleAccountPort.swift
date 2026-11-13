import Foundation
import UIKit
import FirebaseAuth
import FirebaseFunctions
import GoogleSignIn
import KiokuShared

final class AccountCancellation: NSObject, NativeCancellation {
    private let action: () -> Void
    init(_ action: @escaping () -> Void) { self.action = action }
    func cancel() { action() }
}

/// All entry points and SDK completions run on the main thread.
final class AppleAccountPort: NSObject, NativeAccountPort {
    private let auth: Auth
    private let functions: Functions
    private let preferences = UserDefaults.standard
    private var generation: Int64 = 0
    private var pending = false
    private var listeners: [UUID: (AccountSession?) -> KotlinUnit] = [:]

    init(auth: Auth, functions: Functions) {
        self.auth = auth
        self.functions = functions
    }

    func observeSession(listener: @escaping (AccountSession?) -> KotlinUnit) -> any NativeCancellation {
        let id = UUID()
        listeners[id] = listener
        let token = auth.addStateDidChangeListener { [weak self] _, _ in
            _ = listener(self?.currentSession())
        }
        return AccountCancellation { [weak self] in
            self?.listeners.removeValue(forKey: id)
            self?.auth.removeStateDidChangeListener(token)
        }
    }

    func signIn(completion: @escaping (SignInResult) -> KotlinUnit) -> any NativeCancellation {
        guard !pending, let presenter = presentingController() else {
            _ = completion(SignInResultFailed(issue: .unavailable))
            return AccountCancellation {}
        }
        pending = true
        generation += 1
        let epoch = generation
        setAccepted(false)
        GIDSignIn.sharedInstance.signIn(withPresenting: presenter) { [weak self] result, error in
            guard let self else { return }
            guard epoch == self.generation else { self.pending = false; return }
            guard error == nil, let user = result?.user, let token = user.idToken?.tokenString else {
                self.pending = false
                let cancelled = (error as NSError?)?.code == GIDSignInErrorCode.canceled.rawValue
                _ = completion(SignInResultFailed(issue: cancelled ? .cancelled : .unavailable))
                return
            }
            let credential = GoogleAuthProvider.credential(withIDToken: token, accessToken: user.accessToken.tokenString)
            self.exchange(credential, epoch: epoch, completion: completion)
        }
        return AccountCancellation { [weak self] in
            if self?.generation == epoch { self?.signOut() }
        }
    }

    private func exchange(_ credential: AuthCredential, epoch: Int64,
                          completion: @escaping (SignInResult) -> KotlinUnit) {
        auth.signIn(with: credential) { [weak self] _, error in
            guard let self else { return }
            self.pending = false
            guard epoch == self.generation else { try? self.auth.signOut(); return }
            guard error == nil else {
                try? self.auth.signOut()
                _ = completion(SignInResultFailed(issue: .unavailable))
                return
            }
            self.setAccepted(true)
            _ = completion(SignInResultCompleted.shared)
        }
    }

    func signOut() {
        generation += 1
        setAccepted(false)
        try? auth.signOut()
        GIDSignIn.sharedInstance.signOut()
    }

    func loadConfiguration(completion: @escaping (ConfigurationResult) -> KotlinUnit) -> any NativeCancellation {
        var cancelled = false
        let callable = functions.httpsCallable("getConfiguration")
        callable.timeoutInterval = 15
        callable.call(["apiVersion": 1]) { result, error in
            guard !cancelled else { return }
            if let error = error as NSError? {
                let denied = error.domain == FunctionsErrorDomain && error.code == FunctionsErrorCode.permissionDenied.rawValue
                _ = completion(ConfigurationResultFailed(issue: denied ? .denied : .unavailable))
            } else {
                _ = completion(Self.parseConfiguration(result?.data))
            }
        }
        return AccountCancellation { cancelled = true }
    }

    private static func parseConfiguration(_ data: Any?) -> ConfigurationResult {
        guard let value = data as? [String: Any], Set(value.keys) == Set(["apiVersion", "account", "ai", "revision"]),
              (value["apiVersion"] as? NSNumber)?.doubleValue == 1,
              value["account"] as? String == "authorized", let revision = value["revision"] as? NSNumber,
              revision.doubleValue >= 0, revision.doubleValue.rounded(.towardZero) == revision.doubleValue,
              let ai = value["ai"] as? String, ["ready", "notConfigured"].contains(ai) else {
            return ConfigurationResultFailed(issue: .unavailable)
        }
        return ConfigurationResultLoaded(ai: ai == "ready" ? .ready : .notConfigured)
    }

    private func currentSession() -> AccountSession? {
        guard preferences.bool(forKey: "kiokuSessionAccepted"), let user = auth.currentUser else { return nil }
        return AccountSession(id: user.uid, generation: generation, label: user.email ?? "")
    }

    private func setAccepted(_ accepted: Bool) {
        preferences.set(accepted, forKey: "kiokuSessionAccepted")
        let session = currentSession()
        for listener in Array(listeners.values) { _ = listener(session) }
    }

    private func presentingController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        var controller = scene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = controller?.presentedViewController { controller = presented }
        return controller
    }
}
