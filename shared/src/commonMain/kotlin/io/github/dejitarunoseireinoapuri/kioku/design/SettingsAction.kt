package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
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
    val feedback = rememberButtonFeedback(KiokuColors.Text)
    val label = stringResource(Res.string.settings)
    TextButton(
        onClick = onClick,
        modifier =
            Modifier
                .sizeIn(minWidth = KiokuSpacing.TouchTarget, minHeight = KiokuSpacing.TouchTarget)
                .semantics { contentDescription = label },
        shape = MaterialTheme.shapes.small,
        colors =
            ButtonDefaults.textButtonColors(
                contentColor = feedback.contentColor,
            ),
        contentPadding = PaddingValues(horizontal = 8.dp),
        interactionSource = feedback.interactionSource,
    ) {
        Text(
            stringResource(Res.string.settings_action),
            modifier = Modifier.clearAndSetSemantics {},
            style = MaterialTheme.typography.body2.copy(fontSize = 13.sp),
        )
    }
}
