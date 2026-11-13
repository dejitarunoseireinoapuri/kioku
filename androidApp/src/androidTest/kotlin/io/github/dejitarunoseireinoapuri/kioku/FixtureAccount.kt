package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import kotlinx.coroutines.flow.MutableStateFlow

internal class FixtureAccount(
    authorized: Boolean = true,
) : AccountRepository {
    override val sessions = MutableStateFlow(if (authorized) session() else null)
    var configuration: ConfigurationResult = ConfigurationResult.Loaded(AiConfiguration.Ready)
    var configurationLoad: suspend () -> ConfigurationResult = { configuration }
    private var generation = 1L

    override suspend fun signIn(): SignInResult {
        generation++
        sessions.value = session().copy(generation = generation)
        return SignInResult.Completed
    }

    override suspend fun signOut() {
        sessions.value = null
    }

    override suspend fun loadConfiguration() = configurationLoad()

    private fun session() = AccountSession("synthetic-ui", 1, "Cuenta ficticia")
}
