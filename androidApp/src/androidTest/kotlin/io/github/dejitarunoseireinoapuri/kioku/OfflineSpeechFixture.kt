package io.github.dejitarunoseireinoapuri.kioku

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Synthesizes fictional input to a private test file using an installed offline voice, without playback. */
internal class OfflineSpeechFixture(
    private val context: Context,
) : AutoCloseable {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private var engine: TextToSpeech? = null
    private val files = mutableListOf<File>()

    fun create(text: String): SpeechFixturePcm {
        if (engine == null) initialize()
        val target = File(context.cacheDir, "synthetic-voice-${UUID.randomUUID()}.wav")
        files.add(target)
        val done = CountDownLatch(1)
        var success = false
        instrumentation.runOnMainSync {
            val tts = requireNotNull(engine)
            tts.setOnUtteranceProgressListener(
                object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) = Unit

                    override fun onDone(utteranceId: String?) {
                        success = true
                        done.countDown()
                    }

                    @Deprecated("Required legacy callback")
                    override fun onError(utteranceId: String?) {
                        done.countDown()
                    }

                    override fun onError(
                        utteranceId: String?,
                        errorCode: Int,
                    ) {
                        done.countDown()
                    }
                },
            )
            check(tts.synthesizeToFile(text, Bundle(), target, "fictional-input") == TextToSpeech.SUCCESS)
        }
        check(done.await(30, TimeUnit.SECONDS) && success) { "Offline synthetic fixture generation failed" }
        return readSpeechFixture(target.readBytes())
    }

    private fun initialize() {
        val initialized = CountDownLatch(1)
        var success = false
        instrumentation.runOnMainSync {
            engine =
                TextToSpeech(context) { status ->
                    success = status == TextToSpeech.SUCCESS
                    initialized.countDown()
                }
        }
        check(initialized.await(15, TimeUnit.SECONDS) && success) { "Offline fixture synthesizer unavailable" }
        instrumentation.runOnMainSync {
            val tts = requireNotNull(engine)
            val voice =
                tts.voices
                    .filter {
                        it.locale.language == "es" && !it.isNetworkConnectionRequired &&
                            !it.features.orEmpty().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)
                    }.sortedBy { if (it.locale.toLanguageTag() == "es-ES") 0 else 1 }
                    .firstOrNull()
            check(voice != null) { "An installed offline Spanish voice is required for this synthetic test" }
            check(tts.setVoice(voice) == TextToSpeech.SUCCESS)
        }
    }

    override fun close() {
        instrumentation.runOnMainSync { engine?.shutdown() }
        files.forEach { it.delete() }
    }
}
