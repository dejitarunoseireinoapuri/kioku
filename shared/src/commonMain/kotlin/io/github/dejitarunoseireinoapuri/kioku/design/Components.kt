package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Divider
import androidx.compose.material.Icon
import androidx.compose.material.IconButton
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedButton
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource

@Composable
fun ActionButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    enabled: Boolean = true,
) {
    if (primary) {
        AccentButton(label, onClick, modifier, enabled)
        return
    }
    val feedback = rememberButtonFeedback(KiokuColors.Secondary)
    MatrixReadingSurface { scrim ->
        OutlinedButton(
            enabled = enabled,
            onClick = onClick,
            modifier = modifier.sizeIn(minHeight = KiokuSpacing.TouchTarget),
            border = BorderStroke(1.dp, KiokuColors.Rule),
            colors =
                ButtonDefaults.outlinedButtonColors(
                    backgroundColor = scrim,
                    contentColor = feedback.contentColor,
                ),
            interactionSource = feedback.interactionSource,
        ) { Text(label) }
    }
}

@Composable
fun IconAction(
    icon: DrawableResource,
    description: String,
    onClick: () -> Unit,
) {
    MatrixReadingSurface { scrim ->
        val feedback = rememberButtonFeedback(KiokuColors.Secondary)
        IconButton(
            onClick = onClick,
            modifier = Modifier.background(scrim).sizeIn(KiokuSpacing.TouchTarget, KiokuSpacing.TouchTarget),
            interactionSource = feedback.interactionSource,
        ) {
            Icon(painterResource(icon), description, tint = feedback.contentColor)
        }
    }
}

@Composable
fun Panel(
    modifier: Modifier = Modifier,
    emphasized: Boolean = false,
    content: @Composable ColumnScope.() -> Unit,
) {
    MatrixReadingSurface { scrim ->
        Surface(
            modifier = modifier.fillMaxWidth(),
            color = scrim,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(KiokuSpacing.Stroke, if (emphasized) KiokuColors.Accent else KiokuColors.Rule),
            elevation = 0.dp,
        ) {
            Column(Modifier.padding(KiokuSpacing.Medium), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                content()
            }
        }
    }
}

@Composable
fun ScreenHeading(
    title: String,
    style: TextStyle = MaterialTheme.typography.h5,
) {
    MatrixReadingSurface { scrim ->
        Text(title, style = style, modifier = Modifier.background(scrim).semantics { heading() })
    }
}

@Composable
fun TopBar(
    title: String,
    leading: @Composable () -> Unit = { KiokuMark(Modifier.size(24.dp)) },
    trailing: @Composable () -> Unit = {},
    titleStyle: TextStyle =
        MaterialTheme.typography.body1.copy(
            fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
        ),
) {
    MatrixReadingSurface { scrim ->
        Column(Modifier.background(scrim)) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = KiokuSpacing.Medium),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            ) {
                leading()
                Column(Modifier.weight(1f)) { ScreenHeading(title, titleStyle) }
                trailing()
            }
            Divider(color = KiokuColors.Rule)
        }
    }
}
