package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextWorkIds
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.ConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.MemoryIntent
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextConversationState
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextMessage
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.TextStatus
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ConversationSpacingTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Test fun removingHelpAndEmptyReceiptsLeavesOnlyTheNormalGap() {
        val command = TextCommand(TextWorkIds("r", "a", "q"), TextIntent.Ask, "Uno", "UTC", TextContext())
        val first = TextMessage.Owner(1, "Pregunta ficticia uno")
        val state =
            mutableStateOf(
                TextConversationState(
                    messages = listOf(first),
                    status = TextStatus.Ready(command, TextOutcome.Clarification("Ayuda ficticia temporal")),
                ),
            )
        compose.setContent {
            KiokuTheme {
                ConversationScreen(
                    ConversationState(intent = MemoryIntent.Ask, conversation = state.value),
                    {},
                    {},
                    onSource = {},
                )
            }
        }
        compose.onNodeWithText("Ayuda ficticia temporal").assertIsDisplayed()
        compose.runOnIdle {
            val saved =
                TextOutcome.Captured(
                    CaptureOutcome.Saved(MemorySource("synthetic", "Ficticio", "2026-11-17"), 1),
                )
            state.value =
                TextConversationState(
                    messages =
                        listOf(first) + (2L..11L).map { TextMessage.Result(it, saved) } +
                            TextMessage.Owner(12, "Pregunta ficticia dos"),
                )
        }
        compose.onNodeWithText("Ayuda ficticia temporal").assertDoesNotExist()
        val firstBounds = compose.onNodeWithText("Pregunta ficticia uno").fetchSemanticsNode().boundsInRoot
        val secondBounds = compose.onNodeWithText("Pregunta ficticia dos").fetchSemanticsNode().boundsInRoot
        val density = compose.activity.resources.displayMetrics.density
        // 24 dp between groups plus each message's 4 dp reading padding.
        assertEquals(32f, (secondBounds.top - firstBounds.bottom) / density, 1f)
    }
}
