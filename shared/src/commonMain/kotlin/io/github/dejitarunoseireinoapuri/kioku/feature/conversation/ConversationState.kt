package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource

enum class MemoryIntent { Tell, Ask }

enum class PreviewScenario { Ready, Locked, Clarification, Saved, Answer, Offer, Corrected, Offline }

enum class PreviewFeedback { TextOnly, VoiceUnavailable, AcceptedExample, DeclinedExample, ForgetUnavailable }

data class ConversationState(
    val intent: MemoryIntent = MemoryIntent.Tell,
    val scenario: PreviewScenario = PreviewScenario.Ready,
    val draft: String = "",
    val feedback: PreviewFeedback? = null,
    val source: MemorySource? = null,
)

sealed interface ConversationEvent {
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

    data object TryVoice : ConversationEvent

    data class DecideOffer(
        val accept: Boolean,
    ) : ConversationEvent

    data object FinishExample : ConversationEvent

    data object CancelExample : ConversationEvent
}
