import Foundation
import FirebaseAuth
import FirebaseFunctions
import KiokuShared

final class AppleMemoryPort: NSObject, NativeMemoryPort {
    private let auth: Auth
    private let functions: Functions
    private var generation: (uid: String, value: String)?

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
        case .submit: name = "submit"
        case .clarify: name = "clarify"
        case .operation: name = "operation"
        case .query: name = "query"
        case .source: name = "source"
        case .sourceDetails: name = "details"
        case .change: name = "change"
        case .routeMessage: name = "route"
        case .applyMessage: name = "apply"
        default:
            _ = completion(NativeMemoryReplyFailed(issue: .invalid))
            return AccountCancellation {}
        }
        guard let uid = auth.currentUser?.uid, let bytes = json.data(using: .utf8),
              let payload = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any] else {
            _ = completion(NativeMemoryReplyFailed(issue: .denied))
            return AccountCancellation {}
        }
        var cancelled = false
        resolveGeneration(uid: uid) { [weak self] current, issue in
            guard !cancelled, let self, self.auth.currentUser?.uid == uid else { return }
            guard let current else {
                _ = completion(NativeMemoryReplyFailed(issue: issue ?? .unavailable))
                return
            }
            let callable = self.functions.httpsCallable("memoryV2")
            callable.timeoutInterval = 185
            callable.call(["apiVersion": 2, "operation": name, "generation": current, "payload": payload]) { [weak self] result, error in
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
        }
        return AccountCancellation { cancelled = true }
    }

    private func resolveGeneration(uid: String, completion: @escaping (String?, CaptureIssue?) -> Void) {
        if let current = generation, current.uid == uid {
            completion(current.value, nil)
            return
        }
        functions.httpsCallable("memoryV2").call(["apiVersion": 2, "operation": "state"]) { [weak self] result, error in
            guard let self, self.auth.currentUser?.uid == uid else { return }
            if let error = error as NSError? {
                completion(nil, Self.issue(error))
            } else if let value = result?.data as? [String: Any], value["apiVersion"] as? Int == 2,
                      let current = value["generation"] as? String, UUID(uuidString: current) != nil {
                self.generation = (uid, current)
                completion(current, nil)
            } else {
                completion(nil, .unavailable)
            }
        }
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
