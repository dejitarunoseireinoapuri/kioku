package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeDescription
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextExecution
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import io.github.dejitarunoseireinoapuri.kioku.domain.TextWorkIds
import io.github.dejitarunoseireinoapuri.kioku.domain.describeChange
import io.github.dejitarunoseireinoapuri.kioku.domain.previewForget
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonObject
import kotlin.coroutines.resume

class NativeTextConversationRepository(
    private val port: NativeMemoryPort,
) : TextConversationRepository {
    private val captures = NativeCaptureRepository(port)
    private val queries = NativeQueryRepository(port)
    private val controls = NativeMemoryControlRepository(port)

    override fun prepare(
        text: String,
        intent: TextIntent,
        context: TextContext,
    ) = TextCommand(
        TextWorkIds(port.requestId(), port.requestId(), port.requestId()),
        intent,
        text,
        port.timeZone(),
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
    ): TextExecution =
        if (!withinContextLimit(command)) {
            TextExecution(command, TextOutcome.Failed(CaptureIssue.MoreContext))
        } else {
            command.capture?.let { TextExecution(command, TextOutcome.Captured(captures.execute(it))) }
                ?: executeRouted(command, onPrepared)
        }

    private fun withinContextLimit(command: TextCommand): Boolean {
        if (command.intent != TextIntent.Ask || command.plan != null || command.capture != null) return true
        val query = QueryCommand(command.ids.query, command.text, command.context.questions, command.context.revision)
        return queryQuestion(query).length <= MAX_TEXT_QUERY
    }

    private suspend fun executeRouted(
        command: TextCommand,
        onPrepared: (TextCommand) -> Unit,
    ): TextExecution {
        val resolved = resolve(command)
        resolved.outcome?.let { return TextExecution(resolved.command, it) }
        onPrepared(resolved.command)
        return if (resolved.command.plan is TextPlan.Ask) {
            executeQuery(resolved.command, onPrepared)
        } else {
            executePrepared(resolved.command)
        }
    }

    private suspend fun executePrepared(command: TextCommand): TextExecution {
        val description = describeChange(command)
        val result =
            try {
                perform(command)
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                TextOutcome.Processing
            }
        val outcome =
            if (result == TextOutcome.Processing && command.plan is TextPlan.Offer &&
                command.decision == OfferDecision.Accept
            ) {
                TextOutcome.Captured(captures.recover(command.ids.action))
            } else {
                result
            }
        return TextExecution(command, outcome, description.takeIf { outcome is TextOutcome.Changed })
    }

    private suspend fun describeChange(command: TextCommand): MemoryChangeDescription? {
        val plan = command.plan as? TextPlan.Change
        return when {
            plan == null -> {
                null
            }

            plan.action == ChangeAction.Forget -> {
                command.forgetApproval?.let { MemoryChangeDescription(it.text) }
            }

            else -> {
                controls
                    .details(plan.sourceId)
                    ?.takeIf { it.version == plan.version && it.memoryRevision == plan.stamp.revision }
                    ?.describeChange(plan.memoryIds, plan.correction)
            }
        }
    }

    private suspend fun executeQuery(
        command: TextCommand,
        onPrepared: (TextCommand) -> Unit,
    ): TextExecution {
        val answer = ask(command, requireNotNull(command.plan))
        if (answer != QueryOutcome.RepeatRequired) return TextExecution(command, TextOutcome.Asked(answer))
        // The server confirms this read is terminal; only the read ID may be renewed once.
        val renewed = command.copy(ids = command.ids.copy(query = port.requestId()))
        onPrepared(renewed)
        return TextExecution(renewed, TextOutcome.Asked(ask(renewed, requireNotNull(renewed.plan))))
    }

    private suspend fun resolve(
        command: TextCommand,
        renew: Boolean = true,
    ): RoutingResolution {
        if (command.plan != null) return RoutingResolution(command)
        return when (val reply = request(MemoryEndpoint.RouteMessage, routingPayload(command).toString())) {
            is NativeMemoryReply.Failed -> {
                RoutingResolution(command, TextOutcome.Failed(reply.issue))
            }

            is NativeMemoryReply.Received -> {
                try {
                    when (val route = parseRouting(reply.json, command)) {
                        is RoutingReply.Ready -> {
                            RoutingResolution(command.copy(plan = route.plan))
                        }

                        is RoutingReply.Clarification -> {
                            RoutingResolution(
                                command,
                                TextOutcome.Clarification(route.question),
                            )
                        }

                        RoutingReply.Processing -> {
                            RoutingResolution(command, TextOutcome.Processing)
                        }

                        RoutingReply.RepeatRequired -> {
                            if (renew && command.decision == null) {
                                resolve(command.copy(ids = command.ids.copy(route = port.requestId())), renew = false)
                            } else {
                                RoutingResolution(command, TextOutcome.RepeatRequired)
                            }
                        }
                    }
                } catch (_: Exception) {
                    RoutingResolution(command, TextOutcome.Failed(CaptureIssue.Unavailable))
                }
            }
        }
    }

    private suspend fun perform(command: TextCommand): TextOutcome =
        when (val plan = requireNotNull(command.plan)) {
            is TextPlan.Ask -> {
                TextOutcome.Asked(ask(command, plan))
            }

            is TextPlan.Tell -> {
                TextOutcome.Captured(
                    captures.execute(
                        CaptureCommand.Tell(command.ids.action, command.text, command.zone, plan.stamp.revision),
                    ),
                )
            }

            is TextPlan.Change -> {
                if (plan.action == ChangeAction.Forget && command.forgetApproval == null) {
                    previewForget(plan)
                } else {
                    apply(command)
                }
            }

            is TextPlan.Offer -> {
                if (command.decision != null) {
                    apply(command)
                } else {
                    TextOutcome.Offered(
                        plan.fact,
                        if (plan.alsoAsk) ask(command, plan) else null,
                    )
                }
            }
        }

    private suspend fun previewForget(plan: TextPlan.Change): TextOutcome {
        val source = controls.details(plan.sourceId) ?: return TextOutcome.Failed(CaptureIssue.Unavailable)
        return if (source.version != plan.version || source.memoryRevision != plan.stamp.revision) {
            TextOutcome.RepeatRequired
        } else {
            val preview = source.previewForget(plan.memoryIds, plan.forgetScope ?: ForgetScope.Source)
            preview?.let { TextOutcome.ConfirmForget(it) } ?: TextOutcome.RepeatRequired
        }
    }

    private suspend fun ask(
        command: TextCommand,
        plan: TextPlan,
    ) = queries.execute(
        QueryCommand(
            command.ids.query,
            command.text,
            command.context.questions.takeIf { command.context.revision == plan.stamp.revision } ?: emptyList(),
            plan.stamp.revision,
        ),
    )

    private suspend fun apply(command: TextCommand): TextOutcome =
        when (val reply = request(MemoryEndpoint.ApplyMessage, decisionPayload(command))) {
            is NativeMemoryReply.Failed -> {
                when (reply.issue) {
                    CaptureIssue.Unavailable, CaptureIssue.Connection, CaptureIssue.TimedOut -> TextOutcome.Processing
                    CaptureIssue.NotConfigured -> TextOutcome.Expired
                    else -> TextOutcome.Failed(reply.issue)
                }
            }

            is NativeMemoryReply.Received -> {
                parseApplied(reply.json, command)
            }
        }

    private fun parseApplied(
        json: String,
        command: TextCommand,
    ): TextOutcome {
        require(json.length <= MAX_APPLIED_TEXT)
        val value = Json.parseToJsonElement(json).jsonObject
        require((value["operationId"] as? JsonPrimitive)?.content == command.ids.action)
        if ((value["status"] as? JsonPrimitive)?.content == "declined") {
            require(command.plan is TextPlan.Offer && command.decision == OfferDecision.Reject)
            require(value.keys == setOf("apiVersion", "operationId", "status"))
            val version = value["apiVersion"] as? JsonPrimitive
            require(version != null && !version.isString && version.doubleOrNull == 2.0)
            return TextOutcome.Declined
        }
        return if (command.plan is TextPlan.Change) {
            when (val result = parseMemoryChange(json, command.ids.action)) {
                is MemoryChange.Confirmed -> {
                    require(result.action == command.plan.action)
                    TextOutcome.Changed(result.forSource(command.plan.sourceId))
                }

                is MemoryChange.Clarification -> {
                    TextOutcome.Clarification(result.text)
                }

                is MemoryChange.Failed -> {
                    TextOutcome.Failed(result.issue)
                }

                MemoryChange.Processing -> {
                    TextOutcome.Processing
                }
            }
        } else {
            require(command.plan is TextPlan.Offer && command.decision == OfferDecision.Accept)
            TextOutcome.Captured(parseCapture(json))
        }
    }

    override suspend fun source(id: String) = queries.source(id)

    override suspend fun recoverCapture(command: TextCommand): CaptureOutcome =
        captures.recover(command.capture?.requestId ?: command.ids.action)

    private suspend fun request(
        endpoint: MemoryEndpoint,
        json: String,
    ): NativeMemoryReply =
        try {
            withTimeoutOrNull(TEXT_REQUEST_TIMEOUT) {
                suspendCancellableCoroutine { continuation ->
                    val handle = port.call(endpoint, json) { if (continuation.isActive) continuation.resume(it) }
                    continuation.invokeOnCancellation { handle.cancel() }
                }
            } ?: NativeMemoryReply.Failed(CaptureIssue.TimedOut)
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            NativeMemoryReply.Failed(CaptureIssue.Unavailable)
        }
}

private data class RoutingResolution(
    val command: TextCommand,
    val outcome: TextOutcome? = null,
)

private const val TEXT_REQUEST_TIMEOUT = 195000L
private const val MAX_APPLIED_TEXT = 80000
private const val MAX_TEXT_QUERY = 2000
