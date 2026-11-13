package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource

enum class MemoryIntent { Tell, Ask }

enum class PreviewScenario { Ready, Locked, Clarification, Saved, Answer, Offer, Corrected, Offline }

enum class PreviewFeedback {
    TextOnly,
    VoiceUnavailable,
    AcceptedExample,
    DeclinedExample,
    ForgetUnavailable,
    QueryUnavailable,
}

data class ConversationState(
    val intent: MemoryIntent = MemoryIntent.Tell,
    val scenario: PreviewScenario = PreviewScenario.Ready,
    val draft: String = "",
    val feedback: PreviewFeedback? = null,
    val source: MemorySource? = null,
    val capture: CaptureOutcome? = null,
    val capturing: Boolean = false,
    val query: QueryState = QueryState(),
) {
    val captureLocked: Boolean
        get() = capturing || capture is CaptureOutcome.Failed || capture == CaptureOutcome.Processing

    val canEdit: Boolean
        get() = scenario != PreviewScenario.Offline && !captureLocked && !query.busy

    val canSwitchIntent: Boolean
        get() = canEdit && capture !is CaptureOutcome.Clarification && !query.awaitingClarification

    val showingCapture: Boolean
        get() = scenario == PreviewScenario.Ready && intent == MemoryIntent.Tell && hasCapture

    val showingQuery: Boolean
        get() = scenario == PreviewScenario.Ready && intent == MemoryIntent.Ask && query.question.isNotEmpty()

    private val hasCapture: Boolean
        get() = capture != null || capturing
}

sealed interface ConversationEvent {
    data class Query(
        val action: QueryAction,
    ) : ConversationEvent

    data class SelectIntent(
        val intent: MemoryIntent,
    ) : ConversationEvent

    data class EditDraft(
        val text: String,
    ) : ConversationEvent

    data class ShowExample(
        val scenario: PreviewScenario,
    ) : ConversationEvent

    data object Submit : ConversationEvent

    data object RecoverCapture : ConversationEvent

    data object TryVoice : ConversationEvent

    data class DecideOffer(
        val accept: Boolean,
    ) : ConversationEvent

    data object FinishExample : ConversationEvent

    data object CancelExample : ConversationEvent
}
