package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.dp

/** A readable transcript over the rain; the prefix and rule are decoration, not message content. */
@Composable
fun TranscriptMessage(
    modifier: Modifier = Modifier,
    owner: Boolean = false,
    content: @Composable ColumnScope.() -> Unit,
) {
    Row(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Small),
    ) {
        if (owner) {
            Text(
                ">",
                modifier = Modifier.clearAndSetSemantics {},
                color = KiokuColors.Secondary,
                style = MaterialTheme.typography.body1,
            )
        }
        Column(
            Modifier
                .weight(1f)
                .drawBehind {
                    if (!owner) drawLine(KiokuColors.Accent, Offset.Zero, Offset(0f, size.height), 2.dp.toPx())
                }.padding(start = if (owner) 0.dp else KiokuSpacing.Medium, top = 4.dp, bottom = 4.dp),
            verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small),
            content = content,
        )
    }
}
