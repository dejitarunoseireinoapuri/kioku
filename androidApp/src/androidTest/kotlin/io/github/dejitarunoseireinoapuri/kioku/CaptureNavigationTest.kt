package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.AnnotatedString
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import kotlinx.coroutines.CompletableDeferred
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class CaptureNavigationTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()
    private val repository = CaptureNavigationFixture()
    private val account = FixtureAccount()

    @Test
    fun savedStateWaitsForCommitAndOpensTheCanonicalSource() {
        val result = CompletableDeferred<CaptureOutcome>()
        repository.result = { result.await() }
        compose.setContent { KiokuApp(account, repository) }
        send("Quiero ver una película ficticia.")
        waitVisible("Procesando tu recuerdo...")
        compose.onNodeWithText("Procesando tu recuerdo...").assertIsDisplayed()
        compose.onNodeWithTag("content-loading").assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertIsDisplayed().assertIsNotEnabled()
        captureBrandScreen(compose.activity, "kioku-compact-capture.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithText("Recuerdo guardado").assertDoesNotExist()
        result.complete(repository.saved())
        waitVisible("Recuerdo guardado")
        compose.onNodeWithText("Recuerdo guardado").assertIsDisplayed()
        captureBrandScreen(compose.activity, "kioku-live-saved.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithText("Ver texto original").performScrollTo().performClick()
        compose.onNodeWithText("LO QUE DIJISTE ORIGINALMENTE").assertIsDisplayed()
        compose.onNodeWithText("Quiero ver una película ficticia.").assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithText("Recuerdo guardado").assertIsDisplayed()
    }

    @Test
    fun clarificationSendsAnAnswerForThePendingOperation() {
        repository.result = { CaptureOutcome.Clarification("pending-fixture", 1, "¿De qué mes es el examen?") }
        compose.setContent { KiokuApp(account, repository) }
        send("El examen es el día 24.")
        waitVisible("¿De qué mes es el examen?")
        compose.onNodeWithText("¿De qué mes es el examen?").assertIsDisplayed()
        compose.onNodeWithText("Recuerdo guardado").assertDoesNotExist()
        captureBrandScreen(compose.activity, "kioku-live-clarification.png") { compose.onRoot().captureToImage() }
        repository.result = { repository.saved() }
        send("De noviembre de 2026.")
        waitVisible("Recuerdo guardado")
        compose.onNodeWithText("Recuerdo guardado").assertIsDisplayed()
        val command = repository.commands.last() as CaptureCommand.Clarify
        assertEquals("pending-fixture", command.clarificationId)
        assertEquals("De noviembre de 2026.", command.text)
    }

    @Test
    fun uncertainDeliveryChecksItsReceiptWithoutSubmittingAgain() {
        repository.result = { CaptureOutcome.Processing }
        compose.setContent { KiokuApp(account, repository) }
        send("Quiero ver una película ficticia.", keyboard = false)
        waitVisible("Comprobar estado")
        compose.onNodeWithText("Comprobar estado").performScrollTo().performClick()
        compose.onNodeWithText("Recuerdo guardado").assertIsDisplayed()
        assertEquals(1, repository.commands.size)
        assertEquals(listOf(repository.commands.single().requestId), repository.recoveries)
    }

    private fun send(
        text: String,
        keyboard: Boolean = true,
    ) {
        val previous = repository.commands.size
        val field = compose.onNodeWithTag("text-composer")
        if (keyboard) {
            field.performTextInput(text)
            field.assertTextContains(text)
            field.performImeAction()
        } else {
            field.performSemanticsAction(SemanticsActions.SetText) { it(AnnotatedString(text)) }
            field.assertTextContains(text)
            compose.onNodeWithContentDescription("Enviar texto").assertIsDisplayed().performClick()
        }
        compose.waitUntil(timeoutMillis = UI_STATE_TIMEOUT_MS) { repository.commands.size == previous + 1 }
        compose.runOnIdle { assertEquals(previous + 1, repository.commands.size) }
    }

    private fun waitVisible(text: String) {
        compose.waitUntil(timeoutMillis = UI_STATE_TIMEOUT_MS) { compose.onNodeWithText(text).isDisplayed() }
    }
}

private const val UI_STATE_TIMEOUT_MS = 5000L

internal class CaptureNavigationFixture : CaptureRepository {
    val commands = mutableListOf<CaptureCommand>()
    val recoveries = mutableListOf<String>()
    var result: suspend () -> CaptureOutcome = { saved() }

    override fun tell(text: String): CaptureCommand.Tell =
        CaptureCommand.Tell("capture-${commands.size}", text, "Europe/Madrid")

    override fun clarify(
        text: String,
        id: String,
        revision: Int,
    ) = CaptureCommand.Clarify("capture-${commands.size}", text, id, revision)

    override suspend fun execute(command: CaptureCommand): CaptureOutcome {
        commands.add(command)
        return result()
    }

    override suspend fun recover(requestId: String): CaptureOutcome {
        recoveries.add(requestId)
        return saved()
    }

    fun saved() =
        CaptureOutcome.Saved(MemorySource("saved-fixture", "Quiero ver una película ficticia.", "2026-11-13"), 1)
}
