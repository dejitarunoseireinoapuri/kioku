package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.memoryChangeText
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.history_reply
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun TextMessageContent(
    message: TextMessage,
    presentation: MessageFeedPresentation,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
    onManage: (String) -> Unit,
) {
    val state = presentation.state
    when (message) {
        is TextMessage.Notice -> {
            Panel {
                val text = presentation.forgottenText.takeIf { message.id == state.messages.lastOrNull()?.id }
                Text(memoryChangeText(message.action, text))
            }
        }

        is TextMessage.Owner -> {
            OwnerMemoryMessage(
                message.text,
                presentation.sources[message.id],
                !state.busy && !state.confirmingForget,
                onManage,
                message.historical,
            )
        }

        is TextMessage.PastReply -> {
            Panel {
                Text(
                    stringResource(Res.string.history_reply),
                    style = MaterialTheme.typography.caption,
                    color = KiokuColors.Secondary,
                )
                Text(message.text)
            }
        }

        is TextMessage.Result -> {
            TextResultContent(message, presentation, onEvent, onSource)
        }
    }
}

@Composable
private fun TextResultContent(
    message: TextMessage.Result,
    presentation: MessageFeedPresentation,
    onEvent: (ConversationEvent) -> Unit,
    onSource: (String) -> Unit,
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
            onSource,
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
