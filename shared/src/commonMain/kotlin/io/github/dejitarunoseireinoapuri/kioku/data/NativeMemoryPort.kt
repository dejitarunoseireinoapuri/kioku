package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue

enum class MemoryEndpoint { Submit, Clarify, Operation }

sealed interface NativeMemoryReply {
    data class Received(
        val json: String,
    ) : NativeMemoryReply

    data class Failed(
        val issue: CaptureIssue,
    ) : NativeMemoryReply
}

/** SDK credentials remain native; cancellation discards callbacks without claiming a server rollback. */
interface NativeMemoryPort {
    fun requestId(): String

    fun timeZone(): String

    fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation
}
