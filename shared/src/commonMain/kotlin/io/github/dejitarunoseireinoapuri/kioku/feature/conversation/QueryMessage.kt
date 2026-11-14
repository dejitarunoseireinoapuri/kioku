package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome

/** Display-only session history. It is never used as factual evidence or persisted. */
sealed interface QueryMessage {
    val id: Long

    data class Question(
        override val id: Long,
        val text: String,
    ) : QueryMessage

    data class Result(
        override val id: Long,
        val outcome: QueryOutcome,
    ) : QueryMessage
}
