package io.github.dejitarunoseireinoapuri.kioku.domain

sealed interface CaptureCommand {
    val requestId: String
    val text: String

    data class Tell(
        override val requestId: String,
        override val text: String,
        val zone: String,
    ) : CaptureCommand

    data class Clarify(
        override val requestId: String,
        override val text: String,
        val clarificationId: String,
        val revision: Int,
    ) : CaptureCommand
}

enum class CaptureIssue { Unavailable, Denied, Invalid, Limited, NotConfigured, MoreContext }

sealed interface CaptureOutcome {
    data class Saved(
        val source: MemorySource,
        val memoryCount: Int,
    ) : CaptureOutcome

    data class Clarification(
        val id: String,
        val revision: Int,
        val question: String,
    ) : CaptureOutcome

    data class Failed(
        val issue: CaptureIssue,
    ) : CaptureOutcome

    data object Processing : CaptureOutcome

    data object Ignored : CaptureOutcome

    data object Expired : CaptureOutcome
}

interface CaptureRepository {
    fun tell(text: String): CaptureCommand.Tell

    fun clarify(
        text: String,
        id: String,
        revision: Int,
    ): CaptureCommand.Clarify

    suspend fun execute(command: CaptureCommand): CaptureOutcome

    suspend fun recover(requestId: String): CaptureOutcome
}
