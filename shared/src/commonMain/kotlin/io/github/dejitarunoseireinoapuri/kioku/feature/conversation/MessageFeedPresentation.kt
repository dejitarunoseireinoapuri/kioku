package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

internal data class MessageFeedPresentation(
    val state: TextConversationState,
    val sources: Map<Long, String>,
    val forgottenText: String?,
)
