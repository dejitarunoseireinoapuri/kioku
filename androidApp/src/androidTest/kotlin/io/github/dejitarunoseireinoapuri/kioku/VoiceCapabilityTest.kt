package io.github.dejitarunoseireinoapuri.kioku

import android.content.Intent
import android.speech.RecognitionSupport
import android.speech.RecognitionSupportCallback
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Metadata only: no microphone, transcript or server. */
class VoiceCapabilityTest {
    @Test fun reportsLocalSpanishSupport() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val completed = CountDownLatch(1)
        var available = false
        var recognizer: SpeechRecognizer? = null
        try {
            instrumentation.runOnMainSync {
                available = SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
                report("LOCAL_RECOGNIZER_AVAILABLE=$available")
                if (!available) {
                    completed.countDown()
                } else {
                    recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
                    val intent =
                        Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                            .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES")
                    recognizer.checkRecognitionSupport(
                        intent,
                        context.mainExecutor,
                        object : RecognitionSupportCallback {
                            override fun onSupportResult(support: RecognitionSupport) {
                                report("LOCAL_INSTALLED_LANGUAGES=${support.installedOnDeviceLanguages}")
                                report("LOCAL_PENDING_LANGUAGES=${support.pendingOnDeviceLanguages}")
                                report("LOCAL_SUPPORTED_LANGUAGES=${support.supportedOnDeviceLanguages}")
                                completed.countDown()
                            }

                            override fun onError(error: Int) {
                                report("LOCAL_SUPPORT_ERROR=$error")
                                completed.countDown()
                            }
                        },
                    )
                }
            }
            assertTrue("Native support check must finish", completed.await(15, TimeUnit.SECONDS))
            assertTrue("Local recognizer required for this fixture device", available)
        } finally {
            instrumentation.runOnMainSync { recognizer?.destroy() }
        }
    }

    private fun report(value: String) {
        InstrumentationRegistry.getInstrumentation().sendStatus(
            2,
            android.os.Bundle().apply {
                putString(
                    "stream",
                    value + "\n",
                )
            },
        )
    }
}
