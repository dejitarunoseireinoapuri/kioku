package io.github.dejitarunoseireinoapuri.kioku.feature.account

import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration

sealed interface AccountState {
    data object Loading : AccountState

    data class SignedOut(
        val issue: AccountIssue? = null,
        val busy: Boolean = false,
    ) : AccountState

    data class Authorized(
        val session: AccountSession,
        val ai: AiConfiguration,
        val refreshing: Boolean = false,
    ) : AccountState

    data class Blocked(
        val issue: AccountIssue,
    ) : AccountState
}
