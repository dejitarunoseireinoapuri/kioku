package io.github.dejitarunoseireinoapuri.kioku

import androidx.lifecycle.ViewModelStore
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountViewModel
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.withContext
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

@OptIn(ExperimentalCoroutinesApi::class)
class AccountViewModelTest {
    @Test
    fun restoredIdentityWaitsForServerAuthorization() =
        accountTest { repository, model ->
            val pending = CompletableDeferred<ConfigurationResult>()
            repository.configuration = { pending.await() }
            repository.sessions.value = session("first")
            runCurrent()
            assertIs<AccountState.Loading>(model.state.value)
            pending.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
            runCurrent()
            assertEquals("first", assertIs<AccountState.Authorized>(model.state.value).session.id)
            assertEquals(0, repository.signInCalls)
        }

    @Test
    fun deniedAccountNeverOpensConversation() =
        accountTest { repository, model ->
            repository.configuration = { ConfigurationResult.Failed(AccountIssue.Denied) }
            repository.sessions.value = session("other")
            runCurrent()
            assertEquals(AccountState.Blocked(AccountIssue.Denied), model.state.value)
        }

    @Test
    fun logoutDiscardsEvenAnUncooperativeLateResponse() =
        accountTest { repository, model ->
            val pending = CompletableDeferred<ConfigurationResult>()
            repository.configuration = { withContext(NonCancellable) { pending.await() } }
            repository.sessions.value = session("first")
            runCurrent()
            model.signOut()
            runCurrent()
            pending.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
            runCurrent()
            assertIs<AccountState.SignedOut>(model.state.value)
            assertEquals(1, repository.signOutCalls)
        }

    @Test
    fun accountChangeDoesNotPublishThePreviousAccountsResult() =
        accountTest { repository, model ->
            val pending = CompletableDeferred<ConfigurationResult>()
            repository.configuration = { withContext(NonCancellable) { pending.await() } }
            repository.sessions.value = session("first")
            runCurrent()
            repository.sessions.value = session("second")
            runCurrent()
            repository.configuration = { ConfigurationResult.Loaded(AiConfiguration.NotConfigured) }
            pending.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
            runCurrent()
            val state = assertIs<AccountState.Authorized>(model.state.value)
            assertEquals("second", state.session.id)
            assertEquals(AiConfiguration.NotConfigured, state.ai)
        }

    @Test
    fun cancelledSignInDoesNotCreateASession() =
        accountTest { repository, model ->
            repository.signInResult = SignInResult.Failed(AccountIssue.Cancelled)
            model.signIn()
            model.signIn()
            runCurrent()
            assertEquals(AccountState.SignedOut(AccountIssue.Cancelled), model.state.value)
            assertEquals(1, repository.signInCalls)
            assertEquals(null, repository.sessions.value)
        }

    @Test
    fun retryRechecksTheServerInsteadOfAssumingPreviousPermission() =
        accountTest { repository, model ->
            repository.configuration = { ConfigurationResult.Failed(AccountIssue.Unavailable) }
            repository.sessions.value = session("first")
            runCurrent()
            assertIs<AccountState.Blocked>(model.state.value)
            repository.configuration = { ConfigurationResult.Loaded(AiConfiguration.Ready) }
            model.retry()
            runCurrent()
            assertIs<AccountState.Authorized>(model.state.value)
        }

    private fun session(id: String) = AccountSession(id, 1, "Cuenta ficticia")

    private fun accountTest(block: suspend TestScope.(FakeAccount, AccountViewModel) -> Unit) =
        runTest {
            Dispatchers.setMain(StandardTestDispatcher(testScheduler))
            val store = ViewModelStore()
            val repository = FakeAccount()
            val model = AccountViewModel(repository)
            store.put("account", model)
            try {
                runCurrent()
                block(repository, model)
            } finally {
                store.clear()
                Dispatchers.resetMain()
            }
        }
}

private class FakeAccount : AccountRepository {
    override val sessions = MutableStateFlow<AccountSession?>(null)
    var configuration: suspend () -> ConfigurationResult = { ConfigurationResult.Loaded(AiConfiguration.Ready) }
    var signInResult: SignInResult = SignInResult.Completed
    var signInCalls = 0
    var signOutCalls = 0

    override suspend fun signIn(): SignInResult {
        signInCalls++
        return signInResult
    }

    override suspend fun signOut() {
        signOutCalls++
        sessions.value = null
    }

    override suspend fun loadConfiguration() = configuration()
}
