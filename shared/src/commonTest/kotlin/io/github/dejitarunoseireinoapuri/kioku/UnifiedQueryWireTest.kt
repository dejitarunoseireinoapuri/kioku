package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.parseQuery
import io.github.dejitarunoseireinoapuri.kioku.domain.QueryOutcome
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFails
import kotlin.test.assertIs
import kotlin.test.assertTrue

class UnifiedQueryWireTest {
    private val id = "00000000-0000-4000-8000-000000000001"
    private val citation = """{"sourceId":"$id","revision":"$id","title":"Manual ficticio",
        "location":"page","number":1,"text":"Lira usa cuaderno violeta."}"""

    @Test fun documentOnlyAnswerKeepsCitationOutOfPersonalManagementReferences() {
        val result = assertIs<QueryOutcome.Reply>(parseQuery(payload(citation), id))
        assertTrue(result.sources.isEmpty())
        assertEquals(1, result.citations.size)
        assertEquals("page", result.citations.single().location)
        assertEquals(id, result.citations.single().sourceId)
    }

    @Test fun forgedDuplicateOrInvalidCitationsFailClosed() {
        assertFails { parseQuery(payload("$citation,$citation"), id) }
        assertFails { parseQuery(payload(citation.replace("\"number\":1", "\"number\":0")), id) }
        assertFails { parseQuery(payload(citation.replace(id, "foreign")), id) }
        assertFails { parseQuery(payload(citation).replace("answered", "processing"), id) }
        assertFails { parseQuery(payload(citation).replace("answered", "notFound"), id) }
        assertFails { parseQuery(payload(""), id) }
    }

    private fun payload(cites: String) =
        """{"apiVersion":2,"operationId":"$id","status":"answered","text":"Según Manual ficticio...",
            "sources":[],"citations":[$cites]}"""
}
