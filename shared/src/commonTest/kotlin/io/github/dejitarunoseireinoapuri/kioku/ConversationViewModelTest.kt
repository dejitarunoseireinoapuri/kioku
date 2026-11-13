package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.DemoSourceRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReadReferencedSource
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationViewModel
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewFeedback
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewScenario
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ConversationViewModelTest {
    private fun model() = ConversationViewModel(ReadReferencedSource(DemoSourceRepository()))

    @Test
    fun selectingIntentRetainsUnsentDraft() {
        val model = model()
        model.onEvent(ConversationEvent.EditDraft("Texto todavía no enviado"))
        model.onEvent(ConversationEvent.SelectIntent(MemoryIntent.Ask))
        assertEquals("Texto todavía no enviado", model.state.value.draft)
        assertEquals(MemoryIntent.Ask, model.state.value.intent)
    }

    @Test
    fun previewSubmissionNeverDeclaresRealSavedState() {
        val model = model()
        model.onEvent(ConversationEvent.Submit)
        assertNull(model.state.value.feedback)
        model.onEvent(ConversationEvent.EditDraft("Un dato de prueba"))
        model.onEvent(ConversationEvent.Submit)
        assertEquals(PreviewScenario.Ready, model.state.value.scenario)
        assertEquals(PreviewFeedback.TextOnly, model.state.value.feedback)
    }

    @Test
    fun offlineExampleBlocksEditingAndSubmission() {
        val model = model()
        model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Offline))
        model.onEvent(ConversationEvent.EditDraft("No se debe encolar"))
        model.onEvent(ConversationEvent.Submit)
        assertEquals("", model.state.value.draft)
        assertNull(model.state.value.feedback)
    }

    @Test
    fun leavingExampleRemovesItsSourceContext() {
        val model = model()
        model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Answer))
        assertTrue(model.openSource("movie-original"))
        model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Corrected))
        assertNull(model.state.value.source)
        assertFalse(model.openSource("movie-original"))
        assertTrue(model.openSource("movie-corrected"))
    }

    @Test
    fun acceptingOfferPreservesQueryIntentAndDoesNotClaimPersistence() {
        val model = model()
        model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Offer))
        model.onEvent(ConversationEvent.DecideOffer(true))
        assertEquals(MemoryIntent.Ask, model.state.value.intent)
        assertEquals(PreviewScenario.Offer, model.state.value.scenario)
        assertEquals(PreviewFeedback.AcceptedExample, model.state.value.feedback)
    }

    @Test
    fun onlyLockedExampleCanFinishAndCancelNeverClaimsSaved() {
        val model = model()
        model.onEvent(ConversationEvent.FinishExample)
        assertEquals(PreviewScenario.Ready, model.state.value.scenario)
        model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Locked))
        model.onEvent(ConversationEvent.CancelExample)
        assertEquals(PreviewScenario.Ready, model.state.value.scenario)
        model.onEvent(ConversationEvent.ShowExample(PreviewScenario.Locked))
        model.onEvent(ConversationEvent.FinishExample)
        assertEquals(PreviewScenario.Saved, model.state.value.scenario)
    }
}
