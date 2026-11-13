package io.github.dejitarunoseireinoapuri.kioku

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import kotlinx.coroutines.CompletableDeferred
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class CaptureRotationTest {
    @get:Rule
    val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val account = FixtureAccount()
    private val repository = CaptureNavigationFixture()

    @Before
    fun openApp() {
        compose.runOnUiThread { LifecycleTestActivity.content = { KiokuApp(account, repository) } }
        compose.activityRule.scenario.recreate()
        waitVisible("text-composer", tag = true)
    }

    @After
    fun clearHost() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test
    fun draftAndSettingsSurviveOrientationChangesButNotLogout() {
        compose.onNodeWithTag("text-composer").performTextInput("Borrador ficticio sin enviar")
        rotate()
        compose.onNodeWithTag("text-composer").assertTextContains("Borrador ficticio sin enviar")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        rotate()
        compose.onNodeWithText("Cerrar sesión").performScrollTo().performClick()
        compose.onNodeWithText("Continuar con Google").performScrollTo().performClick()
        waitVisible("text-composer", tag = true)
        compose.onNodeWithText("Borrador ficticio sin enviar").assertDoesNotExist()
        assertEquals(0, repository.commands.size)
    }

    @Test
    fun clarificationAndPartialAnswerSurviveAndContinueTheSameOperation() {
        repository.result = { CaptureOutcome.Clarification("pending-fixture", 1, "¿De qué mes es el examen?") }
        send("El examen es el día 24.")
        waitVisible("¿De qué mes es el examen?")
        compose.onNodeWithTag("text-composer").performTextInput("De noviembre de 2026.")
        rotate()
        waitVisible("¿De qué mes es el examen?")
        compose.onNodeWithTag("text-composer").assertTextContains("De noviembre de 2026.")
        repository.result = { repository.saved() }
        compose.onNodeWithTag("text-composer").performImeAction()
        waitVisible("Recuerdo guardado")
        val clarification = repository.commands.last() as CaptureCommand.Clarify
        assertEquals("pending-fixture", clarification.clarificationId)
        assertEquals(1, clarification.revision)
        assertEquals(2, repository.commands.size)
    }

    @Test
    fun inflightSaveAndItsSourceSurviveWithoutResubmitting() {
        val result = CompletableDeferred<CaptureOutcome>()
        repository.result = { result.await() }
        send("Quiero ver una película ficticia.")
        waitVisible("Procesando tu recuerdo...")
        rotate()
        waitVisible("Procesando tu recuerdo...")
        assertEquals(1, repository.commands.size)
        result.complete(repository.saved())
        waitVisible("Recuerdo guardado")
        rotate()
        compose.onNodeWithText("Ver texto original").performScrollTo().performClick()
        rotate()
        compose.onNodeWithText("Quiero ver una película ficticia.").performScrollTo().assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithText("Recuerdo guardado").performScrollTo().assertIsDisplayed()
        assertEquals(1, repository.commands.size)
    }

    private fun send(text: String) {
        compose.onNodeWithTag("text-composer").performTextInput(text)
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun rotate() {
        val previous = compose.activity
        val landscape = previous.resources.configuration.orientation != Configuration.ORIENTATION_LANDSCAPE
        compose.runOnUiThread {
            previous.requestedOrientation =
                if (landscape) ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE else ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        compose.waitUntil(10_000) {
            compose.activity !== previous &&
                (compose.activity.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE) ==
                landscape
        }
        compose.waitForIdle()
        compose.runOnUiThread {
            val window = compose.activity.window
            WindowCompat.getInsetsController(window, window.decorView).hide(WindowInsetsCompat.Type.ime())
        }
        compose.waitUntil(5000) {
            val view = compose.activity.window.decorView
            view.rootWindowInsets?.let {
                !WindowInsetsCompat.toWindowInsetsCompat(it, view).isVisible(WindowInsetsCompat.Type.ime())
            } == true
        }
        compose.waitForIdle()
    }

    private fun waitVisible(
        text: String,
        tag: Boolean = false,
    ) {
        compose.waitUntil(5000) {
            if (tag) {
                compose.onNodeWithTag(text).isDisplayed()
            } else {
                compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
            }
        }
        if (!tag) {
            if (!compose.onNodeWithText(text).isDisplayed()) compose.onNodeWithText(text).performScrollTo()
            compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
            compose.onNodeWithText(text).assertIsDisplayed()
        }
    }
}
