package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

internal class TextConversationSession(
    private val repository: TextConversationRepository?,
    private val scope: CoroutineScope,
    private val onState: (TextConversationState, Boolean) -> Unit,
    private val onChanged: (MemoryChange.Confirmed, String?) -> Unit,
    private val onRevision: (Long) -> Unit,
) {
    private var state = TextConversationState()
    private var intent = TextIntent.Tell
    private val histories = mutableMapOf<TextIntent, TextSessionSnapshot>()
    private var revision = 0L
    private var generation = 0
    private var sourceGeneration = 0
    private var job: Job? = null
    private var sourceJob: Job? = null
    private var recoveryJob: Job? = null
    private var messageId = 0L
    private var ownerId: Long? = null
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
        if (state.acceptingInput && text.isNotBlank()) {
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
                repository.clarify(text, capture, intent, context)
            } else {
                repository.prepare(combined, intent, context)
            }
        if (state.clarification) clarifications++ else clarifications = 0
        ownerId =
            if (state.clarification) {
                state.messages
                    .filterIsInstance<TextMessage.Result>()
                    .lastOrNull()
                    ?.ownerId ?: ownerId ?: (messageId + 1)
            } else {
                messageId + 1
            }
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
        } else if (action == MessageAction.CancelForget) {
            cancelForget()
        } else {
            (state.status as? TextStatus.Ready)?.let { ready ->
                ready.nextCommand(action, repository, context)?.let { execute(it) }
            }
        }
    }

    fun checkCapture(messageId: Long) {
        if (state.busy || state.checkingCapture != null) return
        val command =
            state.messages
                .filterIsInstance<TextMessage.Result>()
                .find { it.id == messageId }
                ?.captureCommand
                ?.takeIf { repository != null } ?: return
        val repository = requireNotNull(repository)
        val epoch = generation
        publish(state.copy(checkingCapture = messageId))
        recoveryJob =
            scope.launch {
                val result =
                    try {
                        repository.recoverCapture(command)
                    } catch (error: CancellationException) {
                        throw error
                    } catch (_: Exception) {
                        CaptureOutcome.Unconfirmed
                    }
                if (epoch == generation) publish(state.recoveredCapture(messageId, command, result))
            }
    }

    private fun cancelForget() {
        val ready = state.status as? TextStatus.Ready ?: return
        if (ready.outcome !is TextOutcome.ConfirmForget) return
        append(TextMessage.Result(++messageId, TextOutcome.ForgetCancelled))
        publish(state.copy(status = TextStatus.Ready(ready.command, TextOutcome.ForgetCancelled)))
    }

    private val context get() = TextContext(revision, questions.toList(), references)

    private fun execute(
        command: TextCommand,
        clearDraft: Boolean = false,
    ) {
        val repository = repository ?: return
        if (state.busy) return
        val epoch = ++generation
        recoveryJob?.cancel()
        sourceGeneration++
        sourceJob?.cancel()
        publish(
            state.copy(
                status = TextStatus.Working(command),
                source = null,
                sourceLoading = false,
                checkingCapture = null,
            ),
            clearDraft,
        )
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
                    onChanged(outcome.result, execution.command.forgetApproval?.text)
                    return@launch
                }
                alignRevision(execution.command)
                references = outcome.references()
                rememberQuestion(command.text, outcome)
                if (outcome !is TextOutcome.ConfirmForget) {
                    val pending = (outcome as? TextOutcome.Captured)?.capture.isUnresolvedCapture()
                    append(TextMessage.Result(++messageId, outcome, execution.command.takeIf { pending }, ownerId))
                }
                publish(state.copy(status = TextStatus.Ready(execution.command, outcome)))
            }
    }

    private fun alignRevision(command: TextCommand) {
        command.plan?.stamp?.revision?.takeIf { it > revision }?.let { value ->
            val last = state.messages.filterIsInstance<TextMessage.Owner>().lastOrNull()
            state = state.copy(messages = listOfNotNull(last), source = null)
            histories.clear()
            ownerId = last?.id
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
        recoveryJob?.cancel()
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

    fun reset(
        clearDraft: Boolean = false,
        preservePending: Boolean = false,
        notice: ChangeAction? = null,
    ) {
        val pending = if (preservePending) state.pendingCaptureMessages() else emptyList()
        histories.clear()
        generation++
        sourceGeneration++
        job?.cancel()
        sourceJob?.cancel()
        recoveryJob?.cancel()
        clarifications = 0
        messageId = pending.maxOfOrNull { it.id } ?: 0
        ownerId = null
        questions.clear()
        references = emptyList()
        val next =
            TextConversationState(
                messages =
                    notice?.let { listOf(TextMessage.Notice(++messageId, it)) } ?: pending,
            )
        if (notice != null) {
            val other = if (intent == TextIntent.Tell) TextIntent.Ask else TextIntent.Tell
            histories[other] = TextSessionSnapshot(next)
        }
        publish(next, clearDraft)
    }

    private fun append(message: TextMessage) {
        state = state.appending(message)
    }

    fun selectIntent(next: TextIntent) {
        if (intent == next) return
        if (state.busy || state.confirmingForget || state.clarification) return
        val clean = state.copy(source = null, sourceLoading = false, checkingCapture = null)
        histories[intent] = TextSessionSnapshot(clean, questions.toList(), references, ownerId, clarifications)
        generation++
        sourceGeneration++
        job?.cancel()
        sourceJob?.cancel()
        recoveryJob?.cancel()
        val saved = histories.remove(next) ?: TextSessionSnapshot(TextConversationState())
        intent = next
        questions.clear()
        questions.addAll(saved.questions)
        references = saved.references
        ownerId = saved.ownerId
        clarifications = saved.clarifications
        publish(saved.state)
    }

    private fun publish(
        next: TextConversationState,
        clearDraft: Boolean = false,
    ) {
        state = next
        onState(next, clearDraft)
    }
}

private const val MAX_MESSAGE_CONTEXT = 4
private const val MAX_MESSAGE_QUERY = 2000
private const val MAX_MESSAGE_TELL = 8000
private const val MAX_MESSAGE_CLARIFICATIONS = 2
