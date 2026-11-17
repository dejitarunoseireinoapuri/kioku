package io.github.dejitarunoseireinoapuri.kioku.platform

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognitionSupport
import android.speech.RecognitionSupportCallback
import android.speech.SpeechRecognizer
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceObserver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class AndroidVoiceInput internal constructor(
    private val context: Context,
    private val permission: () -> Unit,
    private val audioFactory: ((CoroutineScope) -> VoiceAudio)? = null,
) : VoiceInput {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var generation = 0
    private var observer: VoiceObserver? = null
    private var recognizer: SpeechRecognizer? = null
    private var audio: VoiceAudio? = null
    private var deadline: Job? = null
    private var finishing = false
    private var text = ""
    private var conventionalText = ""

    override fun begin(observer: VoiceObserver) {
        cancel()
        this.observer = observer
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            !SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
        ) {
            fail(VoiceIssue.Unsupported)
        } else if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            fail(VoiceIssue.Permission)
        } else {
            try {
                beginLocal()
            } catch (
                _: SecurityException,
            ) {
                fail(VoiceIssue.Permission)
            } catch (_: Exception) {
                fail(VoiceIssue.Unavailable)
            }
        }
    }

    @RequiresApi(android.os.Build.VERSION_CODES.TIRAMISU)
    private fun beginLocal() {
        val epoch = generation
        val stream = audioFactory?.invoke(scope) ?: MicrophoneAudio(context, scope)
        audio = stream
        val engine = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
        recognizer = engine
        engine.setRecognitionListener(listener(epoch))
        val intent = localSpeechIntent(stream)
        stream.start { scope.launch { if (epoch == generation) fail(VoiceIssue.Interrupted) } }
        observer?.ready()
        deadline =
            scope.launch {
                delay(MAX_CAPTURE_MS)
                if (epoch == generation) fail(VoiceIssue.TooLong)
            }
        engine.checkRecognitionSupport(
            localSpeechSupportIntent(),
            context.mainExecutor,
            object : RecognitionSupportCallback {
                override fun onSupportResult(support: RecognitionSupport) {
                    if (epoch != generation) return
                    if (support.installedOnDeviceLanguages.none { it == "es-ES" || it == "es" }) {
                        fail(VoiceIssue.LanguageMissing)
                    } else {
                        try {
                            engine.startListening(intent)
                        } catch (_: Exception) {
                            fail(VoiceIssue.Unavailable)
                        }
                    }
                }

                override fun onError(error: Int) {
                    if (epoch == generation) fail(VoiceIssue.Unsupported)
                }
            },
        )
    }

    private fun listener(epoch: Int) =
        object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) = Unit

            override fun onBeginningOfSpeech() = Unit

            override fun onRmsChanged(rmsdB: Float) = Unit

            override fun onBufferReceived(buffer: ByteArray?) = Unit

            override fun onEndOfSpeech() = Unit

            override fun onEvent(
                eventType: Int,
                params: Bundle?,
            ) = Unit

            override fun onPartialResults(partialResults: Bundle?) {
                if (epoch == generation) publish(join(text, words(partialResults)))
            }

            override fun onSegmentResults(segmentResults: Bundle) {
                if (epoch != generation) return
                text = join(text, words(segmentResults))
                conventionalText = ""
                publish(text)
            }

            override fun onEndOfSegmentedSession() {
                if (epoch == generation) complete(text.ifBlank { conventionalText })
            }

            override fun onResults(results: Bundle?) {
                if (epoch != generation) return
                conventionalText = words(results)
                // Only the segmented-session end may finalize a caller-owned audio stream.
                publish(join(text, conventionalText))
            }

            override fun onError(error: Int) {
                if (epoch == generation) fail(speechIssue(error))
            }
        }

    private fun publish(value: String) {
        if (value.length > MAX_TRANSCRIPT_CHARS) {
            fail(VoiceIssue.TooLong)
            return
        }
        observer?.partial(value)
    }

    private fun complete(value: String) {
        val target = observer ?: return
        if (value.length > MAX_TRANSCRIPT_CHARS) {
            fail(VoiceIssue.TooLong)
        } else if (!finishing) {
            publish(value)
            fail(VoiceIssue.Interrupted)
        } else {
            cancel()
            target.completed(value)
        }
    }

    private fun fail(issue: VoiceIssue) {
        val target = observer
        cancel()
        target?.failed(issue)
    }

    override fun finish() {
        if (observer == null || finishing) return
        finishing = true
        deadline?.cancel()
        try {
            audio?.finish()
        } catch (_: Exception) {
            fail(VoiceIssue.Interrupted)
            return
        }
        val epoch = generation
        deadline =
            scope.launch {
                delay(FINAL_RESULT_MS)
                if (epoch == generation) fail(VoiceIssue.Interrupted)
            }
    }

    override fun cancel() {
        generation++
        observer = null
        deadline?.cancel()
        recognizer?.cancel()
        recognizer?.destroy()
        recognizer = null
        try {
            audio?.cancel()
        } catch (_: Exception) {
            // Owned descriptors may already be closed.
        }
        audio = null
        finishing = false
        text = ""
        conventionalText = ""
    }

    override fun requestPermission() = permission()

    fun close() {
        cancel()
        scope.cancel()
    }

    private companion object {
        const val MAX_CAPTURE_MS = 300_000L
        const val FINAL_RESULT_MS = 15_000L
        const val MAX_TRANSCRIPT_CHARS = 12_000

        fun words(bundle: Bundle?): String =
            bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()

        fun join(
            first: String,
            second: String,
        ): String = listOf(first, second).filter(String::isNotBlank).joinToString(" ")

        fun speechIssue(code: Int): VoiceIssue =
            when (code) {
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> {
                    VoiceIssue.Permission
                }

                SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> {
                    VoiceIssue.NoSpeech
                }

                SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED, SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> {
                    VoiceIssue.LanguageMissing
                }

                else -> {
                    VoiceIssue.Interrupted
                }
            }
    }
}
