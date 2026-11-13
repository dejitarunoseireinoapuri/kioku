package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.parseQuery
import io.github.dejitarunoseireinoapuri.kioku.data.parseQuerySource
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import kotlin.test.Test
import kotlin.test.assertFails
import kotlin.test.assertIs

class QueryWireTest {
    private val id = "00000000-0000-4000-8000-000000000001"

    @Test
    fun validAnswerRequiresBoundedDistinctReferencesAndTheMatchingOperation() {
        assertIs<QueryOutcome.Reply>(parseQuery(payload(), id))
        assertFails { parseQuery(payload().replace("1.0", "1.5"), id) }
        assertFails { parseQuery(payload(), "different") }
        assertIs<QueryOutcome.Reply>(parseQuery(payload().replace("answered", "needsClarification"), id))
        assertFails { parseQuery(payload().replace("answered", "unknown"), id) }
        assertFails { parseQuery(payload().replace(reference(), ""), id) }
        assertFails { parseQuery(payload().replace(reference(), "${reference()},${reference()}"), id) }
    }

    @Test
    fun sourceCannotReturnAnotherReferenceOrExtraProviderFields() {
        val source = """{"apiVersion":1,"sourceId":"$id","text":"Fuente ficticia",
            "receivedAt":"2026-11-13T12:00:00Z"}"""
        parseQuerySource(source, id)
        assertFails { parseQuerySource(source, "foreign") }
        assertFails {
            parseQuerySource(
                source.replace("\"apiVersion\":1", "\"apiVersion\":1,\"rawProvider\":\"private\""),
                id,
            )
        }
    }

    private fun payload() =
        """{"apiVersion":1.0,"operationId":"$id","status":"answered","text":"Respuesta ficticia","sources":[${reference()}]}"""

    private fun reference() = """{"sourceId":"$id","receivedAt":"2026-11-13T12:00:00Z"}"""
}
