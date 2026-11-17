package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import kotlinx.coroutines.flow.first
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun ConversationFeed(
    state: ConversationState,
    actions: FeedActions,
    loading: StringResource?,
    modifier: Modifier = Modifier,
) {
    val conversation = requireNotNull(state.conversation)
    val visible = !state.concealingMemory
    val presentation =
        MessageFeedPresentation(
            conversation,
            remember(conversation.messages) { conversation.savedMessageSources() },
            state.forgottenText,
        )
    val messages =
        conversation.messages.takeIf { visible }.orEmpty().filter {
            it !is TextMessage.Result || it.visibleOutcome(presentation.sources)?.hasContent() == true
        }
    val tail = visible && conversation.tailOutcome() != null
    val scroll = rememberLazyListState()
    val viewport by remember { derivedStateOf { scroll.layoutInfo.viewportEndOffset } }
    val count =
        messages.size + (if (tail) 1 else 0) + (if (visible && state.feedback != null) 1 else 0) +
            (if (loading != null) 1 else 0)
    LaunchedEffect(messages.lastOrNull()?.id, count, loading, state.feedback, state.intent, viewport) {
        if (count > 0) {
            snapshotFlow { scroll.layoutInfo.totalItemsCount }.first { it == count }
            scroll.animateScrollToItem(count - 1)
        }
    }
    LazyColumn(
        modifier.testTag("conversation-messages"),
        state = scroll,
        contentPadding = PaddingValues(horizontal = KiokuSpacing.Medium, vertical = KiokuSpacing.Large),
        verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large),
    ) {
        items(messages, key = {
            it.id
        }) { TextMessageContent(it, presentation, actions.onEvent, actions.onManage) }
        if (visible) {
            if (tail) item("status") { TextConversationTail(conversation, actions.onEvent, actions.onManage) }
            state.feedback?.let { feedback -> item("feedback") { FeedbackMessage(feedback, state.forgottenText) } }
        }
        if (loading != null) item("loading") { ContentLoadingNotice(stringResource(loading)) }
    }
}

internal data class FeedActions(
    val onEvent: (ConversationEvent) -> Unit,
    val onSource: (String) -> Unit,
    val onManage: (List<String>) -> Unit,
)
