package io.github.dejitarunoseireinoapuri.kioku.feature.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class AccountViewModel(
    private val repository: AccountRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow<AccountState>(AccountState.Loading)
    val state = mutableState.asStateFlow()
    private var epoch = 0L
    private var action: Job? = null
    private var observation: Job? = null
    private var refreshJob: Job? = null

    init {
        observe()
    }

    fun signIn() {
        if (action?.isActive == true) return
        val current = ++epoch
        mutableState.value = AccountState.SignedOut(busy = true)
        action =
            viewModelScope.launch {
                when (val result = repository.signIn()) {
                    SignInResult.Completed -> {
                    }

                    is SignInResult.Failed -> {
                        if (current == epoch) mutableState.value = AccountState.SignedOut(result.issue)
                    }
                }
            }
    }

    fun signOut() {
        epoch++
        action?.cancel()
        refreshJob?.cancel()
        mutableState.value = AccountState.SignedOut()
        viewModelScope.launch { repository.signOut() }
    }

    fun retry() = observe()

    fun refresh() {
        val previous = state.value as? AccountState.Authorized ?: return
        if (refreshJob?.isActive == true) return
        val current = epoch
        mutableState.value = previous.copy(refreshing = true)
        refreshJob =
            viewModelScope.launch {
                val result = configuration()
                currentCoroutineContext().ensureActive()
                if (epoch == current) {
                    mutableState.value =
                        when (result) {
                            is ConfigurationResult.Loaded -> previous.copy(ai = result.ai)
                            is ConfigurationResult.Failed -> AccountState.Blocked(result.issue)
                        }
                }
            }
    }

    private fun observe() {
        observation?.cancel()
        observation =
            viewModelScope.launch {
                repository.sessions.collectLatest { session -> resolve(session) }
            }
    }

    private suspend fun resolve(session: AccountSession?) {
        refreshJob?.cancel()
        val current = ++epoch
        if (session == null) {
            mutableState.value = AccountState.SignedOut()
            return
        }
        mutableState.value = AccountState.Loading
        val result = configuration()
        currentCoroutineContext().ensureActive()
        if (epoch != current) return
        mutableState.value =
            when (result) {
                is ConfigurationResult.Loaded -> AccountState.Authorized(session, result.ai)
                is ConfigurationResult.Failed -> AccountState.Blocked(result.issue)
            }
    }

    private suspend fun configuration(): ConfigurationResult =
        try {
            repository.loadConfiguration()
        } catch (_: TimeoutCancellationException) {
            ConfigurationResult.Failed(AccountIssue.Unavailable)
        }
}
