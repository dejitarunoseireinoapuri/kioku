package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.ScreenHeading
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.finish
import io.github.dejitarunoseireinoapuri.kioku.resources.locked_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.locked_title
import io.github.dejitarunoseireinoapuri.kioku.resources.movie_story
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_accept
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_decline
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_pending
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_question
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_story
import io.github.dejitarunoseireinoapuri.kioku.resources.offer_title
import io.github.dejitarunoseireinoapuri.kioku.resources.offline_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.offline_title
import io.github.dejitarunoseireinoapuri.kioku.resources.retry
import io.github.dejitarunoseireinoapuri.kioku.resources.sample_timer
import io.github.dejitarunoseireinoapuri.kioku.resources.sample_transcript
import org.jetbrains.compose.resources.stringResource

@Composable
fun LockedExample() {
    Panel {
        ScreenHeading(stringResource(Res.string.locked_title))
        Text(stringResource(Res.string.locked_hint), color = KiokuColors.Secondary)
    }
    Panel {
        Text(
            stringResource(Res.string.sample_timer),
            fontSize = 32.sp,
        )
        Text(stringResource(Res.string.sample_transcript), color = KiokuColors.Secondary)
        Text(stringResource(Res.string.movie_story))
    }
}

@Composable
fun LockedActions(onEvent: (ConversationEvent) -> Unit) {
    Surface(color = KiokuColors.Surface) {
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            ActionButton(
                stringResource(Res.string.cancel),
                { onEvent(ConversationEvent.CancelExample) },
                Modifier.weight(1f),
            )
            ActionButton(
                stringResource(Res.string.finish),
                { onEvent(ConversationEvent.FinishExample) },
                Modifier.weight(1f),
                primary = true,
            )
        }
    }
}

@Composable
fun OfferExample(
    feedback: PreviewFeedback?,
    onEvent: (ConversationEvent) -> Unit,
) {
    Panel { Text(stringResource(Res.string.offer_story)) }
    Panel {
        Text(stringResource(Res.string.offer_title), color = KiokuColors.Secondary)
        Text(stringResource(Res.string.offer_question))
        if (feedback == null) {
            Text(stringResource(Res.string.offer_pending), color = KiokuColors.Secondary)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ActionButton(stringResource(Res.string.offer_accept), { onEvent(ConversationEvent.DecideOffer(true)) })
                ActionButton(
                    stringResource(Res.string.offer_decline),
                    { onEvent(ConversationEvent.DecideOffer(false)) },
                )
            }
        }
    }
}

@Composable
fun OfflineExample(onRetry: () -> Unit) {
    ScreenHeading(stringResource(Res.string.offline_title))
    Text(stringResource(Res.string.offline_hint), color = KiokuColors.Secondary)
    ActionButton(stringResource(Res.string.retry), onRetry)
}
