package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.settings
import io.github.dejitarunoseireinoapuri.kioku.resources.settings_action
import org.jetbrains.compose.resources.stringResource

@Composable
fun SettingsAction(onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val pressed by interaction.collectIsPressedAsState()
    val label = stringResource(Res.string.settings)
    TextButton(
        onClick = onClick,
        modifier =
            Modifier
                .sizeIn(minWidth = KiokuSpacing.TouchTarget, minHeight = KiokuSpacing.TouchTarget)
                .border(1.dp, if (focused) KiokuColors.Coral else Color.Transparent, MaterialTheme.shapes.small)
                .semantics { contentDescription = label },
        shape = MaterialTheme.shapes.small,
        colors =
            ButtonDefaults.textButtonColors(
                backgroundColor = if (focused) KiokuColors.Raised else Color.Transparent,
                contentColor = if (pressed) KiokuColors.Coral else KiokuColors.Text,
            ),
        contentPadding = PaddingValues(horizontal = 8.dp),
        interactionSource = interaction,
    ) {
        Text(
            stringResource(Res.string.settings_action),
            modifier = Modifier.clearAndSetSemantics {},
            style = MaterialTheme.typography.body2.copy(fontSize = 13.sp),
        )
    }
}
