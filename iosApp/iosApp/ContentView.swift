import SwiftUI
import KiokuShared

struct ContentView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.mainViewController(port: FirebaseAccountFactory.port,
            memoryPort: FirebaseAccountFactory.memoryPort, voiceInput: AppleVoiceInput())
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
