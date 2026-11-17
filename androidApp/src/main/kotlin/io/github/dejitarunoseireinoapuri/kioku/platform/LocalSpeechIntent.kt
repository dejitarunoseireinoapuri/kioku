package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.Intent
import android.media.AudioFormat
import android.speech.RecognizerIntent
import androidx.annotation.RequiresApi

@RequiresApi(android.os.Build.VERSION_CODES.TIRAMISU)
internal fun localSpeechIntent(audio: VoiceAudio): Intent =
    localSpeechSupportIntent()
        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, audio.source)
        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1)
        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
        .putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, audio.sampleRate)
        .putExtra(RecognizerIntent.EXTRA_SEGMENTED_SESSION, RecognizerIntent.EXTRA_AUDIO_SOURCE)

/** Capability checks must not receive or consume the live audio descriptor. */
internal fun localSpeechSupportIntent(): Intent =
    Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES")
        .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
