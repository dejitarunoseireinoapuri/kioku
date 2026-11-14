package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome

sealed interface TextMessage {
    val id: Long

    data class Owner(
        override val id: Long,
        val text: String,
    ) : TextMessage

    data class Result(
        override val id: Long,
        val outcome: TextOutcome,
    ) : TextMessage
}

sealed interface TextStatus {
    data object Idle : TextStatus

    data class Working(
        val command: TextCommand,
    ) : TextStatus

    data class Ready(
        val command: TextCommand,
        val outcome: TextOutcome,
    ) : TextStatus
}

data class TextConversationState(
    val messages: List<TextMessage> = emptyList(),
    val status: TextStatus = TextStatus.Idle,
    val source: MemorySource? = null,
    val sourceLoading: Boolean = false,
) {
    val busy: Boolean get() = status is TextStatus.Working
    val outcome: TextOutcome? get() = (status as? TextStatus.Ready)?.outcome
    val confirmingForget: Boolean get() = outcome is TextOutcome.ConfirmForget
    val acceptingInput: Boolean get() = !busy && !processing && !confirmingForget
    val clarification: Boolean get() =
        when (val result = outcome) {
            is TextOutcome.Clarification -> true
            is TextOutcome.Captured -> result.capture is CaptureOutcome.Clarification
            is TextOutcome.Asked -> (result.answer as? QueryOutcome.Reply)?.status == AnswerStatus.Clarification
            else -> false
        }
    val processing: Boolean get() =
        outcome == TextOutcome.Processing ||
            (outcome as? TextOutcome.Captured)?.capture == CaptureOutcome.Processing
}

enum class MessageAction { Retry, Restart, Accept, Reject, ConfirmForget, CancelForget, Reset }

internal val MemoryIntent.textIntent: TextIntent
    get() = if (this == MemoryIntent.Ask) TextIntent.Ask else TextIntent.Tell

internal fun TextOutcome.references(): List<String> =
    when (this) {
        is TextOutcome.Asked -> (answer as? QueryOutcome.Reply)?.sources?.map { it.sourceId }.orEmpty()
        is TextOutcome.Offered -> (answer as? QueryOutcome.Reply)?.sources?.map { it.sourceId }.orEmpty()
        is TextOutcome.Captured -> listOfNotNull((capture as? CaptureOutcome.Saved)?.source?.id)
        else -> emptyList()
    }
