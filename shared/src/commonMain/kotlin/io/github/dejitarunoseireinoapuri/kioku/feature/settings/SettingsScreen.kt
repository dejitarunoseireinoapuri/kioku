package io.github.dejitarunoseireinoapuri.kioku.feature.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.IconAction
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.ScreenHeading
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.feature.conversation.PreviewScenario
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.account_label
import io.github.dejitarunoseireinoapuri.kioku.resources.account_pending
import io.github.dejitarunoseireinoapuri.kioku.resources.back
import io.github.dejitarunoseireinoapuri.kioku.resources.example_answer
import io.github.dejitarunoseireinoapuri.kioku.resources.example_clarification
import io.github.dejitarunoseireinoapuri.kioku.resources.example_corrected
import io.github.dejitarunoseireinoapuri.kioku.resources.example_locked
import io.github.dejitarunoseireinoapuri.kioku.resources.example_offer
import io.github.dejitarunoseireinoapuri.kioku.resources.example_offline
import io.github.dejitarunoseireinoapuri.kioku.resources.example_ready
import io.github.dejitarunoseireinoapuri.kioku.resources.example_saved
import io.github.dejitarunoseireinoapuri.kioku.resources.examples_heading
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_back
import io.github.dejitarunoseireinoapuri.kioku.resources.settings
import io.github.dejitarunoseireinoapuri.kioku.resources.settings_description
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onExample: (PreviewScenario) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopBar(stringResource(Res.string.settings), leading = {
            IconAction(Res.drawable.icon_back, stringResource(Res.string.back), onBack)
        })
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(stringResource(Res.string.settings_description), color = KiokuColors.Secondary)
            Panel {
                Text(stringResource(Res.string.account_label))
                Text(stringResource(Res.string.account_pending), color = KiokuColors.Secondary)
            }
            ScreenHeading(stringResource(Res.string.examples_heading))
            PreviewScenario.entries.forEach { scenario ->
                ActionButton(stringResource(scenarioLabel(scenario)), { onExample(scenario) }, Modifier.fillMaxWidth())
            }
        }
    }
}

private fun scenarioLabel(scenario: PreviewScenario): StringResource =
    when (scenario) {
        PreviewScenario.Ready -> Res.string.example_ready
        PreviewScenario.Locked -> Res.string.example_locked
        PreviewScenario.Clarification -> Res.string.example_clarification
        PreviewScenario.Saved -> Res.string.example_saved
        PreviewScenario.Answer -> Res.string.example_answer
        PreviewScenario.Offer -> Res.string.example_offer
        PreviewScenario.Corrected -> Res.string.example_corrected
        PreviewScenario.Offline -> Res.string.example_offline
    }
