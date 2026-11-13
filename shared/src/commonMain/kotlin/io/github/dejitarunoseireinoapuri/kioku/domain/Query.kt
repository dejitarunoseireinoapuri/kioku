package io.github.dejitarunoseireinoapuri.kioku.domain

data class QueryCommand(
    val requestId: String,
    val text: String,
    val previousQuestions: List<String> = emptyList(),
)

data class QueryReference(
    val sourceId: String,
    val recordedOn: String,
)

enum class AnswerStatus { Answered, NotFound, Clarification }

sealed interface QueryOutcome {
    data class Reply(
        val status: AnswerStatus,
        val text: String,
        val sources: List<QueryReference>,
    ) : QueryOutcome

    data class Failed(
        val issue: CaptureIssue,
    ) : QueryOutcome

    data object Processing : QueryOutcome

    data object RepeatRequired : QueryOutcome
}

interface QueryRepository {
    fun prepare(text: String): QueryCommand

    suspend fun execute(command: QueryCommand): QueryOutcome

    suspend fun source(id: String): MemorySource?
}
