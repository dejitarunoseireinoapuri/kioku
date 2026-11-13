package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.data.NativeQueryRepository
import io.github.dejitarunoseireinoapuri.kioku.data.queryQuestion
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.test.Test
import kotlin.test.assertEquals

class QueryContextTransportTest {
    @Test
    fun contextEnvelopeSeparatesCurrentQuestionFromPriorUntrustedQuestions() {
        val command = QueryCommand("fixture", "¿Y hoy?", listOf("¿Qué vi ayer?"))
        val value = Json.parseToJsonElement(queryQuestion(command)).jsonObject
        assertEquals("¿Y hoy?", value.getValue("pregunta_actual").jsonPrimitive.content)
        assertEquals(
            listOf("¿Qué vi ayer?"),
            value.getValue("preguntas_anteriores_solo_contexto").jsonArray.map { it.jsonPrimitive.content },
        )
        assertEquals(
            "¿Qué vi ayer?",
            queryQuestion(command.copy(text = "¿Qué vi ayer?", previousQuestions = emptyList())),
        )
    }

    @Test
    fun oversizedContextFailsBeforeAnyNativeRequestWithoutTruncatingTheQuestion() =
        runTest {
            val repository = NativeQueryRepository(UnreachableQueryPort())
            val result = repository.execute(QueryCommand("fixture", "¿Y hoy?", listOf("x".repeat(2000))))
            assertEquals(QueryOutcome.Failed(CaptureIssue.MoreContext), result)
            assertEquals(
                QueryOutcome.Failed(CaptureIssue.MoreContext),
                repository.execute(QueryCommand("fixture", "¿Y hoy?", List(5) { "Pregunta previa" })),
            )
            assertEquals(
                QueryOutcome.Failed(CaptureIssue.Invalid),
                repository.execute(QueryCommand("fixture", " ", listOf("Pregunta previa"))),
            )
        }
}

private class UnreachableQueryPort : NativeMemoryPort {
    override fun requestId() = error("No request ID expected")

    override fun timeZone() = "UTC"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation = error("No network request expected")
}
