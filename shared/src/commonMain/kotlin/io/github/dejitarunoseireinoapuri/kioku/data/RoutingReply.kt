package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.OfferDecision
import io.github.dejitarunoseireinoapuri.kioku.domain.PlanStamp
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextPlan
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray

/** Validated routing results, kept separate from the native provider transport. */
internal sealed interface RoutingReply {
    data class Ready(
        val plan: TextPlan,
    ) : RoutingReply

    data class Clarification(
        val question: String,
    ) : RoutingReply

    data object Processing : RoutingReply

    data object RepeatRequired : RoutingReply
}

internal fun routingPayload(command: TextCommand): JsonObject =
    buildJsonObject {
        put("apiVersion", 2)
        put("requestId", command.ids.route)
        put("mode", if (command.intent == TextIntent.Ask) "ask" else "tell")
        put("text", command.text)
        put("zone", command.zone)
        put("memoryEpoch", command.context.revision)
        put(
            "context",
            buildJsonObject {
                putJsonArray("questions") { command.context.questions.forEach { add(it) } }
                putJsonArray("sourceIds") { command.context.sourceIds.forEach { add(it) } }
            },
        )
    }

internal fun decisionPayload(command: TextCommand): String =
    buildJsonObject {
        put("apiVersion", 2)
        put("requestId", command.ids.action)
        put("turn", routingPayload(command))
        put("plan", planPayload(requireNotNull(command.plan)))
        if (command.plan is TextPlan.Change) put("continueManagement", true)
        put(
            "decision",
            when (command.decision) {
                OfferDecision.Accept -> "accept"
                OfferDecision.Reject -> "reject"
                null -> "apply"
            },
        )
    }.toString()

private fun planPayload(plan: TextPlan): JsonObject =
    buildJsonObject {
        put("memoryEpoch", plan.stamp.revision)
        put("receivedAt", plan.stamp.receivedAt)
        put("expiresAtMs", plan.stamp.expiresAt)
        put(
            "action",
            when (plan) {
                is TextPlan.Ask -> "ask"
                is TextPlan.Tell -> "tell"
                is TextPlan.Offer -> "offer"
                is TextPlan.Change -> if (plan.action == ChangeAction.Correct) "correct" else "forget"
            },
        )
        when (plan) {
            is TextPlan.Offer -> {
                put("fact", plan.fact)
                put("alsoAsk", plan.alsoAsk)
            }

            is TextPlan.Change -> {
                put("sourceId", plan.sourceId)
                put("expectedVersion", plan.version)
                putJsonArray("memoryIds") { plan.memoryIds.forEach { add(it) } }
                put("correction", plan.correction?.let(::JsonPrimitive) ?: JsonNull)
                plan.forgetScope?.let {
                    put("forgetScope", it.wireName())
                }
            }

            else -> {}
        }
    }

internal fun parseRouting(
    json: String,
    command: TextCommand,
): RoutingReply {
    require(json.length <= MAX_ROUTING_REPLY)
    val value = Json.parseToJsonElement(json).jsonObject
    require(value.number("apiVersion") == 2L && value.text("operationId") == command.ids.route)
    val fields = setOf("apiVersion", "operationId", "status")
    return when (value.text("status")) {
        "ready" -> {
            require(value.keys == fields + "plan")
            RoutingReply.Ready(parsePlan(value.getValue("plan").jsonObject, command))
        }

        "needsClarification" -> {
            require(value.keys == fields + "text")
            RoutingReply.Clarification(value.text("text").also { require(it.length in 1..MAX_ROUTE_QUESTION) })
        }

        "processing" -> {
            require(value.keys == fields)
            RoutingReply.Processing
        }

        "repeatRequired" -> {
            require(value.keys == fields)
            RoutingReply.RepeatRequired
        }

        else -> {
            error("Invalid routing response")
        }
    }
}

