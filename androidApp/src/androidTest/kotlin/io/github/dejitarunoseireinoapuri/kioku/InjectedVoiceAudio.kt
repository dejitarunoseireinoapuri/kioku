package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.platform.PcmVoicePipe
import io.github.dejitarunoseireinoapuri.kioku.platform.VoiceAudio
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicBoolean

/** A fake microphone feeding real local recognition, including a four-second PCM silence. */
internal class InjectedVoiceAudio(
    private val scope: CoroutineScope,
    private val first: SpeechFixturePcm,
    private val second: SpeechFixturePcm,
) : VoiceAudio {
    private val pipe = PcmVoicePipe()
    override val source = pipe.source
    override val sampleRate = first.sampleRate
    private var job: Job? = null
    private val active = AtomicBoolean(true)
    val fed = CountDownLatch(1)

    override fun start(onFailure: () -> Unit) {
        require(second.sampleRate == sampleRate)
        job =
            scope.launch(Dispatchers.IO) {
                try {
                    if (!feed(first.bytes)) return@launch
                    if (!feed(ByteArray(sampleRate * SILENCE_SECONDS * PCM_BYTES_PER_SAMPLE))) return@launch
                    if (!feed(second.bytes)) return@launch
                    if (!feed(ByteArray(sampleRate * SILENCE_SECONDS * PCM_BYTES_PER_SAMPLE))) return@launch
                    // Keep the pipe open until explicit finish, after paced hardware-like capture.
                    fed.countDown()
                } catch (error: CancellationException) {
                    throw error
                } catch (_: Exception) {
                    if (active.get()) onFailure()
                }
            }
    }

    private suspend fun feed(bytes: ByteArray): Boolean {
        val chunkBytes = sampleRate * PCM_BYTES_PER_SAMPLE * CHUNK_MILLIS.toInt() / MILLIS_PER_SECOND
        var offset = 0
        while (offset < bytes.size && active.get()) {
            val end = minOf(offset + chunkBytes, bytes.size)
            if (!pipe.write(bytes.copyOfRange(offset, end))) return false
            // The synthetic microphone's sample clock, not a wait for a test assertion.
            delay(CHUNK_MILLIS)
            offset = end
        }
        return offset == bytes.size
    }

    override fun finish() {
        active.set(false)
        pipe.finish()
        job?.cancel()
    }

    override fun cancel() {
        finish()
        pipe.cancel()
    }

    private companion object {
        const val SILENCE_SECONDS = 4
        const val PCM_BYTES_PER_SAMPLE = 2
        const val CHUNK_MILLIS = 50L
        const val MILLIS_PER_SECOND = 1000
    }
}
