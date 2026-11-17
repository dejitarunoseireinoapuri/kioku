package io.github.dejitarunoseireinoapuri.kioku.domain

enum class VoiceIssue { Unsupported, LanguageMissing, Permission, Interrupted, NoSpeech, TooLong, Unavailable }

/** Local-only transcription. No implementation may substitute a network recognizer. */
interface VoiceInput {
    fun begin(observer: VoiceObserver)

    fun finish()

    fun cancel()

    fun requestPermission()
}

interface VoiceObserver {
    fun ready()

    fun partial(text: String)

    fun completed(text: String)

    fun failed(issue: VoiceIssue)
}