private fun parsePlan(
    value: JsonObject,
    command: TextCommand,
): TextPlan {
    val stamp = PlanStamp(value.number("memoryEpoch"), value.text("receivedAt"), value.number("expiresAtMs"))
    require(stamp.receivedAt.matches(ROUTE_DATE) && stamp.revision >= command.context.revision)
    val fields = setOf("memoryEpoch", "receivedAt", "expiresAtMs", "action")
    return when (value.text("action")) {
        "ask" -> {
            require(value.keys == fields && command.intent == TextIntent.Ask)
            TextPlan.Ask(stamp)
        }

        "tell" -> {
            require(value.keys == fields && command.intent == TextIntent.Tell)
            TextPlan.Tell(stamp)
        }

        "offer" -> {
            require(value.keys == fields + setOf("fact", "alsoAsk") && command.intent == TextIntent.Ask)
            val fact = value.text("fact")
            require(fact.length in 1..MAX_ROUTE_CORRECTION && command.text.contains(fact))
            val alsoAsk = value["alsoAsk"] as? JsonPrimitive
            require(alsoAsk != null && !alsoAsk.isString)
            TextPlan.Offer(stamp, fact, requireNotNull(alsoAsk.booleanOrNull))
        }

        "correct", "forget" -> {
            parseChange(value, stamp, fields)
        }

        else -> {
            error("Invalid routing plan")
        }
    }
}

private fun parseChange(
    value: JsonObject,
    stamp: PlanStamp,
    fields: Set<String>,
): TextPlan.Change {
    val base = fields + setOf("sourceId", "expectedVersion", "memoryIds", "correction")
    require(value.keys == base || value.keys == base + "forgetScope")
    val id = value.text("sourceId")
    val version = value.text("expectedVersion")
    require(id.matches(ROUTE_UUID) && version.matches(Regex("[a-f0-9]{64}")))
    val ids =
        value.getValue("memoryIds").jsonArray.map {
            require(it is JsonPrimitive && it.isString)
            it.content.also { candidate -> require(candidate.matches(ROUTE_UUID)) }
        }
    require(ids.size in 1..MAX_ROUTE_ITEMS && ids.distinct().size == ids.size)
    val correction =
        value["correction"].takeUnless { it == JsonNull }?.let {
            require(it is JsonPrimitive && it.isString && it.content.length in 1..MAX_ROUTE_CORRECTION)
            it.content
        }
    val action = if (value.text("action") == "correct") ChangeAction.Correct else ChangeAction.Forget
    require(if (action == ChangeAction.Correct) ids.size == 1 && correction != null else correction == null)
    val scope = parseForgetScope(value, action)
    return TextPlan.Change(stamp, id, version, ids, action, correction, scope)
}

private fun ForgetScope.wireName() = if (this == ForgetScope.AllOccurrences) "allOccurrences" else "source"

private fun parseForgetScope(
    value: JsonObject,
    action: ChangeAction,
): ForgetScope? =
    value["forgetScope"]?.let {
        require(action == ChangeAction.Forget && it is JsonPrimitive && it.isString)
        when (it.content) {
            "source" -> ForgetScope.Source
            "allOccurrences" -> ForgetScope.AllOccurrences
            else -> error("Invalid forget scope")
        }
    }

private fun JsonObject.text(key: String): String {
    val value = get(key) as? JsonPrimitive
    require(value?.isString == true)
    return value.content
}

private fun JsonObject.number(key: String): Long {
    val value = get(key) as? JsonPrimitive
    require(value != null && !value.isString)
    val number = requireNotNull(value.doubleOrNull)
    require(number.isFinite() && number in 0.0..MAX_ROUTING_INTEGER && number % 1.0 == 0.0)
    return number.toLong()
}

private val ROUTE_UUID = Regex("[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}")
private val ROUTE_DATE = Regex("\\d{4}-\\d{2}-\\d{2}T.+Z")
private const val MAX_ROUTING_REPLY = 20000
private const val MAX_ROUTING_INTEGER = 9007199254740991.0
private const val MAX_ROUTE_CORRECTION = 2000
private const val MAX_ROUTE_QUESTION = 500
private const val MAX_ROUTE_ITEMS = 8
