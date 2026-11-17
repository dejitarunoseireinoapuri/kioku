package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
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

    @Test fun tapShowsLiveTextAndStopOnlyCreatesAnEditableDraft() {
        compose.onNodeWithTag("send-action").assertDoesNotExist()
        compose.onNodeWithTag("voice-microphone").performClick()
        compose.onNodeWithTag("voice-microphone").assertDoesNotExist()
        compose.onNodeWithTag("voice-cancel").assertIsDisplayed()
        compose.onNodeWithTag("voice-stop").assertIsDisplayed()
        compose.runOnIdle { voice.observer.partial("Plan ficticio provisional") }
        compose.onNodeWithTag("text-composer").assertIsNotEnabled().assertTextContains("Plan ficticio provisional")
        compose.onNodeWithTag("send-action").assertDoesNotExist()
        captureVoiceWindow(compose.activity, "kioku-voice-inline-recording.png")
        compose.onNodeWithTag("voice-stop").performClick()
        compose.onNodeWithTag("text-composer").assertIsEnabled().assertTextContains(voice.finalText)
        compose.onNodeWithTag("voice-cancel").assertDoesNotExist()
        compose.onNodeWithTag("voice-stop").assertDoesNotExist()
        compose.onNodeWithTag("voice-microphone").assertDoesNotExist()
        compose.runOnIdle {
            assertEquals(0, messages.commands.size)
            assertEquals(1, voice.finishes)
        }
        captureVoiceWindow(compose.activity, "kioku-voice-inline-draft.png")
        compose.onNodeWithTag("text-composer").performTextReplacement("¿Qué plan ficticio tiene Lira?")
        compose.onNodeWithTag("send-action").performClick()
        compose.waitUntil(5000) { messages.commands.size == 1 }
        compose.runOnIdle {
            assertEquals("¿Qué plan ficticio tiene Lira?", messages.commands.single().text)
            assertEquals(TextIntent.Ask, messages.commands.single().intent)
        }
    }

    @Test fun typingHidesMicrophoneAndClearingEverythingRestoresIt() {
        compose.onNodeWithTag("text-composer").performTextInput("Texto ficticio")
        compose.onNodeWithTag("voice-microphone").assertDoesNotExist()
        compose.onNodeWithTag("send-action").assertIsEnabled()
        compose.onNodeWithTag("text-composer").performTextClearance()
        compose.onNodeWithTag("send-action").assertDoesNotExist()
        compose.onNodeWithTag("voice-microphone").assertIsDisplayed()
        compose.runOnIdle { assertEquals(0, voice.begins) }
    }

    @Test fun cancellationDiscardsPartialSpeechAndLateResults() {
        startAccessibly()
        compose.runOnIdle { voice.observer.partial("Dato ficticio descartado") }
        compose.onNodeWithTag("voice-cancel").performClick()
        compose.runOnIdle { voice.observer.completed("Dato ficticio tardío") }
        compose.onNodeWithTag("text-composer").assertTextContains("")
        compose.onNodeWithTag("voice-microphone").assertIsDisplayed()
        compose.onNodeWithTag("send-action").assertDoesNotExist()
        compose.runOnIdle { assertEquals(0, messages.commands.size) }
    }

    @Test fun cancellingWhileWaitingForFinalTextCannotRestoreTheDraftLater() {
        voice.completesImmediately = false
        startAccessibly()
        compose.runOnIdle { voice.observer.partial("Texto ficticio provisional") }
        compose.onNodeWithTag("voice-stop").performClick()
        compose.onNodeWithTag("voice-stop").assertIsNotEnabled()
        compose.onNodeWithTag("send-action").assertDoesNotExist()
        compose.onNodeWithTag("voice-cancel").performClick()
        compose.runOnIdle { voice.observer.completed("Texto ficticio final tardío") }
        compose.onNodeWithTag("text-composer").assertTextContains("")
        compose.onNodeWithTag("voice-microphone").assertIsDisplayed()
        compose.runOnIdle { assertEquals(0, messages.commands.size) }
    }

    @Test fun accessibleStartAndStopUseSeparateNamedIconActions() {
        startAccessibly()
        compose.onNodeWithContentDescription("Cancelar voz").assertIsDisplayed()
        compose.onNodeWithContentDescription("Parar dictado").performSemanticsAction(SemanticsActions.OnClick) { it() }
        compose.onNodeWithTag("text-composer").assertTextContains(voice.finalText)
        compose.runOnIdle {
            assertEquals(1, voice.begins)
            assertEquals(1, voice.finishes)
            assertEquals(0, messages.commands.size)
        }
    }

    @Test fun interruptedSpeechCanBeEditedButNeverAutomaticallySubmitted() {
        startAccessibly()
        compose.runOnIdle {
            voice.observer.partial("Texto ficticio incompleto")
            voice.observer.failed(VoiceIssue.Interrupted)
        }
        compose.onNodeWithText("Pasar el texto al editor").performClick()
        compose.onNodeWithTag("text-composer").assertTextContains("Texto ficticio incompleto")
        compose.runOnIdle { assertEquals(0, messages.commands.size) }
    }

    @Test fun navigatingAwayCancelsTheMicrophoneAndRejectsLateCallbacks() {
        startAccessibly()
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
        startAccessibly()
        compose.activityRule.scenario.moveToState(Lifecycle.State.STARTED)
        compose.runOnUiThread { voice.observer.completed("Dato ficticio tras salir") }
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.runOnIdle {
            assertEquals(0, messages.commands.size)
            assertEquals(1, voice.begins)
        }
    }

    @Test fun deniedPermissionKeepsTextEntryAvailableAndRequiresAnotherTap() {
        voice.issue = VoiceIssue.Permission
        startAccessibly()
        compose.onNodeWithText("Permitir micrófono").performClick()
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.runOnIdle {
            assertEquals(1, voice.permissions)
            assertEquals(1, voice.begins)
            assertEquals(0, messages.commands.size)
        }
    }

    private fun startAccessibly() {
        compose.onNodeWithTag("voice-microphone").performSemanticsAction(SemanticsActions.OnClick) { it() }
    }
}
