import AVFAudio
import Foundation
import KiokuShared
import Speech
import UIKit

/// Local-only input. No audio file, cloud fallback or spoken response.
final class AppleVoiceInput: NSObject, VoiceInput {
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "es-ES"))
    private var engine: AVAudioEngine?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var observer: (any VoiceObserver)?
    private var generation = 0
    private var finishing = false
    private var tapInstalled = false
    private var deadline: DispatchWorkItem?
    private var notifications: [NSObjectProtocol] = []

    override init() {
        super.init()
        let center = NotificationCenter.default
        notifications.append(center.addObserver(
            forName: UIApplication.willResignActiveNotification, object: nil, queue: .main
        ) { [weak self] _ in self?.cancel() })
        notifications.append(center.addObserver(
            forName: AVAudioSession.interruptionNotification, object: nil, queue: .main
        ) { [weak self] _ in self?.fail(.interrupted) })
    }

    func begin(observer: any VoiceObserver) {
        cancel()
        self.observer = observer
        guard SFSpeechRecognizer.authorizationStatus() == .authorized,
              AVAudioSession.sharedInstance().recordPermission == .granted else {
            fail(.permission)
            return
        }
        guard let recognizer, recognizer.supportsOnDeviceRecognition, recognizer.isAvailable else {
            fail(.unsupported)
            return
        }
        do {
            try startLocal(recognizer)
        } catch {
            fail(.unavailable)
        }
    }

    private func startLocal(_ recognizer: SFSpeechRecognizer) throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement)
        try audioSession.setActive(true)
        let audioRequest = SFSpeechAudioBufferRecognitionRequest()
        audioRequest.requiresOnDeviceRecognition = true
        audioRequest.shouldReportPartialResults = true
        audioRequest.taskHint = .dictation
        request = audioRequest
        let audioEngine = AVAudioEngine()
        engine = audioEngine
        let node = audioEngine.inputNode
        let format = node.outputFormat(forBus: 0)
        guard format.sampleRate > 0, format.channelCount > 0 else { throw LocalVoiceFailure.noInput }
        node.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            audioRequest.append(buffer)
        }
        tapInstalled = true
        let epoch = generation
        task = recognizer.recognitionTask(with: audioRequest) { [weak self] result, error in
            DispatchQueue.main.async {
                guard let self, self.generation == epoch else { return }
                self.receive(result, failed: error != nil)
            }
        }
        audioEngine.prepare()
        try audioEngine.start()
        observer?.ready()
        setDeadline(seconds: 300, issue: .tooLong)
    }

    private func receive(_ result: SFSpeechRecognitionResult?, failed: Bool) {
        if let result {
            let text = result.bestTranscription.formattedString
            guard text.count <= 12_000 else { fail(.tooLong); return }
            observer?.partial(text: text)
            if result.isFinal {
                if finishing {
                    let target = observer
                    cancel()
                    target?.completed(text: text)
                } else {
                    fail(.interrupted)
                }
                return
            }
        }
        if failed { fail(.interrupted) }
    }

    func finish() {
        guard observer != nil, !finishing else { return }
        finishing = true
        stopMicrophone()
        request?.endAudio()
        setDeadline(seconds: 15, issue: .interrupted)
    }

    func cancel() {
        generation += 1
        observer = nil
        deadline?.cancel()
        deadline = nil
        stopMicrophone()
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        finishing = false
    }

    func requestPermission() {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else { return }
            DispatchQueue.main.async {
                if #available(iOS 17.0, *) {
                    AVAudioApplication.requestRecordPermission { _ in }
                } else {
                    AVAudioSession.sharedInstance().requestRecordPermission { _ in }
                }
            }
        }
    }

    private func stopMicrophone() {
        if let engine {
            engine.stop()
            if tapInstalled { engine.inputNode.removeTap(onBus: 0) }
        }
        tapInstalled = false
        engine = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func fail(_ issue: VoiceIssue) {
        let target = observer
        cancel()
        target?.failed(issue: issue)
    }

    private func setDeadline(seconds: Double, issue: VoiceIssue) {
        deadline?.cancel()
        let epoch = generation
        let work = DispatchWorkItem { [weak self] in
            guard let self, self.generation == epoch else { return }
            self.fail(issue)
        }
        deadline = work
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: work)
    }

    deinit {
        cancel()
        notifications.forEach { NotificationCenter.default.removeObserver($0) }
    }
}

private enum LocalVoiceFailure: Error { case noInput }
