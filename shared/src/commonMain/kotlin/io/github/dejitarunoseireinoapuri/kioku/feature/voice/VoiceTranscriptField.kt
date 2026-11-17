package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors

/** Native partials remain presentation only; the editor receives the final text after Stop. */
@Composable
fun VoiceTranscriptField(modifier: Modifier) {
    val text = LocalVoiceInteraction.current.state.transcript
    BasicTextField(
        value = TextFieldValue(text, TextRange(text.length)),
        onValueChange = {},
        modifier = modifier,
        enabled = false,
        maxLines = 4,
        textStyle = MaterialTheme.typography.body1.copy(color = KiokuColors.Text),
    )
}
