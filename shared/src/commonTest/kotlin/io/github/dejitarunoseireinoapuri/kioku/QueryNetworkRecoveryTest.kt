package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.data.NativeTextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.PlanStamp
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class QueryNetworkRecoveryTest {
    @Test
    fun lostRoutingReplyCanRenewOnlyTheRouteAndKeepTheOwnersQuestion() =
        runTest {
            val port = RecoveryPort()
            val repo = NativeTextConversationRepository(port)
            val command = repo.prepare("¿Qué plan ficticio tengo?", TextIntent.Ask, TextContext())
            var routes = 0
            port.reply = { endpoint, id ->
                when {
                    endpoint == MemoryEndpoint.Query -> port.answer(id)
                    routes++ == 0 -> NativeMemoryReply.Failed(CaptureIssue.Connection)
                    routes == 2 -> port.terminal(id, query = false)
                    else -> port.route(id)
                }
            }
            val failed = repo.execute(command)
            assertEquals(CaptureIssue.Connection, assertIs<TextOutcome.Failed>(failed.outcome).issue)
            val recovered = repo.execute(failed.command)
            assertIs<QueryOutcome.Reply>(assertIs<TextOutcome.Asked>(recovered.outcome).answer)
            assertEquals(command.text, recovered.command.text)
            assertNotEquals(command.ids.route, recovered.command.ids.route)
            assertEquals(command.ids.action, recovered.command.ids.action)
            assertEquals(command.ids.query, recovered.command.ids.query)
            assertEquals(3, routes)
        }

    @Test
    fun lostAnswerAndAnotherDisconnectKeepTheRenewedReadIdForTheNextRetry() =
        runTest {
            val port = RecoveryPort()
            val repo = NativeTextConversationRepository(port)
            val command = repo.prepare("¿Qué plan ficticio tengo?", TextIntent.Ask, TextContext())
            var reads = 0
            port.reply = { endpoint, id ->
                if (endpoint == MemoryEndpoint.RouteMessage) {
                    port.route(id)
                } else {
                    when (reads++) {
                        0 -> NativeMemoryReply.Failed(CaptureIssue.TimedOut)
                        1 -> port.terminal(id, query = true)
                        2 -> NativeMemoryReply.Failed(CaptureIssue.Connection)
                        else -> port.answer(id)
                    }
                }
            }
            val first = repo.execute(command)
            assertEquals(
                CaptureIssue.TimedOut,
                assertIs<QueryOutcome.Failed>(assertIs<TextOutcome.Asked>(first.outcome).answer).issue,
            )
            val second = repo.execute(first.command)
            assertEquals(
                CaptureIssue.Connection,
                assertIs<QueryOutcome.Failed>(assertIs<TextOutcome.Asked>(second.outcome).answer).issue,
            )
            val third = repo.execute(second.command)
            assertIs<QueryOutcome.Reply>(assertIs<TextOutcome.Asked>(third.outcome).answer)
            val ids = port.calls.filter { it.first == MemoryEndpoint.Query }.map { it.second }
            assertEquals(
                listOf(command.ids.query, command.ids.query, second.command.ids.query, second.command.ids.query),
                ids,
            )
            assertNotEquals(command.ids.query, second.command.ids.query)
            assertEquals(second.command.ids.query, third.command.ids.query)
            assertEquals(command.text, third.command.text)
            assertEquals(1, port.calls.count { it.first == MemoryEndpoint.RouteMessage })
        }

    @Test
    fun aReadStillProcessingDoesNotCreateAnotherReadOrRoutingRequest() =
        runTest {
            val port = RecoveryPort()
            val repo = NativeTextConversationRepository(port)
            val command = repo.prepare("Pregunta ficticia.", TextIntent.Ask, TextContext())
            port.reply = { endpoint, id ->
                if (endpoint == MemoryEndpoint.RouteMessage) port.route(id) else port.terminal(id, true, "processing")
            }
            val first = repo.execute(command)
            val second = repo.execute(first.command)
            assertEquals(QueryOutcome.Processing, assertIs<TextOutcome.Asked>(second.outcome).answer)
            assertEquals(first.command.ids, second.command.ids)
            assertEquals(3, port.calls.size)
        }

    @Test
    fun renewedRouteIsBoundedAndNeverTurnsIntoAnAutomaticRetryLoop() =
        runTest {
            val port = RecoveryPort()
            val repo = NativeTextConversationRepository(port)
            port.reply = { _, id -> port.terminal(id, false) }
            val result = repo.execute(repo.prepare("Pregunta ficticia.", TextIntent.Ask, TextContext()))
            assertEquals(TextOutcome.RepeatRequired, result.outcome)
            assertEquals(2, port.calls.size)
            assertTrue(port.calls.all { it.first == MemoryEndpoint.RouteMessage })
        }

    @Test
    fun uncertainAcceptedOfferNeverRenewsItsWriteOrRoutingIdentity() =
        runTest {
            val port = RecoveryPort()
            val repo = NativeTextConversationRepository(port)
            val original = repo.prepare("Dato ficticio.", TextIntent.Ask, TextContext())
            val approved =
                original.copy(
                    plan =
                        TextPlan.Offer(
                            PlanStamp(0, "2026-11-17T12:00:00Z", 4_000_000_000_000),
                            original.text,
                            false,
                        ),
                    decision = OfferDecision.Accept,
                )
            port.reply = { _, _ -> NativeMemoryReply.Failed(CaptureIssue.Connection) }
            val first = repo.execute(approved)
            val second = repo.execute(first.command)
            assertEquals(CaptureOutcome.Unconfirmed, assertIs<TextOutcome.Captured>(second.outcome).capture)
            assertEquals(approved.ids, second.command.ids)
            assertTrue(port.calls.all { it.first in setOf(MemoryEndpoint.ApplyMessage, MemoryEndpoint.Operation) })
            assertTrue(port.calls.all { it.second == approved.ids.action })
        }

    @Test
    fun aLocalReadTimeoutKeepsTheQuestionAndCancelsTheTransport() =
        runTest {
            val port = RecoveryPort()
            val repo = NativeTextConversationRepository(port)
            val original = repo.prepare("Pregunta ficticia.", TextIntent.Ask, TextContext())
            port.reply = { endpoint, id -> if (endpoint == MemoryEndpoint.RouteMessage) port.route(id) else null }
            val result = repo.execute(original)
            assertEquals(
                CaptureIssue.TimedOut,
                assertIs<QueryOutcome.Failed>(assertIs<TextOutcome.Asked>(result.outcome).answer).issue,
            )
            assertEquals(original.text, result.command.text)
            assertTrue(port.cancelled)
        }
}

