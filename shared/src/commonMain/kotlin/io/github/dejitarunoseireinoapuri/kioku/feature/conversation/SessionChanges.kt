package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome

/** Owner-requested original feed stays in RAM; all evidence, pending commands and contexts are retired. */
internal fun TextConversationState.afterChange(result: MemoryChange.Confirmed): TextConversationState {
    val groups = savedMessageGroups()
    val affected = result.replacements.map { it.sourceId }.toSet() + listOfNotNull(result.previousSourceId)
    val archived =
        messages.mapNotNull { message ->
            when (message) {
                is TextMessage.Owner -> {
                    archiveOwner(message, groups[message.id].orEmpty(), affected)
                }

                is TextMessage.Result -> {
                    message.pastReply()
                }

                is TextMessage.Notice, is TextMessage.PastReply -> {
                    message
                }
            }
        }
    return TextConversationState(messages = archived)
}

private fun archiveOwner(
    message: TextMessage.Owner,
    sources: List<String>,
    affected: Set<String>,
): TextMessage.Owner {
    val changed = sources.isNotEmpty() && (affected.isEmpty() || sources.any { it in affected })
    val historical = message.historical || changed
    return message.copy(sourceIds = if (historical) emptyList() else sources, historical = historical)
}

private fun TextMessage.Result.pastReply(): TextMessage.PastReply? {
    val answer =
        when (val result = outcome) {
            is TextOutcome.Asked -> result.answer
            is TextOutcome.Offered -> result.answer
            else -> null
        } as? QueryOutcome.Reply
    return answer?.let { TextMessage.PastReply(id, it.text) }
}
