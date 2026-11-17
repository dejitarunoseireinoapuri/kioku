package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.down
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.moveBy
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.up
import androidx.lifecycle.Lifecycle
import io.github.dejitarunoseireinoapuri.kioku.di.LocalVoiceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class VoiceUiTest {
    @get:Rule val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val voice = VoiceUiFixture()
    private val messages = VoiceTextFixture()
    private val account = FixtureAccount()

    @Before fun open() {
        compose.runOnUiThread {
            LifecycleTestActivity.content = {
                CompositionLocalProvider(LocalVoiceInput provides voice) {
                    KiokuApp(account, conversationRepository = messages)
                }
            }
        }
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) { compose.onNodeWithTag("voice-microphone").isDisplayed() }
        compose.onNodeWithTag("intent-Ask").performClick()
    }

    @After fun close() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test fun holdAndReleaseSendsOnlyTheFinalLocalTranscriptInTheSelectedMode() {
        compose.onNodeWithTag("voice-microphone").performTouchInput { down(center) }
        compose.runOnIdle {
            voice.observer.partial("Texto provisional ficticio")
            assertEquals(0, messages.commands.size)
        }
        compose.onNodeWithTag("text-composer").assertIsNotEnabled()
        compose.onNodeWithTag("voice-microphone").performTouchInput { up() }
        compose.waitUntil(5000) { messages.commands.size == 1 }
        compose.runOnIdle {
            assertEquals(voice.finalText, messages.commands.single().text)
            assertEquals(TextIntent.Ask, messages.commands.single().intent)
            assertEquals(1, voice.finishes)
        }
    }

    @Test fun upwardLockSurvivesReleaseUntilTheMicrophoneIsTapped() {
        val distance = 80 * compose.activity.resources.displayMetrics.density
        compose.onNodeWithTag("voice-microphone").performTouchInput {
            down(center)
            moveBy(Offset(0f, -distance))
            up()
        }
        compose.onNodeWithText("Micrófono bloqueado. Pulsa para terminar.").assertIsDisplayed()
        compose.runOnIdle {
            voice.observer.partial("Intervención ficticia bloqueada")
            assertEquals(0, voice.finishes)
        }
        captureBrandScreen(compose.activity, "kioku-local-voice-locked.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithTag("voice-microphone").performTouchInput { click() }
        compose.waitUntil(5000) { messages.commands.size == 1 }
        compose.runOnIdle { assertEquals(1, voice.finishes) }
    }

    @Test fun cancellationDiscardsSpeechAndLateResults() {
        accessibleMicrophone()
        compose.onNodeWithText("Cancelar voz").performClick()
        compose.runOnIdle { voice.observer.completed("Dato ficticio cancelado") }
        compose.onNodeWithTag("text-composer").assertTextContains("")
        compose.runOnIdle { assertEquals(0, messages.commands.size) }
    }

    @Test fun accessibleTogglePreservesAnExistingDraftAndEndsOnTheSecondActivation() {
        compose.onNodeWithTag("text-composer").performTextInput("Contexto ficticio.")
        accessibleMicrophone()
        compose.onNodeWithText("Micrófono bloqueado. Pulsa para terminar.").assertIsDisplayed()
        accessibleMicrophone()
        compose.waitUntil(5000) { messages.commands.size == 1 }
        compose.runOnIdle { assertEquals("Contexto ficticio. ${voice.finalText}", messages.commands.single().text) }
    }

    @Test fun interruptedSpeechCanBeEditedButNeverAutomaticallySubmitted() {
        accessibleMicrophone()
        compose.runOnIdle {
            voice.observer.partial("Texto ficticio incompleto")
            voice.observer.failed(VoiceIssue.Interrupted)
        }
        compose.onNodeWithText("Pasar el texto al editor").performClick()
        compose.onNodeWithTag("text-composer").assertTextContains("Texto ficticio incompleto")
        compose.runOnIdle { assertEquals(0, messages.commands.size) }
    }

    @Test fun navigatingAwayCancelsTheMicrophoneAndRejectsLateCallbacks() {
        accessibleMicrophone()
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.runOnIdle {
            assertTrue(voice.cancels > 0)
            voice.observer.completed("Dato ficticio tardío")
            assertEquals(0, messages.commands.size)
        }
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithTag("text-composer").assertIsEnabled()
    }

    @Test fun backgroundStopsTheSessionWithoutSubmittingOrRestartingIt() {
        accessibleMicrophone()
        compose.activityRule.scenario.moveToState(Lifecycle.State.STARTED)
        compose.runOnUiThread { voice.observer.completed("Dato ficticio tras salir") }
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.runOnIdle {
            assertEquals(0, messages.commands.size)
            assertEquals(1, voice.begins)
        }
    }

    @Test fun deniedPermissionKeepsTextEntryAvailableAndRequiresANewGestureAfterGrant() {
        voice.issue = VoiceIssue.Permission
        accessibleMicrophone()
        compose.onNodeWithText("Permitir micrófono").performClick()
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.runOnIdle {
            assertEquals(1, voice.permissions)
            assertEquals(1, voice.begins)
        }
        compose.runOnIdle { assertEquals(0, messages.commands.size) }
    }

    private fun accessibleMicrophone() {
        compose.onNodeWithTag("voice-microphone").performSemanticsAction(SemanticsActions.OnClick) { it() }
    }
}
