package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.isEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import io.github.dejitarunoseireinoapuri.kioku.data.MemoryEndpoint
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryReply
import io.github.dejitarunoseireinoapuri.kioku.data.NativeTextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureIssue
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class QueryConnectionRecoveryTest {
    @get:Rule
    val compose = createAndroidComposeRule<LifecycleTestActivity>()

    @After
    fun clearHost() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test
    fun aLostRoutingResponseRecoversFromTheConnectionMessageWithoutRetyping() {
        val port = ReconnectFixture(MemoryEndpoint.RouteMessage)
        open(port)
        send()
        visible(
            "No se ha podido conectar con Kioku. Comprueba tu conexión y pulsa «Reintentar». " +
                "Tu mensaje sigue disponible en esta sesión.",
        )
        retryAndCheckAnswer()
        assertEquals(3, port.routes.size)
        assertEquals(port.routes[0], port.routes[1])
        assertNotEquals(port.routes[1], port.routes[2])
        assertEquals(1, port.queries.size)
    }

    @Test
    fun aLostAnswerRecoversWithTheSameQuestionAndNoExtraRouting() {
        val port = ReconnectFixture(MemoryEndpoint.Query)
        open(port)
        send()
        visible("La respuesta ha tardado demasiado. Puedes reintentar sin volver a escribir el mensaje.")
        retryAndCheckAnswer()
        assertEquals(1, port.routes.size)
        assertEquals(3, port.queries.size)
        assertEquals(port.queries[0], port.queries[1])
        assertNotEquals(port.queries[1], port.queries[2])
    }

    private fun open(port: ReconnectFixture) {
        compose.runOnUiThread {
            LifecycleTestActivity.content = {
                KiokuApp(
                    FixtureAccount(),
                    conversationRepository = NativeTextConversationRepository(port),
                    controlRepository = QueryManagementFixture(),
                )
            }
        }
        compose.activityRule.scenario.recreate()
        compose.waitUntil(5000) {
            compose.activity.hasWindowFocus() &&
                compose.onAllNodes(hasTestTag("intent-Ask") and isEnabled()).fetchSemanticsNodes().isNotEmpty()
        }
        compose.onNodeWithTag("intent-Ask").performClick()
    }

    private fun send() {
        compose.onNodeWithTag("text-composer").performTextInput("¿Qué plan ficticio tengo?")
        compose.onNodeWithTag("text-composer").performImeAction()
    }

    private fun retryAndCheckAnswer() {
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.onNodeWithText("Reintentar").performScrollTo().performClick()
        visible("No consta otro plan ficticio.")
        compose.onNodeWithText("¿Qué plan ficticio tengo?").performScrollTo().assertIsDisplayed()
    }

    private fun visible(text: String) {
        compose.waitUntil(5000) { compose.onNodeWithText(text).isDisplayed() }
    }
}

internal class ReconnectFixture(
    private val lostStage: MemoryEndpoint,
) : NativeMemoryPort {
    private var ids = 0
    val routes = mutableListOf<String>()
    val queries = mutableListOf<String>()

    override fun requestId() = "00000000-0000-4000-8000-${(++ids).toString().padStart(12, '0')}"

    override fun timeZone() = "UTC"

    override fun call(
        endpoint: MemoryEndpoint,
        json: String,
        completion: (NativeMemoryReply) -> Unit,
    ): NativeCancellation {
        val body = JSONObject(json)
        val id = body.getString("requestId")
        val calls =
            when (endpoint) {
                MemoryEndpoint.RouteMessage -> routes
                MemoryEndpoint.Query -> queries
                else -> error("Unexpected synthetic endpoint")
            }
        calls.add(id)
        checkQuestion(endpoint, body)
        val result =
            when {
                endpoint == lostStage && calls.size == 1 -> {
                    NativeMemoryReply.Failed(
                        if (lostStage == MemoryEndpoint.Query) CaptureIssue.TimedOut else CaptureIssue.Connection,
                    )
                }

                endpoint == lostStage && calls.size == 2 -> {
                    NativeMemoryReply.Received(
                        """{"apiVersion":2,"operationId":"$id","status":"repeatRequired"${
                            if (endpoint == MemoryEndpoint.Query) ",\"text\":\"\",\"sources\":[]" else ""
                        }}""",
                    )
                }

                endpoint == MemoryEndpoint.RouteMessage -> {
                    NativeMemoryReply.Received(
                        """{"apiVersion":2,"operationId":"$id","status":"ready","plan":{"action":"ask",
                    "memoryEpoch":0,"receivedAt":"2026-11-17T12:00:00Z","expiresAtMs":4000000000000}}""",
                    )
                }

                else -> {
                    NativeMemoryReply.Received(
                        """{"apiVersion":2,"operationId":"$id","status":"notFound",
                    "text":"No consta otro plan ficticio.","sources":[]}""",
                    )
                }
            }
        completion(result)
        return NativeCancellation {}
    }

    private fun checkQuestion(
        endpoint: MemoryEndpoint,
        body: JSONObject,
    ) {
        if (endpoint == MemoryEndpoint.RouteMessage) {
            assertEquals("¿Qué plan ficticio tengo?", body.getString("text"))
        } else {
            assertTrue(body.getString("text").contains("¿Qué plan ficticio tengo?"))
        }
    }
}
