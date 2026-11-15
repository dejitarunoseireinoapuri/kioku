package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

/** RAM-only state for an inactive mode. A server revision change invalidates every mode together. */
internal data class TextSessionSnapshot(
    val state: TextConversationState,
    val questions: List<String> = emptyList(),
    val references: List<String> = emptyList(),
    val ownerId: Long? = null,
    val clarifications: Int = 0,
)

internal fun TextConversationState.appending(message: TextMessage): TextConversationState {
    val next = messages + message
    val first =
        next
            .filter { it is TextMessage.Owner || it is TextMessage.Notice }
            .takeLast(SESSION_EXCHANGES)
            .firstOrNull()
            ?.id
    return copy(
        messages =
            next
                .dropWhile { it.id != first }
                .takeLast(SESSION_MESSAGE_LIMIT)
                .dropWhile { it is TextMessage.Result },
    )
}

internal const val SESSION_EXCHANGES = 10
private const val SESSION_MESSAGE_LIMIT = 40
