package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.ScreenHeading
import io.github.dejitarunoseireinoapuri.kioku.design.memoryChangeText
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.ask_heading
import io.github.dejitarunoseireinoapuri.kioku.resources.ask_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.ask_title
import io.github.dejitarunoseireinoapuri.kioku.resources.clarification_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.clarification_pending
import io.github.dejitarunoseireinoapuri.kioku.resources.control_corrected
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgotten_fallback
import io.github.dejitarunoseireinoapuri.kioku.resources.exam_clarification
import io.github.dejitarunoseireinoapuri.kioku.resources.exam_story
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_preview_notice
import io.github.dejitarunoseireinoapuri.kioku.resources.movie_answer
import io.github.dejitarunoseireinoapuri.kioku.resources.movie_question
import io.github.dejitarunoseireinoapuri.kioku.resources.movie_story
import io.github.dejitarunoseireinoapuri.kioku.resources.no_audio_archive
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_accepted_example
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_declined_example
import io.github.dejitarunoseireinoapuri.kioku.resources.query_unavailable
import io.github.dejitarunoseireinoapuri.kioku.resources.read_answer
import io.github.dejitarunoseireinoapuri.kioku.resources.ready_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.ready_title
import io.github.dejitarunoseireinoapuri.kioku.resources.sample_date
import io.github.dejitarunoseireinoapuri.kioku.resources.saved_example
import io.github.dejitarunoseireinoapuri.kioku.resources.saved_title
import io.github.dejitarunoseireinoapuri.kioku.resources.source_context
import io.github.dejitarunoseireinoapuri.kioku.resources.tell_heading
import io.github.dejitarunoseireinoapuri.kioku.resources.text_preview_notice
import io.github.dejitarunoseireinoapuri.kioku.resources.view_source
import io.github.dejitarunoseireinoapuri.kioku.resources.voice_preview_notice
import org.jetbrains.compose.resources.stringResource

@Composable
fun ConversationBody(
    state: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
    onManage: (List<String>) -> Unit = { onSource(it.first()) },
) {
    when {
        state.showingConversation -> {
            TextConversationBody(
                requireNotNull(state.conversation),
                onEvent,
                onSource,
                onManage,
                state.forgottenText,
            )
        }

        state.showingQuery -> {
            QueryBody(state.query, onEvent, onSource, onManage)
        }

        state.showingCapture -> {
            CaptureBody(state, onEvent, { onManage(listOf(it)) })
        }

        else -> {
            PreviewConversationBody(state, onEvent, onSource)
        }
    }
}

@Composable
private fun PreviewConversationBody(
    state: ConversationState,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
        when (state.scenario) {
            PreviewScenario.Ready -> {
                ReadyContent(state.intent)
            }

            PreviewScenario.Locked -> {
                LockedExample()
            }

            PreviewScenario.Clarification -> {
                ClarificationExample()
            }

            PreviewScenario.Saved -> {
                SavedExample { onSource("movie-original") }
            }

            PreviewScenario.Answer -> {
                AnswerExample(onEvent) { onSource("movie-original") }
            }

            PreviewScenario.Offer -> {
                OfferExample(state.feedback, onEvent)
            }

            PreviewScenario.Corrected -> {
                Panel { Text(stringResource(Res.string.movie_story)) }
                ActionButton(stringResource(Res.string.view_source), { onSource("movie-corrected") })
            }

            PreviewScenario.Offline -> {
                OfflineExample { onEvent(ConversationEvent.CancelExample) }
            }
        }
    }
}

@Composable
private fun ReadyContent(intent: MemoryIntent) {
    val tell = intent == MemoryIntent.Tell
    Text(stringResource(if (tell) Res.string.tell_heading else Res.string.ask_heading), color = KiokuColors.Accent)
    ScreenHeading(stringResource(if (tell) Res.string.ready_title else Res.string.ask_title))
    Text(stringResource(if (tell) Res.string.ready_hint else Res.string.ask_hint), color = KiokuColors.Secondary)
}

@Composable
private fun SavedExample(onSource: () -> Unit) {
    Panel { Text(stringResource(Res.string.movie_story)) }
    Text(stringResource(Res.string.sample_date), color = KiokuColors.Secondary)
    Panel {
        ScreenHeading(stringResource(Res.string.saved_title))
        Text(stringResource(Res.string.saved_example))
        ActionButton(stringResource(Res.string.view_source), onSource)
        Text(stringResource(Res.string.no_audio_archive), color = KiokuColors.Secondary)
    }
}

@Composable
private fun AnswerExample(
    onEvent: (ConversationEvent) -> Unit,
    onSource: () -> Unit,
) {
    Panel { Text(stringResource(Res.string.movie_question)) }
    Panel {
        Text(stringResource(Res.string.movie_answer))
        ActionButton(stringResource(Res.string.read_answer), { onEvent(ConversationEvent.TryVoice) })
    }
    Text(stringResource(Res.string.source_context), color = KiokuColors.Secondary)
    ActionButton(stringResource(Res.string.view_source), onSource)
}

@Composable
private fun ClarificationExample() {
    Text(stringResource(Res.string.clarification_pending), color = KiokuColors.Accent)
    Panel { Text(stringResource(Res.string.exam_story)) }
    Panel { Text(stringResource(Res.string.exam_clarification)) }
    Text(stringResource(Res.string.clarification_hint), color = KiokuColors.Secondary)
}

@Composable
fun FeedbackMessage(
    feedback: PreviewFeedback,
    forgottenText: String? = null,
) {
    val text =
        when (feedback) {
            PreviewFeedback.TextOnly -> Res.string.text_preview_notice
            PreviewFeedback.VoiceUnavailable -> Res.string.voice_preview_notice
            PreviewFeedback.AcceptedExample -> Res.string.offer_accepted_example
            PreviewFeedback.DeclinedExample -> Res.string.offer_declined_example
            PreviewFeedback.ForgetUnavailable -> Res.string.forget_preview_notice
            PreviewFeedback.QueryUnavailable -> Res.string.query_unavailable
            PreviewFeedback.Corrected -> Res.string.control_corrected
            PreviewFeedback.Forgotten -> Res.string.control_forgotten_fallback
        }
    Text(
        if (feedback == PreviewFeedback.Forgotten) {
            memoryChangeText(ChangeAction.Forget, forgottenText)
        } else {
            stringResource(text)
        },
        color = KiokuColors.Accent,
        style = MaterialTheme.typography.body2,
        modifier = Modifier.padding(top = 16.dp),
    )
}