private class RecoveryPort : NativeMemoryPort {
    private var ids = 0
    val calls = mutableListOf<Pair<MemoryEndpoint, String>>()
    var cancelled = false
    var reply: (MemoryEndpoint, String) -> NativeMemoryReply? = { _, _ -> null }

    override fun requestId() = "00000000-0000-4000-8000-${(++ids).toString().padStart(12, '0')}"

    override fun timeZone() = "UTC"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        val id =
            Json
                .parseToJsonElement(json)
                .jsonObject
                .getValue("requestId")
                .jsonPrimitive.content
        calls.add(endpoint to id)
        reply(endpoint, id)?.let(completion)
        return NativeCancellation { cancelled = true }
    }

    fun route(id: String) =
        NativeMemoryReply.Received(
            """{"apiVersion":2,"operationId":"$id","status":"ready",
        "plan":{"action":"ask","memoryEpoch":0,"receivedAt":"2026-11-17T12:00:00Z","expiresAtMs":4000000000000}}""",
        )

    fun answer(id: String) =
        NativeMemoryReply.Received(
            """{"apiVersion":2,"operationId":"$id","status":"notFound",
        "text":"No consta otro plan ficticio.","sources":[]}""",
        )

    fun terminal(
        id: String,
        query: Boolean,
        status: String = "repeatRequired",
    ): NativeMemoryReply.Received {
        val answerFields = if (query) ",\"text\":\"\",\"sources\":[]" else ""
        return NativeMemoryReply.Received(
            """{"apiVersion":2,"operationId":"$id","status":"$status"$answerFields}""",
        )
    }
}
