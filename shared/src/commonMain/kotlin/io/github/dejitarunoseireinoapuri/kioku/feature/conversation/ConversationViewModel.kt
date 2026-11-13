package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.lifecycle.ViewModel
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class ConversationViewModel(
    private val readSource: ReadReferencedSource,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ConversationState())
    val state = mutableState.asStateFlow()

    fun onEvent(event: ConversationEvent) {
        when (event) {
            is ConversationEvent.SelectIntent -> mutableState.update { it.copy(intent = event.intent) }
            is ConversationEvent.EditDraft -> editDraft(event.text)
            is ConversationEvent.ShowExample -> showExample(event.scenario)
            ConversationEvent.Submit -> submit()
            ConversationEvent.TryVoice -> feedback(PreviewFeedback.VoiceUnavailable)
            is ConversationEvent.DecideOffer -> decideOffer(event.accept)
            ConversationEvent.FinishExample -> finishExample()
            ConversationEvent.CancelExample -> showExample(PreviewScenario.Ready)
        }
    }

    fun openSource(id: String): Boolean {
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

    private fun editDraft(text: String) {
        if (state.value.scenario != PreviewScenario.Offline) {
            mutableState.update { it.copy(draft = text.take(MAX_DRAFT_LENGTH), feedback = null) }
        }
    }

    private fun submit() {
        if (state.value.scenario != PreviewScenario.Offline && state.value.draft.isNotBlank()) {
            feedback(PreviewFeedback.TextOnly)
        }
    }

    private fun showExample(scenario: PreviewScenario) {
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
        const val MAX_DRAFT_LENGTH = 2000
        val QUERY_EXAMPLES = setOf(PreviewScenario.Answer, PreviewScenario.Offer)
    }
}
