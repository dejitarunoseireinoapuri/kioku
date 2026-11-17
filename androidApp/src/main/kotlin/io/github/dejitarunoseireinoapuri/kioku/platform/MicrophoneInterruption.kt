package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.Context
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioRecordingConfiguration

/** Observe only this recorder; OS silencing must not leave a falsely active voice session. */
internal class MicrophoneInterruption(
    private val recorder: AudioRecord,
    context: Context,
    onSilenced: () -> Unit,
) : AutoCloseable {
    private val callback =
        object : AudioManager.AudioRecordingCallback() {
            override fun onRecordingConfigChanged(configs: List<AudioRecordingConfiguration>) {
                if (configs.any { it.isClientSilenced } &&
                    recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING
                ) {
                    onSilenced()
                }
            }
        }

    init {
        recorder.registerAudioRecordingCallback(context.mainExecutor, callback)
    }

    override fun close() {
        recorder.unregisterAudioRecordingCallback(callback)
    }
}
