package io.github.dejitarunoseireinoapuri.kioku.feature.settings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Divider
import androidx.compose.material.Icon
import androidx.compose.material.MaterialTheme
import androidx.compose.material.OutlinedButton
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.rememberButtonFeedback
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.account_provider
import io.github.dejitarunoseireinoapuri.kioku.resources.account_section
import io.github.dejitarunoseireinoapuri.kioku.resources.ai_missing
import io.github.dejitarunoseireinoapuri.kioku.resources.ai_ready
import io.github.dejitarunoseireinoapuri.kioku.resources.ai_section
import io.github.dejitarunoseireinoapuri.kioku.resources.check_ai
import io.github.dejitarunoseireinoapuri.kioku.resources.configuration_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_refresh
import io.github.dejitarunoseireinoapuri.kioku.resources.key_setup_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.refreshing_configuration
import io.github.dejitarunoseireinoapuri.kioku.resources.sign_out
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun AccountSettings(
    account: AccountState.Authorized,
    onRefresh: () -> Unit,
    onSignOut: () -> Unit,
) {
    val feedback = rememberButtonFeedback(KiokuColors.Secondary)
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large)) {
        AccountIdentity(account.session.label)
        Divider(color = KiokuColors.Rule)
        AiSettings(account, onRefresh)
        TextButton(
            onClick = onSignOut,
            modifier = Modifier.fillMaxWidth().sizeIn(minHeight = KiokuSpacing.TouchTarget),
            shape = MaterialTheme.shapes.small,
            colors = ButtonDefaults.textButtonColors(contentColor = feedback.contentColor),
            interactionSource = feedback.interactionSource,
        ) {
            Text(stringResource(Res.string.sign_out))
        }
    }
}

@Composable
private fun AccountIdentity(label: String) {
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
        SettingsCaption(stringResource(Res.string.account_section))
        Text(label, fontWeight = FontWeight.Bold)
        Text(
            stringResource(Res.string.account_provider),
            style = MaterialTheme.typography.body2,
            color = KiokuColors.Secondary,
        )
    }
}

@Composable
private fun AiSettings(
    account: AccountState.Authorized,
    onRefresh: () -> Unit,
) {
    val ready = account.ai == AiConfiguration.Ready
    Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium)) {
        SettingsCaption(stringResource(Res.string.ai_section))
        Text(stringResource(if (ready) Res.string.ai_ready else Res.string.ai_missing), fontWeight = FontWeight.Bold)
        if (!ready) {
            Text(stringResource(Res.string.key_setup_hint), color = KiokuColors.Secondary)
        }
        RefreshConfiguration(account.refreshing, onRefresh)
        if (account.refreshing) ContentLoadingNotice(stringResource(Res.string.configuration_loading))
    }
}

@Composable
private fun RefreshConfiguration(
    refreshing: Boolean,
    onRefresh: () -> Unit,
) {
    val feedback = rememberButtonFeedback(KiokuColors.Text)
    OutlinedButton(
        onClick = onRefresh,
        enabled = !refreshing,
        modifier = Modifier.fillMaxWidth().sizeIn(minHeight = KiokuSpacing.TouchTarget),
        shape = MaterialTheme.shapes.small,
        border = BorderStroke(1.dp, KiokuColors.Rule),
        colors =
            ButtonDefaults.outlinedButtonColors(
                backgroundColor = KiokuColors.Raised,
                contentColor = feedback.contentColor,
            ),
        interactionSource = feedback.interactionSource,
    ) {
        Icon(painterResource(Res.drawable.icon_refresh), null, Modifier.size(18.dp))
        Text(
            stringResource(if (refreshing) Res.string.refreshing_configuration else Res.string.check_ai),
            modifier = Modifier.weight(1f).padding(start = KiokuSpacing.Small),
            style = MaterialTheme.typography.button.copy(fontSize = 14.sp),
        )
    }
}

@Composable
private fun SettingsCaption(text: String) {
    Text(
        text,
        color = KiokuColors.Secondary,
        style = MaterialTheme.typography.body2.copy(fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp),
    )
}
