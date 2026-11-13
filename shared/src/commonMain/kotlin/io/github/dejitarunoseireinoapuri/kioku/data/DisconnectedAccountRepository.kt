package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import kotlinx.coroutines.flow.flowOf

/** Missing native configuration never falls back to a demo identity or another project. */
class DisconnectedAccountRepository : AccountRepository {
    override val sessions = flowOf<AccountSession?>(null)

    override suspend fun signIn() = SignInResult.Failed(AccountIssue.SetupRequired)

    override suspend fun signOut() = Unit

    override suspend fun loadConfiguration() = ConfigurationResult.Failed(AccountIssue.SetupRequired)
}
