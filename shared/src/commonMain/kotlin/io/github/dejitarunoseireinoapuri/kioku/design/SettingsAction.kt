package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.size
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_settings
import io.github.dejitarunoseireinoapuri.kioku.resources.settings
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun SettingsAction(onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.size(KiokuSpacing.TouchTarget),
        shape = MaterialTheme.shapes.small,
        border = BorderStroke(1.dp, KiokuColors.Rule),
        colors = ButtonDefaults.outlinedButtonColors(backgroundColor = KiokuColors.Surface),
        contentPadding = PaddingValues(12.dp),
    ) {
        Icon(painterResource(Res.drawable.icon_settings), stringResource(Res.string.settings), tint = KiokuColors.Text)
    }
}
