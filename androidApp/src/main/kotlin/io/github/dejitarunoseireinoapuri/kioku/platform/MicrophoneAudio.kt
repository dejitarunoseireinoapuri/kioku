package io.github.dejitarunoseireinoapuri.kioku.platform

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

/** Raw samples travel only through a bounded pipe to the local recognizer, never a file or server. */
internal class MicrophoneAudio(
    private val context: Context,
    private val scope: CoroutineScope,
) : VoiceAudio {
    private val pipe = PcmVoicePipe()
    override val source = pipe.source
    override val sampleRate = 16_000
    private val running = AtomicBoolean(false)
    private var recorder: AudioRecord? = null
    private var job: Job? = null
    private var interruption: MicrophoneInterruption? = null

    override fun start(onFailure: () -> Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            throw SecurityException("Microphone permission required")
        }
        val minimum =
            AudioRecord.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
            )
        val record =
            AudioRecord
                .Builder()
                .setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                .setAudioFormat(
                    AudioFormat
                        .Builder()
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .build(),
                ).setBufferSizeInBytes(maxOf(minimum, PCM_BUFFER_BYTES))
                .build()
        recorder = record
        interruption = MicrophoneInterruption(record, context, onFailure)
        check(record.state == AudioRecord.STATE_INITIALIZED)
        record.startRecording()
        running.set(true)
        recordStream(record, onFailure)
    }

    private fun recordStream(
        record: AudioRecord,
        onFailure: () -> Unit,
    ) {
        job =
            scope.launch(Dispatchers.IO) {
                val buffer = ByteArray(PCM_BUFFER_BYTES)
                try {
                    while (running.get()) {
                        val count = record.read(buffer, 0, buffer.size)
                        if (count < 0) {
                            if (running.getAndSet(false)) onFailure()
                        }
                        // stop() can return the last captured samples from a pending read.
                        if (count > 0 && !pipe.write(buffer, count)) running.set(false)
                    }
                } catch (error: CancellationException) {
                    throw error
                } catch (_: Exception) {
                    if (running.get()) onFailure()
                } finally {
                    pipe.finish()
                    record.release()
                }
            }
    }

    override fun finish() {
        running.set(false)
        interruption?.close()
        interruption = null
        recorder?.let {
            if (it.recordingState == AudioRecord.RECORDSTATE_RECORDING) it.stop()
            if (job == null) {
                pipe.finish()
                it.release()
            }
        }
        recorder = null
    }

    override fun cancel() {
        finish()
        pipe.cancel()
        job?.cancel()
    }

    private companion object {
        const val PCM_BUFFER_BYTES = 8192
    }
}
