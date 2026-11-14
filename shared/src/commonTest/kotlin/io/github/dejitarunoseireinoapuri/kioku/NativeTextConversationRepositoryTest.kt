package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.data.NativeTextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class NativeTextConversationRepositoryTest {
    @Test
    fun anUnknownOrBooleanScopeCannotExecuteAnApplication() =
        runTest {
            for (scope in listOf("\"everything\"", "true")) {
                val port = TextWirePort()
                val repository = NativeTextConversationRepository(port)
                val command = repository.prepare("Olvida ese dato.", TextIntent.Ask, TextContext())
                val source = "8e65fd01-d6b7-4cd4-9000-000000000001"
                val fields =
                    "\"action\":\"forget\",\"sourceId\":\"$source\"," +
                        "\"expectedVersion\":\"${"a".repeat(64)}\",\"memoryIds\":[\"$source-1\"]," +
                        "\"correction\":null,\"forgetScope\":$scope"
                port.reply = { _, _ -> ready(command.ids.route, fields) }
                assertIs<TextOutcome.Failed>(repository.execute(command).outcome)
                assertEquals(1, port.calls.size)
            }
        }

    @Test
    fun allOccurrencesPlanKeepsItsExactScopeOnTheApplicationRequest() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val command = repository.prepare("Olvida ese dato.", TextIntent.Ask, TextContext())
            val source = "8e65fd01-d6b7-4cd4-9000-000000000001"
            port.reply = { _, _ ->
                ready(
                    command.ids.route,
                    """
                    "action":"forget","sourceId":"$source","expectedVersion":"${"a".repeat(64)}",
                    "memoryIds":["$source-1"],"correction":null,"forgetScope":"allOccurrences"
                    """.trimIndent(),
                )
            }
            repository.execute(command)
            assertEquals(MemoryEndpoint.ApplyMessage, port.calls.last().first)
            assertTrue(
                port.calls
                    .last()
                    .second
                    .contains("\"forgetScope\":\"allOccurrences\""),
            )
        }

    @Test
    fun oversizedFollowUpIsRejectedBeforeAnyPaidRouting() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val context = TextContext(0, listOf("a".repeat(1900)))
            val command = repository.prepare("b".repeat(200), TextIntent.Ask, context)
            assertIs<TextOutcome.Failed>(repository.execute(command).outcome)
            assertTrue(port.calls.isEmpty())
        }

    @Test
    fun regressiveEpochCannotExecuteAChildOperation() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val command = repository.prepare("¿Qué recuerdo?", TextIntent.Ask, TextContext(2))
            port.reply = { _, _ -> ready(command.ids.route, "\"action\":\"ask\"", 1) }
            assertIs<TextOutcome.Failed>(repository.execute(command).outcome)
            assertEquals(listOf(MemoryEndpoint.RouteMessage), port.calls.map { it.first })
        }

    @Test
    fun offeredFactIsNeverAppliedUntilAcceptedAndKeepsOnePreparedOperation() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val command = repository.prepare("Me gusta el miso.", TextIntent.Ask, TextContext())
            port.reply =
                { endpoint, body ->
                    if (endpoint ==
                        MemoryEndpoint.RouteMessage
                    ) {
                        ready(command.ids.route, offerFields())
                    } else {
                        declined(body)
                    }
                }
            val prepared = repository.execute(command)
            assertIs<TextOutcome.Offered>(prepared.outcome)
            assertEquals(listOf(MemoryEndpoint.RouteMessage), port.calls.map { it.first })
            val rejected = prepared.command.copy(decision = OfferDecision.Reject)
            assertEquals(TextOutcome.Declined, repository.execute(rejected).outcome)
            assertEquals(TextOutcome.Declined, repository.execute(rejected).outcome)
            assertEquals(port.calls[1].second, port.calls[2].second)
            val payload = Json.parseToJsonElement(port.calls[1].second).jsonObject
            assertEquals(command.ids.action, (payload["requestId"] as JsonPrimitive).content)
            assertEquals("Me gusta el miso.", ((payload["turn"] as JsonObject)["text"] as JsonPrimitive).content)
        }

    @Test
    fun olderQuestionContextIsDroppedBeforeTheChildQueryAndNeverBecomesAFact() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val command = repository.prepare("¿Y hoy?", TextIntent.Ask, TextContext(1, listOf("¿Qué vi ayer?")))
            port.reply =
                { endpoint, _ ->
                    if (endpoint ==
                        MemoryEndpoint.RouteMessage
                    ) {
                        ready(command.ids.route, "\"action\":\"ask\"", 2)
                    } else {
                        """{"apiVersion":1,"operationId":"${command.ids.query}","status":"notFound",
                "text":"No consta.","sources":[]}"""
                    }
                }
            assertIs<TextOutcome.Asked>(repository.execute(command).outcome)
            assertFalse(
                port.calls
                    .last()
                    .second
                    .contains("ayer"),
            )
            assertEquals(listOf(MemoryEndpoint.RouteMessage, MemoryEndpoint.Query), port.calls.map { it.first })
        }

    @Test
    fun inventedOfferAndStringBooleanAreRejectedBeforeAnyApply() =
        runTest {
            for (fields in listOf(
                offerFields("Dato inventado."),
                "\"action\":\"offer\",\"fact\":\"Me gusta el miso.\",\"alsoAsk\":\"true\"",
            )) {
                val port = TextWirePort()
                val repository = NativeTextConversationRepository(port)
                val command = repository.prepare("Me gusta el miso.", TextIntent.Ask, TextContext())
                port.reply = { _, _ -> ready(command.ids.route, fields) }
                assertIs<TextOutcome.Failed>(repository.execute(command).outcome)
                assertEquals(1, port.calls.size)
            }
        }

    @Test
    fun foreignSelectedItemCannotCrossTheNativeBoundaryAsAChange() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val command = repository.prepare("Olvida ese dato.", TextIntent.Ask, TextContext())
            val source = "8e65fd01-d6b7-4cd4-9000-000000000001"
            port.reply = { _, _ ->
                ready(
                    command.ids.route,
                    """"action":"forget","sourceId":"$source","expectedVersion":"${"a".repeat(64)}",
                "memoryIds":["8e65fd01-d6b7-4cd4-9000-000000000002-1"],"correction":null""",
                )
            }
            assertIs<TextOutcome.Failed>(repository.execute(command).outcome)
            assertEquals(1, port.calls.size)
        }

    @Test
    fun wrongOperationOrDeclineForAnAcceptanceCannotClaimAConfirmedWrite() =
        runTest {
            val port = TextWirePort()
            val repository = NativeTextConversationRepository(port)
            val command = repository.prepare("Me gusta el miso.", TextIntent.Ask, TextContext())
            port.reply = { _, _ -> ready(command.ids.route, offerFields()) }
            val prepared = repository.execute(command).command.copy(decision = OfferDecision.Accept)
            port.reply = { _, body -> declined(body) }
            assertEquals(TextOutcome.Processing, repository.execute(prepared).outcome)
            port.reply = { _, _ -> """{"apiVersion":1,"operationId":"${command.ids.query}","status":"declined"}""" }
            assertEquals(
                TextOutcome.Processing,
                repository.execute(prepared.copy(decision = OfferDecision.Reject)).outcome,
            )
        }

    @Test
    fun cancellationDiscardsTheNativeCallbackAndDoesNotPromiseARollback() =
        runTest {
            val port = TextWirePort()
            port.reply = { _, _ -> null }
            val repository = NativeTextConversationRepository(port)
            var returned = false
            val pending =
                launch {
                    repository.execute(repository.prepare("Dato ficticio.", TextIntent.Tell, TextContext()))
                    returned =
                        true
                }
            runCurrent()
            pending.cancel()
            pending.join()
            assertTrue(port.cancelled)
            assertFalse(returned)
        }

    private fun offerFields(fact: String = "Me gusta el miso.") =
        "\"action\":\"offer\",\"fact\":\"$fact\",\"alsoAsk\":false"

    private fun ready(
        id: String,
        fields: String,
        epoch: Int = 0,
    ) = """{"apiVersion":1,"operationId":"$id","status":"ready","plan":{
            "memoryEpoch":$epoch,"receivedAt":"2026-11-14T12:00:00Z","expiresAtMs":1794657900000,$fields}}"""

    private fun declined(body: String): String {
        val input = Json.parseToJsonElement(body).jsonObject
        return buildJsonObject {
            put("apiVersion", 1)
            put("operationId", input.getValue("requestId"))
            put("status", "declined")
        }.toString()
    }
}

private class TextWirePort : NativeMemoryPort {
    private var ids = 0
    val calls = mutableListOf<Pair<MemoryEndpoint, String>>()
    var cancelled = false
    var reply: (MemoryEndpoint, String) -> String? = { _, _ -> null }

    override fun requestId() = "41ff0200-561a-4ab7-8000-${(++ids).toString().padStart(12, '0')}"

    override fun timeZone() = "Europe/Madrid"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        calls.add(endpoint to json)
        reply(endpoint, json)?.let { completion(NativeMemoryReply.Received(it)) }
        return NativeCancellation { cancelled = true }
    }
}
