package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

private const val MAX_QUESTION_SIZE = 2000
private const val MAX_QUERY_CLARIFICATIONS = 2

data class QueryState(
    val question: String = "",
    val outcome: QueryOutcome? = null,
    val busy: Boolean = false,
    val source: MemorySource? = null,
    val sourceLoading: Boolean = false,
    val messages: List<QueryMessage> = emptyList(),
) {
    val awaitingClarification: Boolean
        get() = (outcome as? QueryOutcome.Reply)?.status == AnswerStatus.Clarification
}

enum class QueryAction { Retry, Restart, Reset }

/** Session-only query work shares the owning ViewModel scope and never writes facts. */
internal class QuerySession(
    private val repository: QueryRepository?,
    private val scope: CoroutineScope,
    private val onState: (QueryState, Boolean) -> Unit,
) {
    private var state = QueryState()
    private var command: QueryCommand? = null
    private var job: Job? = null
    private var sourceJob: Job? = null
    private var generation = 0
    private var sourceGeneration = 0
    private var clarifications = 0
    private val previousQuestions = ArrayDeque<String>()
    private var messages = emptyList<QueryMessage>()
    private var messageId = 0L

    fun submit(text: String): Boolean {
        val queries = repository ?: return false
        if (!state.busy && text.isNotBlank()) {
            val question = if (state.awaitingClarification) "${state.question}\nAclaración: $text" else text
            if (question.length > MAX_QUESTION_SIZE ||
                (clarifications >= MAX_QUERY_CLARIFICATIONS && state.awaitingClarification)
            ) {
                publish(state.copy(outcome = QueryOutcome.Failed(CaptureIssue.MoreContext)))
            } else {
                if (state.awaitingClarification) clarifications++ else clarifications = 0
                command = queries.prepare(question).copy(previousQuestions = previousQuestions.toList())
                appendMessage(QueryMessage.Question(++messageId, text))
                execute(clearDraft = true)
            }
        }
        return true
    }

    fun act(action: QueryAction) {
        when (action) {
            QueryAction.Reset -> {
                reset(clearDraft = true)
            }

            QueryAction.Retry -> {
                execute()
            }

            QueryAction.Restart -> {
                command =
                    command?.let { previous ->
                        repository?.prepare(previous.text)?.copy(previousQuestions = previous.previousQuestions)
                    }
                execute()
            }
        }
    }

    private fun execute(clearDraft: Boolean = false) {
        val queries = repository
        val pending = command?.takeUnless { state.busy }
        if (queries == null || pending == null) return
        val epoch = ++generation
        sourceGeneration++
        sourceJob?.cancel()
        publish(QueryState(question = pending.text, busy = true, messages = messages), clearDraft = clearDraft)
        job =
            scope.launch {
                val result = queries.execute(pending)
                if (generation != epoch) return@launch
                appendMessage(QueryMessage.Result(++messageId, result))
                if (result is QueryOutcome.Reply && result.status != AnswerStatus.Clarification) {
                    rememberQuestion(pending.text)
                }
                publish(state.copy(busy = false, outcome = result, messages = messages))
            }
    }

    fun openSource(id: String): Boolean {
        val queries = repository
        val referenced =
            messages.filterIsInstance<QueryMessage.Result>().any { message ->
                (message.outcome as? QueryOutcome.Reply)?.sources?.any { it.sourceId == id } == true
            }
        if (queries == null || !referenced) return false
        val epoch = generation
        val sourceEpoch = ++sourceGeneration
        sourceJob?.cancel()
        publish(state.copy(source = null, sourceLoading = true))
        sourceJob =
            scope.launch {
                val source = queries.source(id)
                if (generation == epoch && sourceGeneration == sourceEpoch) {
                    publish(state.copy(source = source, sourceLoading = false))
                }
            }
        return true
    }

    fun reset(clearDraft: Boolean = false) {
        generation++
        sourceGeneration++
        job?.cancel()
        sourceJob?.cancel()
        command = null
        clarifications = 0
        previousQuestions.clear()
        messages = emptyList()
        messageId = 0L
        publish(QueryState(), clearDraft)
    }

    private fun publish(
        next: QueryState,
        clearDraft: Boolean = false,
    ) {
        state = next
        onState(next, clearDraft)
    }

    private fun rememberQuestion(question: String) {
        if (previousQuestions.lastOrNull() != question) previousQuestions.addLast(question)
        while (previousQuestions.size > MAX_CONTEXT_QUESTIONS) previousQuestions.removeFirst()
    }

    private fun appendMessage(message: QueryMessage) {
        messages = (messages + message).takeLast(MAX_QUERY_MESSAGES).dropWhile { it is QueryMessage.Result }
    }
}

private const val MAX_CONTEXT_QUESTIONS = 4
private const val MAX_QUERY_MESSAGES = 40
