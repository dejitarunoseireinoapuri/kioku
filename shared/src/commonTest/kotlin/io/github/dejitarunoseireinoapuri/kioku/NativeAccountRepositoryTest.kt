package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class NativeAccountRepositoryTest {
    @Test
    fun duplicateNativeEventsDoNotRestartTheSessionAndDisposalRemovesTheListener() =
        runTest {
            val port = FixturePort()
            val repository = NativeAccountRepository(port)
            val events = mutableListOf<AccountSession?>()
            val job = backgroundScope.launch { repository.sessions.toList(events) }
            runCurrent()
            port.listener?.invoke(null)
            port.listener?.invoke(null)
            runCurrent()
            val session = AccountSession("synthetic", 1, "Cuenta ficticia")
            port.listener?.invoke(session)
            port.listener?.invoke(session)
            runCurrent()
            port.listener?.invoke(null)
            runCurrent()
            assertEquals(listOf(null, session, null), events)
            job.cancel()
            runCurrent()
            assertTrue(port.listenerClosed)
        }

    @Test
    fun cancellingLoginCancelsTheNativeOperationAndIgnoresItsLateCompletion() =
        runTest {
            val port = FixturePort()
            var completed = false
            val job =
                launch {
                    NativeAccountRepository(port).signIn()
                    completed = true
                }
            runCurrent()
            job.cancel()
            runCurrent()
            port.completion?.invoke(SignInResult.Completed)
            runCurrent()
            assertTrue(port.loginCancelled)
            assertFalse(completed)
        }
}

private class FixturePort : NativeAccountPort {
    var listener: ((AccountSession?) -> Unit)? = null
    var completion: ((SignInResult) -> Unit)? = null
    var listenerClosed = false
    var loginCancelled = false

    override fun observeSession(listener: (AccountSession?) -> Unit): NativeCancellation {
        this.listener = listener
        listener(null)
        return NativeCancellation {
            listenerClosed = true
            this.listener = null
        }
    }

    override fun signIn(completion: (SignInResult) -> Unit): NativeCancellation {
        this.completion = completion
        return NativeCancellation { loginCancelled = true }
    }

    override fun signOut() = Unit

    override fun loadConfiguration(completion: (ConfigurationResult) -> Unit) = NativeCancellation {}
}
