package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_checking
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_saving
import io.github.dejitarunoseireinoapuri.kioku.resources.configuration_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.query_searching
import io.github.dejitarunoseireinoapuri.kioku.resources.source_loading
import org.jetbrains.compose.resources.StringResource

internal fun contentLoadingStatus(
    state: ConversationState,
    refreshing: Boolean,
): StringResource? =
    when {
        refreshing -> Res.string.configuration_loading
        state.query.sourceLoading -> Res.string.source_loading
        state.query.busy -> Res.string.query_searching
        state.capturing && state.capture == CaptureOutcome.Processing -> Res.string.capture_checking
        state.capturing -> Res.string.capture_saving
        else -> null
    }
