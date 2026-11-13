package io.github.dejitarunoseireinoapuri.kioku.domain

import kotlinx.coroutines.flow.Flow

data class AccountSession(
    val id: String,
    val generation: Long,
    val label: String,
)

enum class AiConfiguration { Ready, NotConfigured }

enum class AccountIssue { Cancelled, Denied, Unavailable, SetupRequired }

sealed interface SignInResult {
    data object Completed : SignInResult

    data class Failed(
        val issue: AccountIssue,
    ) : SignInResult
}

sealed interface ConfigurationResult {
    data class Loaded(
        val ai: AiConfiguration,
    ) : ConfigurationResult

    data class Failed(
        val issue: AccountIssue,
    ) : ConfigurationResult
}

interface AccountRepository {
    val sessions: Flow<AccountSession?>

    suspend fun signIn(): SignInResult

    suspend fun signOut()

    suspend fun loadConfiguration(): ConfigurationResult
}
