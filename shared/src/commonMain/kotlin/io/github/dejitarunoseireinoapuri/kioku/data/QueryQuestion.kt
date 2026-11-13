package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.QueryCommand
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray

/** Previous user questions resolve references; generated answers are never transported as evidence. */
internal fun queryQuestion(command: QueryCommand): String {
    if (command.previousQuestions.isEmpty()) return command.text
    return buildJsonObject {
        put("pregunta_actual", command.text)
        putJsonArray("preguntas_anteriores_solo_contexto") {
            command.previousQuestions.forEach { add(it) }
        }
    }.toString()
}
