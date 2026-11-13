import Foundation
import FirebaseAuth
import FirebaseFunctions
import KiokuShared

final class AppleMemoryPort: NSObject, NativeMemoryPort {
    private let auth: Auth
    private let functions: Functions

    init(auth: Auth, functions: Functions) {
        self.auth = auth
        self.functions = functions
    }

    func requestId() -> String { UUID().uuidString.lowercased() }
    func timeZone() -> String { TimeZone.current.identifier }

    func call(endpoint: MemoryEndpoint, json: String,
              completion: @escaping (NativeMemoryReply) -> KotlinUnit) -> any NativeCancellation {
        let name: String
        switch endpoint {
        case .submit: name = "submitTurn"
        case .clarify: name = "resolveClarification"
        default: name = "getOperation"
        }
        guard let uid = auth.currentUser?.uid, let bytes = json.data(using: .utf8),
              let payload = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any] else {
            _ = completion(NativeMemoryReplyFailed(issue: .denied))
            return AccountCancellation {}
        }
        var cancelled = false
        let callable = functions.httpsCallable(name)
        callable.timeoutInterval = 185
        callable.call(payload) { [weak self] result, error in
            guard !cancelled, self?.auth.currentUser?.uid == uid else { return }
            if let error = error as NSError? {
                _ = completion(NativeMemoryReplyFailed(issue: Self.issue(error)))
            } else if let value = result?.data, JSONSerialization.isValidJSONObject(value),
                      let data = try? JSONSerialization.data(withJSONObject: value),
                      let text = String(data: data, encoding: .utf8) {
                _ = completion(NativeMemoryReplyReceived(json: text))
            } else {
                _ = completion(NativeMemoryReplyFailed(issue: .unavailable))
            }
        }
        return AccountCancellation { cancelled = true }
    }

    private static func issue(_ error: NSError) -> CaptureIssue {
        guard error.domain == FunctionsErrorDomain else { return .unavailable }
        switch error.code {
        case FunctionsErrorCode.permissionDenied.rawValue, FunctionsErrorCode.unauthenticated.rawValue: return .denied
        case FunctionsErrorCode.invalidArgument.rawValue: return .invalid
        case FunctionsErrorCode.resourceExhausted.rawValue: return .limited
        case FunctionsErrorCode.failedPrecondition.rawValue: return .notConfigured
        default: return .unavailable
        }
    }
}
