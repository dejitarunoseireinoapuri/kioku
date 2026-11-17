package io.github.dejitarunoseireinoapuri.kioku.platform

import android.os.ParcelFileDescriptor

/** An owned PCM stream; finish closes its writer, cancel also closes its reader. */
internal interface VoiceAudio {
    val source: ParcelFileDescriptor
    val sampleRate: Int

    fun start(onFailure: () -> Unit)

    fun finish()

    fun cancel()
}
