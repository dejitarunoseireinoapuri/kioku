package io.github.dejitarunoseireinoapuri.kioku.feature.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material.Switch
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.falling_letters
import io.github.dejitarunoseireinoapuri.kioku.resources.falling_letters_hint
import org.jetbrains.compose.resources.stringResource

data class AppearanceSettingsState(
    val fallingLetters: Boolean = true,
    val onChange: (Boolean) -> Unit = {},
)

val LocalAppearanceSettings = staticCompositionLocalOf { AppearanceSettingsState() }

@Composable
internal fun AppearanceSettings() {
    val state = LocalAppearanceSettings.current
    Row(
        Modifier
            .fillMaxWidth()
            .testTag("falling-letters-setting")
            .toggleable(state.fallingLetters, role = Role.Switch, onValueChange = state.onChange),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium),
    ) {
        Column(Modifier.weight(1f)) {
            Text(stringResource(Res.string.falling_letters))
            Text(stringResource(Res.string.falling_letters_hint))
        }
        Switch(checked = state.fallingLetters, onCheckedChange = null)
    }
}
