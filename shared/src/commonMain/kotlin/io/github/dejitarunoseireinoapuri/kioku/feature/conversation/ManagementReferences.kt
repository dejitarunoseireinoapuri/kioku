package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MAX_MANAGEMENT_SOURCES
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome

/** UI references only narrow a navigation request; each source is still authorized by the server. */
internal fun ConversationState.canManage(ids: List<String>): Boolean {
    val validIds = ids.isNotEmpty() && ids.size <= MAX_MANAGEMENT_SOURCES && ids.distinct().size == ids.size
    if (concealingMemory || !validIds) return false
    val answers =
        conversation
            ?.messages
            .orEmpty()
            .filterIsInstance<TextMessage.Result>()
            .flatMap { it.outcome.references() } +
            query.messages
                .filterIsInstance<QueryMessage.Result>()
                .flatMap { (it.outcome as? QueryOutcome.Reply)?.sources.orEmpty().map { source -> source.sourceId } }
    val saved =
        conversation?.savedMessageSources().orEmpty().values +
            listOfNotNull((capture as? CaptureOutcome.Saved)?.source?.id)
    return ids.all { it in saved || it in answers }
}
