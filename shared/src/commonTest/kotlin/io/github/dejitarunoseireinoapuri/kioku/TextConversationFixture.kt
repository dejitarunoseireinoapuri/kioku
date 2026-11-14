package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.PlanStamp
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextExecution
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.domain.TextWorkIds

internal class TextConversationFixture : TextConversationRepository {
    val commands = mutableListOf<TextCommand>()
    val sourceRequests = mutableListOf<String>()
    private var ids = 0
    val stamp = PlanStamp(0, "2026-11-14T12:00:00Z", 1794657900000)
    var plan: (TextCommand) -> TextPlan = { TextPlan.Offer(stamp, it.text, false) }
    var reply: suspend (TextCommand) -> TextOutcome = { TextOutcome.Offered(it.text) }
    var readSource: suspend (String) -> MemorySource? = { null }
    val recoveries = mutableListOf<TextCommand>()
    var recovery: suspend () -> CaptureOutcome = { CaptureOutcome.Unconfirmed }

    override fun prepare(
        text: String,
        intent: TextIntent,
        context: TextContext,
    ) = TextCommand(
        TextWorkIds("route-${ids++}", "action-${ids++}", "query-${ids++}"),
        intent,
        text,
        "Europe/Madrid",
        context,
    )

    override fun clarify(
        text: String,
        pending: CaptureOutcome.Clarification,
        intent: TextIntent,
        context: TextContext,
    ): TextCommand {
        val command = prepare(text, intent, context)
        return command.copy(capture = CaptureCommand.Clarify(command.ids.action, text, pending.id, pending.revision))
    }

    override suspend fun execute(
        command: TextCommand,
        onPrepared: (TextCommand) -> Unit,
    ): TextExecution {
        val prepared = if (command.capture != null) command else command.copy(plan = command.plan ?: plan(command))
        commands.add(prepared)
        onPrepared(prepared)
        return TextExecution(prepared, reply(prepared))
    }

    override suspend fun recoverCapture(command: TextCommand): CaptureOutcome {
        recoveries.add(command)
        return recovery()
    }

    override suspend fun source(id: String): MemorySource? {
        sourceRequests.add(id)
        return readSource(id)
    }
}
