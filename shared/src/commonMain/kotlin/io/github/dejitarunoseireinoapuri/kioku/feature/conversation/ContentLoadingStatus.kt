package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_checking
import io.github.dejitarunoseireinoapuri.kioku.resources.capture_saving
import io.github.dejitarunoseireinoapuri.kioku.resources.configuration_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.control_checking
import io.github.dejitarunoseireinoapuri.kioku.resources.control_correcting
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgetting
import io.github.dejitarunoseireinoapuri.kioku.resources.control_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.query_searching
import io.github.dejitarunoseireinoapuri.kioku.resources.source_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.text_declining
import io.github.dejitarunoseireinoapuri.kioku.resources.text_interpreting
import org.jetbrains.compose.resources.StringResource

internal fun contentLoadingStatus(
    state: ConversationState,
    refreshing: Boolean,
): StringResource? =
    when {
        state.checkingMemory -> Res.string.control_checking
        refreshing -> Res.string.configuration_loading
        state.conversation?.sourceLoading == true -> Res.string.source_loading
        state.conversation?.busy == true -> messageLoading(state.conversation.status as TextStatus.Working)
        state.query.sourceLoading -> Res.string.source_loading
        state.query.busy -> Res.string.query_searching
        state.capturing && state.capture == CaptureOutcome.Processing -> Res.string.capture_checking
        state.capturing -> Res.string.capture_saving
        else -> null
    }

private fun messageLoading(working: TextStatus.Working): StringResource {
    val command = working.command
    if (command.capture != null) return Res.string.capture_saving
    return when (val plan = command.plan) {
        null -> {
            Res.string.text_interpreting
        }

        is TextPlan.Ask -> {
            Res.string.query_searching
        }

        is TextPlan.Tell -> {
            Res.string.capture_saving
        }

        is TextPlan.Offer -> {
            when (command.decision) {
                OfferDecision.Reject -> Res.string.text_declining
                OfferDecision.Accept -> Res.string.capture_saving
                null -> if (plan.alsoAsk) Res.string.query_searching else Res.string.text_interpreting
            }
        }

        is TextPlan.Change -> {
            changeLoading(command, plan)
        }
    }
}

private fun changeLoading(
    command: TextCommand,
    plan: TextPlan.Change,
): StringResource =
    when {
        plan.action == ChangeAction.Correct -> Res.string.control_correcting
        command.forgetApproval == null -> Res.string.control_loading
        else -> Res.string.control_forgetting
    }
