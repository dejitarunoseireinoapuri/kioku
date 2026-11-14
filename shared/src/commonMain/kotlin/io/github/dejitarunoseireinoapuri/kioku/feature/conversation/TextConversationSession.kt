package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

internal class TextConversationSession(
    private val repository: TextConversationRepository?,
    private val scope: CoroutineScope,
    private val onState: (TextConversationState, Boolean) -> Unit,
    private val onChanged: (MemoryChange.Confirmed) -> Unit,
    private val onRevision: (Long) -> Unit,
) {
    private var state = TextConversationState()
    private var revision = 0L
    private var generation = 0
    private var sourceGeneration = 0
    private var job: Job? = null
    private var sourceJob: Job? = null
    private var messageId = 0L
    private var clarifications = 0
    private val questions = ArrayDeque<String>()
    private var references = emptyList<String>()

    fun setRevision(value: Long) {
        revision = value
    }

    fun submit(
        text: String,
        intent: TextIntent,
    ): Boolean {
        val repository = repository ?: return false
        if (!state.busy && !state.processing && text.isNotBlank()) {
            if (!submitOfferAnswer(text)) prepareMessage(repository, text, intent)
        }
        return true
    }

    private fun submitOfferAnswer(text: String): Boolean {
        val ready = state.status as? TextStatus.Ready
        val decision =
            when (text.trim().lowercase().trimEnd('.', '!')) {
                "sí", "si", "sí, recuérdalo", "vale", "de acuerdo" -> OfferDecision.Accept
                "no", "no, gracias" -> OfferDecision.Reject
                else -> null
            }
        return if (ready?.outcome is TextOutcome.Offered && decision != null) {
            append(TextMessage.Owner(++messageId, text))
            execute(ready.command.copy(decision = decision), clearDraft = true)
            true
        } else {
            false
        }
    }

    private fun prepareMessage(
        repository: TextConversationRepository,
        text: String,
        intent: TextIntent,
    ) {
        val previous = (state.status as? TextStatus.Ready)?.command
        val capture = (state.outcome as? TextOutcome.Captured)?.capture as? CaptureOutcome.Clarification
        val combined =
            if (state.clarification &&
                capture == null
            ) {
                "${previous?.text.orEmpty()}\nAclaración: $text"
            } else {
                text
            }
        val pending =
            if (capture !=
                null
            ) {
                repository.clarify(text, capture, intent, context())
            } else {
                repository.prepare(combined, intent, context())
            }
        if (state.clarification) clarifications++ else clarifications = 0
        append(TextMessage.Owner(++messageId, text))
        if (combined.length > (if (intent == TextIntent.Ask) MAX_MESSAGE_QUERY else MAX_MESSAGE_TELL) ||
            clarifications > MAX_MESSAGE_CLARIFICATIONS
        ) {
            publish(state.copy(status = TextStatus.Ready(pending, TextOutcome.Failed(CaptureIssue.MoreContext))), true)
        } else {
            execute(pending, clearDraft = true)
        }
    }

    fun act(action: MessageAction) {
        if (action == MessageAction.Reset) {
            reset(clearDraft = true)
        } else {
            (state.status as? TextStatus.Ready)?.let { ready -> nextCommand(ready, action)?.let { execute(it) } }
        }
    }

    private fun nextCommand(
        ready: TextStatus.Ready,
        action: MessageAction,
    ): TextCommand? =
        when (action) {
            MessageAction.Accept, MessageAction.Reject -> {
                ready.command.takeIf { ready.outcome is TextOutcome.Offered }?.copy(
                    decision = if (action == MessageAction.Accept) OfferDecision.Accept else OfferDecision.Reject,
                )
            }

            MessageAction.Restart -> {
                repository?.prepare(ready.command.text, ready.command.intent, context())
            }

            MessageAction.Retry -> {
                ready.command
            }

            MessageAction.Reset -> {
                null
            }
        }

    private fun context() = TextContext(revision, questions.toList(), references)

    private fun execute(
        command: TextCommand,
        clearDraft: Boolean = false,
    ) {
        val repository = repository ?: return
        if (state.busy) return
        val epoch = ++generation
        sourceGeneration++
        sourceJob?.cancel()
        publish(state.copy(status = TextStatus.Working(command), source = null, sourceLoading = false), clearDraft)
        job =
            scope.launch {
                val execution =
                    repository.execute(command) { prepared ->
                        if (epoch == generation) {
                            alignRevision(prepared)
                            publish(state.copy(status = TextStatus.Working(prepared)))
                        }
                    }
                if (epoch != generation) return@launch
                val outcome = execution.outcome
                if (outcome is TextOutcome.Changed) {
                    onChanged(outcome.result)
                    return@launch
                }
                alignRevision(execution.command)
                references = outcome.references()
                rememberQuestion(command.text, outcome)
                append(TextMessage.Result(++messageId, outcome))
                publish(state.copy(status = TextStatus.Ready(execution.command, outcome)))
            }
    }

    private fun alignRevision(command: TextCommand) {
        command.plan?.stamp?.revision?.takeIf { it > revision }?.let { value ->
            val last = state.messages.filterIsInstance<TextMessage.Owner>().lastOrNull()
            state = state.copy(messages = listOfNotNull(last), source = null)
            questions.clear()
            references = emptyList()
            revision = value
            onRevision(value)
        }
    }

    private fun rememberQuestion(
        text: String,
        outcome: TextOutcome,
    ) {
        val answer =
            when (outcome) {
                is TextOutcome.Asked -> outcome.answer
                is TextOutcome.Offered -> outcome.answer
                else -> null
            } as? QueryOutcome.Reply
        if (answer != null && answer.status != AnswerStatus.Clarification) {
            if (questions.lastOrNull() != text) questions.addLast(text)
            while (questions.size > MAX_MESSAGE_CONTEXT) questions.removeFirst()
        }
    }

    fun openSource(id: String): Boolean {
        val known = state.messages.filterIsInstance<TextMessage.Result>().any { id in it.outcome.references() }
        val repository = repository?.takeIf { known } ?: return false
        val epoch = generation
        val sourceEpoch = ++sourceGeneration
        sourceJob?.cancel()
        publish(state.copy(source = null, sourceLoading = true))
        sourceJob =
            scope.launch {
                val source = repository.source(id)
                if (epoch == generation &&
                    sourceEpoch == sourceGeneration
                ) {
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
        clarifications = 0
        messageId = 0
        questions.clear()
        references = emptyList()
        publish(TextConversationState(), clearDraft)
    }

    private fun append(message: TextMessage) {
        state =
            state.copy(
                messages =
                    (state.messages + message)
                        .takeLast(
                            MAX_MESSAGE_HISTORY,
                        ).dropWhile { it is TextMessage.Result },
            )
    }

    private fun publish(
        next: TextConversationState,
        clearDraft: Boolean = false,
    ) {
        state = next
        onState(next, clearDraft)
    }
}

private const val MAX_MESSAGE_HISTORY = 40
private const val MAX_MESSAGE_CONTEXT = 4
private const val MAX_MESSAGE_QUERY = 2000
private const val MAX_MESSAGE_TELL = 8000
private const val MAX_MESSAGE_CLARIFICATIONS = 2
