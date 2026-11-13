package io.github.dejitarunoseireinoapuri.kioku.feature.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.ScreenHeading
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.account_denied
import io.github.dejitarunoseireinoapuri.kioku.resources.account_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.account_setup
import io.github.dejitarunoseireinoapuri.kioku.resources.account_unavailable
import io.github.dejitarunoseireinoapuri.kioku.resources.app_name
import io.github.dejitarunoseireinoapuri.kioku.resources.login_description
import io.github.dejitarunoseireinoapuri.kioku.resources.login_title
import io.github.dejitarunoseireinoapuri.kioku.resources.retry
import io.github.dejitarunoseireinoapuri.kioku.resources.sign_out
import org.jetbrains.compose.resources.stringResource

@Composable
fun AccountScreen(
    state: AccountState,
    onSignIn: () -> Unit,
    onRetry: () -> Unit,
    onSignOut: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopBar(stringResource(Res.string.app_name))
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            ScreenHeading(stringResource(Res.string.login_title))
            Text(stringResource(Res.string.login_description), color = KiokuColors.Secondary)
            when (state) {
                AccountState.Loading -> {
                    Text(stringResource(Res.string.account_loading))
                }

                is AccountState.SignedOut -> {
                    GoogleButton(!state.busy, onSignIn)
                    if (state.busy) Text(stringResource(Res.string.account_loading))
                    state.issue?.let { AccountIssueText(it) }
                }

                is AccountState.Blocked -> {
                    AccountIssueText(state.issue)
                    ActionButton(stringResource(Res.string.retry), onRetry)
                    ActionButton(stringResource(Res.string.sign_out), onSignOut)
                }

                is AccountState.Authorized -> {
                }
            }
        }
    }
}

@Composable
private fun AccountIssueText(issue: AccountIssue) {
    val resource =
        when (issue) {
            AccountIssue.Cancelled -> return
            AccountIssue.Denied -> Res.string.account_denied
            AccountIssue.Unavailable -> Res.string.account_unavailable
            AccountIssue.SetupRequired -> Res.string.account_setup
        }
    Text(stringResource(resource), color = KiokuColors.Secondary)
}
