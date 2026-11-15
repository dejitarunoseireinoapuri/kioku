package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

/** RAM-only state for an inactive mode. A server revision change invalidates every mode together. */
internal data class TextSessionSnapshot(
    val state: TextConversationState,
    val questions: List<String> = emptyList(),
    val references: List<String> = emptyList(),
    val ownerId: Long? = null,
    val clarifications: Int = 0,
)

internal fun TextConversationState.appending(message: TextMessage): TextConversationState =
    copy(messages = messages + message)
