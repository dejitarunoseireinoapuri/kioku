package io.github.dejitarunoseireinoapuri.kioku

import android.Manifest
import android.view.WindowManager
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceObserver
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidVoiceInput
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class LocalVoiceDeviceTest {
    @get:Rule val activity = ActivityScenarioRule(LifecycleTestActivity::class.java)

    @Test fun localSpanishRecognizesFictionalPcmAcrossSilenceAndWaitsForExplicitFinish() {
        activity.scenario.onActivity { it.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        instrumentation.uiAutomation.grantRuntimePermission(context.packageName, Manifest.permission.RECORD_AUDIO)
        OfflineSpeechFixture(context).use { fixtures ->
            val first = fixtures.create("El personaje ficticio Nara quiere visitar el planetario el martes.")
            val second = fixtures.create("También quiere comprar un cuaderno de color violeta.")
            val completed = CountDownLatch(1)
            val provisional = CountDownLatch(1)
            val completions = AtomicInteger()
            var failure: VoiceIssue? = null
            var finalText = ""
            lateinit var input: AndroidVoiceInput
            lateinit var audio: InjectedVoiceAudio
            instrumentation.runOnMainSync {
                input =
                    AndroidVoiceInput(context, {}, {
                        InjectedVoiceAudio(it, first, second).also { stream -> audio = stream }
                    })
                input.begin(
                    object : VoiceObserver {
                        override fun ready() = Unit

                        override fun partial(text: String) {
                            if ("planetario" in text.lowercase()) provisional.countDown()
                        }

                        override fun completed(text: String) {
                            finalText = text
                            completions.incrementAndGet()
                            completed.countDown()
                        }

                        override fun failed(issue: VoiceIssue) {
                            failure = issue
                            completed.countDown()
                        }
                    },
                )
            }
            try {
                assertTrue(
                    "Local recognizer must consume the synthetic PCM stream",
                    audio.fed.await(40, TimeUnit.SECONDS),
                )
                assertNull("No local engine failure", failure)
                assertTrue("Live transcription must arrive before Stop", provisional.await(10, TimeUnit.SECONDS))
                assertEquals("No completion before Stop", 0, completions.get())
                instrumentation.runOnMainSync { input.finish() }
                assertTrue("Explicit finish must return final text", completed.await(20, TimeUnit.SECONDS))
                assertNull(failure)
                val markers = listOf("planetario", "cuaderno", "violeta").map { it in finalText.lowercase() }
                assertTrue(
                    "Both fictional segments must survive the pause; markers=$markers size=${finalText.length}",
                    containsFixture(finalText),
                )
                assertEquals(1, completions.get())
            } finally {
                instrumentation.runOnMainSync { input.close() }
            }
        }
    }

    private fun containsFixture(text: String): Boolean {
        val normalized = text.lowercase()
        return listOf("planetario", "cuaderno", "violeta").all { it in normalized }
    }
}
