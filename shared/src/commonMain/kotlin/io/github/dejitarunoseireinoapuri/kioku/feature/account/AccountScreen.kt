package io.github.dejitarunoseireinoapuri.kioku.feature.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuMark
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuWordmark
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.account_denied
import io.github.dejitarunoseireinoapuri.kioku.resources.account_setup
import io.github.dejitarunoseireinoapuri.kioku.resources.account_unavailable
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
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    LaunchedEffect(Unit) {
        focus.clearFocus(force = true)
        keyboard?.hide()
    }
    when (state) {
        AccountState.Loading -> {
            AccountLoadingScreen()
        }

        is AccountState.SignedOut -> {
            if (state.busy) AccountLoadingScreen() else LoginScreen(state.issue, onSignIn)
        }

        is AccountState.Blocked -> {
            BlockedAccountScreen(state.issue, onRetry, onSignOut)
        }

        is AccountState.Authorized -> {}
    }
}

@Composable
private fun BlockedAccountScreen(
    issue: AccountIssue,
    onRetry: () -> Unit,
    onSignOut: () -> Unit,
) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        KiokuMark(Modifier.size(64.dp))
        KiokuWordmark()
        AccountIssueText(issue)
        ActionButton(stringResource(Res.string.retry), onRetry)
        ActionButton(stringResource(Res.string.sign_out), onSignOut)
    }
}

@Composable
internal fun AccountIssueText(issue: AccountIssue) {
    val resource =
        when (issue) {
            AccountIssue.Cancelled -> return
            AccountIssue.Denied -> Res.string.account_denied
            AccountIssue.Unavailable -> Res.string.account_unavailable
            AccountIssue.SetupRequired -> Res.string.account_setup
        }
    Text(stringResource(resource), color = KiokuColors.Secondary)
}
