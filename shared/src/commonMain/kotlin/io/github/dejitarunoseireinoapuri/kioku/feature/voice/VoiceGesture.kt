package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp

internal fun Modifier.voiceGesture(
    available: () -> Boolean,
    interaction: () -> VoiceInteraction,
    originY: () -> Float,
): Modifier =
    pointerInput(Unit) {
        awaitEachGesture {
            val down = awaitFirstDown()
            val originalY = down.position.y + originY()
            if (!available()) return@awaitEachGesture
            val wasLocked = interaction().state.locked
            if (!wasLocked) interaction().act(VoiceAction.Press)
            var locked = wasLocked
            var released = false
            try {
                do {
                    val event = awaitPointerEvent()
                    val change = event.changes.firstOrNull { it.id == down.id } ?: break
                    if (!locked && change.position.y + originY() - originalY <= -48.dp.toPx()) {
                        interaction().act(VoiceAction.Lock)
                        locked = true
                    }
                    change.consume()
                    released = !change.pressed
                } while (!released)
                if (released) interaction().act(if (wasLocked) VoiceAction.Finish else VoiceAction.Release)
            } finally {
                if (!released && !locked) interaction().act(VoiceAction.Cancel)
            }
        }
    }
