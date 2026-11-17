package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome

internal val ConversationState.inputLimit: Int
    get() =
        if (capture is CaptureOutcome.Clarification || conversation?.clarification == true ||
            intent == MemoryIntent.Ask
        ) {
            2000
        } else {
            8000
        }
