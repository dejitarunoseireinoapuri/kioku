package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome

/** Omit empty presentation rows without changing the RAM history or its management identities. */
internal fun TextMessage.visibleOutcome(sources: Map<Long, String>): TextOutcome? {
    val result = this as? TextMessage.Result ?: return null
    val offer = result.outcome as? TextOutcome.Offered
    return if (offer != null && result.ownerId in sources) {
        offer.answer?.let { TextOutcome.Asked(it) }
    } else {
        result.outcome
    }
}

internal fun TextOutcome.hasContent(): Boolean =
    this !is TextOutcome.ConfirmForget && (this as? TextOutcome.Captured)?.capture !is CaptureOutcome.Saved

internal fun TextConversationState.tailOutcome(): TextOutcome? {
    val last = (messages.lastOrNull() as? TextMessage.Result)?.outcome
    return outcome?.takeIf { !busy && it != last && it.hasContent() }
}
