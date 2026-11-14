package io.github.dejitarunoseireinoapuri.kioku

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.AnnotatedString
import io.github.dejitarunoseireinoapuri.kioku.domain.AnswerStatus
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetPreview
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.PlanStamp
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryReference
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextExecution
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.domain.TextWorkIds
import kotlinx.coroutines.CompletableDeferred
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class ConversationFlowTest {
    @get:Rule
    val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val repository = ConversationFlowFixture()

    @Before
    fun enterAskMode() {
        compose.runOnUiThread {
            LifecycleTestActivity.content = { KiokuApp(FixtureAccount(), conversationRepository = repository) }
            compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) {
            compose.activity.hasWindowFocus() &&
                compose.onAllNodes(hasTestTag("intent-Ask") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("intent-Ask").performClick()
    }

    @After
    fun restoreHost() {
        compose.runOnUiThread { compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT }
        compose.waitUntil(5000) {
            compose.activity.resources.configuration.orientation ==
                Configuration.ORIENTATION_PORTRAIT
        }
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test
    fun offerRequiresAcceptanceThenShowsOnlyTheConfirmedSavedState() {
        send("Me gusta el miso.")
        visible("Sí, recuérdalo")
        assertEquals(1, repository.commands.size)
        compose
            .onNodeWithTag(
                "text-composer",
            ).assert(SemanticsMatcher.expectValue(SemanticsProperties.EditableText, AnnotatedString("")))
        compose.onNodeWithText("Recuerdo guardado").assertDoesNotExist()
        captureBrandScreen(compose.activity, "kioku-memory-offer.png") { compose.onRoot().captureToImage() }
        repository.answer = { TextOutcome.Captured(repository.saved()) }
        click("Sí, recuérdalo")
        visible("Recuerdo guardado")
        assertEquals(OfferDecision.Accept, repository.commands.last().decision)
        compose.onNodeWithTag("intent-Ask").assert(SemanticsMatcher.expectValue(SemanticsProperties.Selected, true))
        click("Ver texto original")
        visible("Dato de prueba: me gusta el miso.")
    }

    @Test
    fun typedRejectionDoesNotSaveOrRequireChangingMode() {
        send("No me gusta el apio.")
        visible("Sí, recuérdalo")
        repository.answer = { TextOutcome.Declined }
        send("no")
        visible("No se ha guardado con esta propuesta.")
        compose.onNodeWithText("Recuerdo guardado").assertDoesNotExist()
        compose.onNodeWithText("Sí, recuérdalo").assertDoesNotExist()
        assertEquals(OfferDecision.Reject, repository.commands.last().decision)
    }

    @Test
    fun acceptanceSurvivesRealRotationAndDoesNotRepeatTheWrite() {
        send("Me gusta el té.")
        visible("Sí, recuérdalo")
        val pending = CompletableDeferred<TextOutcome>()
        repository.answer = { pending.await() }
        click("Sí, recuérdalo")
        compose.waitUntil(5000) { compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.runOnUiThread { compose.activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE }
        compose.waitUntil(5000) {
            compose.activity.resources.configuration.orientation ==
                Configuration.ORIENTATION_LANDSCAPE
        }
        assertEquals(2, repository.commands.size)
        pending.complete(TextOutcome.Captured(repository.saved()))
        visible("Recuerdo guardado")
        assertEquals(2, repository.commands.size)
    }

    @Test
    fun followUpUsesThePreviousQuestionAndTheOwnerInputIsClearedAfterSending() {
        repository.answer = { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "No consta.", emptyList())) }
        send("¿Qué vi ayer?")
        visible("No consta.")
        repository.answer =
            {
                TextOutcome.Asked(
                    QueryOutcome.Reply(
                        AnswerStatus.Answered,
                        "Hoy viste Loto.",
                        listOf(QueryReference("movie", "2026-11-14")),
                    ),
                )
            }
        send("¿Y hoy?")
        visible("Hoy viste Loto.")
        assertEquals(
            listOf("¿Qué vi ayer?"),
            repository.commands
                .last()
                .context.questions,
        )
        compose
            .onNodeWithTag(
                "text-composer",
            ).assert(SemanticsMatcher.expectValue(SemanticsProperties.EditableText, AnnotatedString("")))
    }

    @Test
    fun ambiguityAsksOnlyForMissingScopeAndConfirmedForgetClearsTheOldMessages() {
        repository.answer = { TextOutcome.Clarification("¿Qué Pablo?") }
        send("Olvida lo del examen de Pablo.")
        visible("¿Qué Pablo?")
        compose.onNodeWithTag("intent-Ask").assertIsNotEnabled()
        repository.answer = {
            TextOutcome.ConfirmForget(ForgetPreview("Examen de mi primo Pablo.", ForgetScope.AllOccurrences))
        }
        send("Mi primo.")
        visible("¿Borrar este recuerdo?")
        assertEquals(2, repository.commands.size)
        repository.answer = { TextOutcome.Changed(MemoryChange.Confirmed(ChangeAction.Forget, 1)) }
        click("Sí, borrar")
        visible("He olvidado «Examen de mi primo Pablo.».")
        assertTrue(
            repository.commands
                .last()
                .text
                .contains("Aclaración: Mi primo."),
        )
        compose.onNodeWithText("Olvida lo del examen de Pablo.").assertDoesNotExist()
        compose.onNodeWithText("¿Qué Pablo?").assertDoesNotExist()
    }

    @Test
    fun cancellingTheConversationalPopupMakesNoApplyCall() {
        repository.answer = {
            TextOutcome.ConfirmForget(ForgetPreview("Película Loto.", ForgetScope.AllOccurrences))
        }
        send("Olvida esa película.")
        visible("¿Borrar este recuerdo?")
        assertEquals(1, repository.commands.size)
        compose.onNodeWithTag("text-composer").assertIsNotEnabled()
        click("Cancelar")
        visible("No he borrado ningún recuerdo.")
        compose.onNodeWithTag("forget-confirmation").assertDoesNotExist()
        assertEquals(1, repository.commands.size)
    }

    private fun send(text: String) {
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    @Test
    fun failedCaptureIsClearlyNotSavedAndRetryKeepsItsIdentity() {
        repository.answer = { TextOutcome.Captured(CaptureOutcome.Failed(CaptureIssue.Unavailable)) }
        send("Plan ficticio.")
        visible("No se ha guardado este recuerdo. Puedes reintentarlo o seguir usando Kioku.")
        captureBrandScreen(compose.activity, "kioku-capture-failed.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.onNodeWithTag("intent-Tell").assertIsEnabled()
        repository.answer = { TextOutcome.Captured(repository.saved()) }
        click("Reintentar")
        visible("Recuerdo guardado")
        assertEquals(repository.commands[0].ids, repository.commands[1].ids)
    }

    @Test
    fun processingDoesNotBlockAnotherQuestionAndAnOldReceiptStaysCheckable() {
        compose.onNodeWithTag("intent-Tell").performClick()
        repository.answer = { TextOutcome.Captured(CaptureOutcome.Processing) }
        send("Plan ficticio.")
        visible(
            "El servidor sigue procesando este recuerdo. El guardado todavía no está confirmado. " +
                "Puedes seguir usando Kioku.",
        )
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.onNodeWithTag("intent-Ask").performClick()
        captureBrandScreen(compose.activity, "kioku-capture-processing.png") { compose.onRoot().captureToImage() }
        repository.answer =
            { TextOutcome.Asked(QueryOutcome.Reply(AnswerStatus.NotFound, "No consta otra cosa.", emptyList())) }
        send("¿Qué otra cosa?")
        visible("No consta otra cosa.")
        repository.recovered = repository.saved()
        click("Comprobar estado")
        visible("Recuerdo guardado")
        compose.onNodeWithText("No consta otra cosa.").assertExists()
        assertEquals(2, repository.commands.size)
        assertEquals(repository.commands.first().ids, repository.recoveries.single().ids)
    }

    @Test
    fun unknownReceiptDoesNotClaimProcessingAndAReadCanConfirmFailure() {
        repository.answer = { TextOutcome.Captured(CaptureOutcome.Unconfirmed) }
        send("Plan ficticio.")
        visible(
            "No he podido comprobar si este recuerdo se ha guardado. " +
                "Puedes seguir usando Kioku y consultar su estado después.",
        )
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        repository.recovered = CaptureOutcome.Failed(CaptureIssue.Unavailable)
        captureBrandScreen(compose.activity, "kioku-capture-unconfirmed.png") { compose.onRoot().captureToImage() }
        click("Comprobar estado")
        visible("No se ha guardado este recuerdo. Puedes reintentarlo o seguir usando Kioku.")
        assertEquals(1, repository.commands.size)
        assertEquals(1, repository.recoveries.size)
    }

    private fun click(text: String) {
        visible(text)
        compose.onNodeWithText(text).performClick()
    }

    private fun visible(text: String) {
        compose.waitUntil(5000) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
        if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
    }
}

private class ConversationFlowFixture : TextConversationRepository {
    val commands = mutableListOf<TextCommand>()
    private var ids = 0
    var answer: suspend (TextCommand) -> TextOutcome = { TextOutcome.Offered(it.text) }
    val recoveries = mutableListOf<TextCommand>()
    var recovered: CaptureOutcome = CaptureOutcome.Unconfirmed

    override fun prepare(
        text: String,
        intent: TextIntent,
        context: TextContext,
    ) = TextCommand(
        TextWorkIds("route-${ids++}", "action-${ids++}", "query-${ids++}"),
        intent,
        text,
        "Europe/Madrid",
        context,
    )

    override fun clarify(
        text: String,
        pending: CaptureOutcome.Clarification,
        intent: TextIntent,
        context: TextContext,
    ) = prepare(text, intent, context)

    override suspend fun execute(
        command: TextCommand,
        onPrepared: (TextCommand) -> Unit,
    ): TextExecution {
        val prepared =
            command.copy(
                plan =
                    command.plan
                        ?: TextPlan.Offer(
                            PlanStamp(command.context.revision, "2026-11-14T12:00:00Z", 1794657900000),
                            command.text,
                            false,
                        ),
            )
        commands.add(prepared)
        onPrepared(prepared)
        return TextExecution(prepared, answer(prepared))
    }

    fun saved() =
        CaptureOutcome.Saved(MemorySource("saved-source", "Dato de prueba: me gusta el miso.", "2026-11-14"), 1)

    override suspend fun recoverCapture(command: TextCommand): CaptureOutcome {
        recoveries.add(command)
        return recovered
    }

    override suspend fun source(id: String) = saved().source.takeIf { it.id == id }
}
