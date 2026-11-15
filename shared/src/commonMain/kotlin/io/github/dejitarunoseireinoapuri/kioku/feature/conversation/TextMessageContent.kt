package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.MemoryChangeNotice
import io.github.dejitarunoseireinoapuri.kioku.design.TranscriptMessage
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.history_reply
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun TextMessageContent(
    message: TextMessage,
    presentation: MessageFeedPresentation,
    onEvent: (ConversationEvent) -> Unit,
    onManage: (List<String>) -> Unit,
) {
    val state = presentation.state
    when (message) {
        is TextMessage.Notice -> {
            MemoryChangeNotice(message.action, message.description)
        }

        is TextMessage.Owner -> {
            OwnerMemoryMessage(
                message.text,
                presentation.sources[message.id],
                !state.busy && !state.confirmingForget,
                { onManage(listOf(it)) },
                message.historical,
            )
        }

        is TextMessage.PastReply -> {
            TranscriptMessage {
                Text(
                    stringResource(Res.string.history_reply),
                    style = MaterialTheme.typography.caption,
                    color = KiokuColors.Secondary,
                )
                Text(message.text, color = KiokuColors.Secondary)
            }
        }

        is TextMessage.Result -> {
            TextResultContent(message, presentation, onEvent, onManage)
        }
    }
}

@Composable
private fun TextResultContent(
    message: TextMessage.Result,
    presentation: MessageFeedPresentation,
    onEvent: (ConversationEvent) -> Unit,
    onManage: (List<String>) -> Unit,
) {
    val state = presentation.state
    val offer = message.outcome as? TextOutcome.Offered
    val outcome =
        if (offer != null && message.ownerId in presentation.sources) {
            offer.answer?.let { TextOutcome.Asked(it) }
        } else {
            message.outcome
        }
    outcome?.let {
        TextOutcomeBody(
            it,
            !state.busy && message.id == state.messages.lastOrNull()?.id,
            onEvent,
            AnswerManagement(!state.busy && !state.confirmingForget, onManage),
            message.captureCommand?.let {
                CaptureRecoveryUi(
                    message.id,
                    state.checkingCapture == message.id,
                    !state.busy,
                )
            },
        )
    }
}
