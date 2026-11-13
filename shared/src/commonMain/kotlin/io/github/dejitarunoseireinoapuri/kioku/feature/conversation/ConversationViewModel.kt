package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ConversationViewModel(
    private val readSource: ReadReferencedSource,
    private val captures: CaptureRepository? = null,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ConversationState())
    val state = mutableState.asStateFlow()
    private var command: CaptureCommand? = null
    private var captureJob: Job? = null
    private var operationGeneration = 0

    fun onEvent(event: ConversationEvent) {
        when (event) {
            is ConversationEvent.SelectIntent -> {
                selectIntent(event.intent)
            }

            is ConversationEvent.EditDraft -> {
                editDraft(event.text)
            }

            is ConversationEvent.ShowExample -> {
                showExample(event.scenario)
            }

            ConversationEvent.Submit -> {
                submit()
            }

            ConversationEvent.RecoverCapture -> {
                runCapture(recover = true)
            }

            ConversationEvent.TryVoice -> {
                feedback(PreviewFeedback.VoiceUnavailable)
            }

            is ConversationEvent.DecideOffer -> {
                decideOffer(event.accept)
            }

            ConversationEvent.FinishExample -> {
                finishExample()
            }

            ConversationEvent.CancelExample -> {
                showExample(PreviewScenario.Ready)
            }
        }
    }

    fun openSource(id: String): Boolean {
        val saved = state.value.capture as? CaptureOutcome.Saved
        if (saved?.source?.id == id) {
            mutableState.update { it.copy(source = saved.source) }
            return true
        }
        val references =
            when (state.value.scenario) {
                PreviewScenario.Saved, PreviewScenario.Answer -> setOf("movie-original")
                PreviewScenario.Corrected -> setOf("movie-corrected")
                else -> emptySet()
            }
        val result = readSource(id, references)
        mutableState.update { it.copy(source = (result as? SourceResult.Found)?.source) }
        return result is SourceResult.Found
    }

    fun sourceActionUnavailable() = feedback(PreviewFeedback.ForgetUnavailable)

    private fun selectIntent(intent: MemoryIntent) {
        val current = state.value
        if (current.canSwitchIntent) {
            mutableState.update { it.copy(intent = intent) }
        }
    }

    private fun editDraft(text: String) {
        if (state.value.canEdit) {
            val limit =
                if (state.value.capture is CaptureOutcome.Clarification) {
                    MAX_CLARIFICATION_LENGTH
                } else {
                    MAX_DRAFT_LENGTH
                }
            mutableState.update { it.copy(draft = text.take(limit), feedback = null) }
        }
    }

    private fun submit() {
        val current = state.value
        if (current.scenario == PreviewScenario.Offline || current.draft.isBlank() || current.capturing) return
        if (captures == null || current.scenario != PreviewScenario.Ready) {
            feedback(PreviewFeedback.TextOnly)
        } else if (current.intent == MemoryIntent.Ask && current.capture !is CaptureOutcome.Clarification) {
            feedback(PreviewFeedback.QueryUnavailable)
        } else if (current.capture != CaptureOutcome.Processing) {
            val clarification = current.capture as? CaptureOutcome.Clarification
            if (current.capture !is CaptureOutcome.Failed || command == null) {
                command =
                    if (clarification != null) {
                        captures.clarify(current.draft, clarification.id, clarification.revision)
                    } else {
                        captures.tell(current.draft)
                    }
            }
            runCapture()
        }
    }

    private fun runCapture(recover: Boolean = false) {
        val repository = captures
        val pending = command
        if (repository == null || pending == null || state.value.capturing) return
        val generation = ++operationGeneration
        mutableState.update { it.copy(capturing = true, feedback = null, source = null) }
        captureJob =
            viewModelScope.launch {
                val result = if (recover) repository.recover(pending.requestId) else repository.execute(pending)
                if (generation != operationGeneration) return@launch
                val clearDraft =
                    result is CaptureOutcome.Saved || result is CaptureOutcome.Clarification ||
                        result == CaptureOutcome.Ignored || result == CaptureOutcome.Expired
                mutableState.update {
                    it.copy(capturing = false, capture = result, draft = if (clearDraft) "" else it.draft)
                }
            }
    }

    private fun showExample(scenario: PreviewScenario) {
        operationGeneration++
        captureJob?.cancel()
        command = null
        val intent = if (scenario in QUERY_EXAMPLES) MemoryIntent.Ask else MemoryIntent.Tell
        mutableState.value = ConversationState(intent = intent, scenario = scenario)
    }

    private fun decideOffer(accept: Boolean) {
        if (state.value.scenario == PreviewScenario.Offer) {
            feedback(if (accept) PreviewFeedback.AcceptedExample else PreviewFeedback.DeclinedExample)
        }
    }

    private fun feedback(message: PreviewFeedback) {
        mutableState.update { it.copy(feedback = message) }
    }

    private fun finishExample() {
        if (state.value.scenario == PreviewScenario.Locked) showExample(PreviewScenario.Saved)
    }

    private companion object {
        const val MAX_DRAFT_LENGTH = 8000
        const val MAX_CLARIFICATION_LENGTH = 2000
        val QUERY_EXAMPLES = setOf(PreviewScenario.Answer, PreviewScenario.Offer)
    }
}
