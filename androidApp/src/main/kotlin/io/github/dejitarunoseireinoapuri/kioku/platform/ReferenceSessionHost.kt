package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.ContentResolver
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Retains an incoming grant across rotation; reads it only after the normal account gate succeeds. */
internal class ReferenceSessionHost(
    private val repositories: AndroidRepositories,
    private val resolver: ContentResolver,
) : ViewModel(),
    ViewModelStoreOwner {
    override val viewModelStore = ViewModelStore()
    private val factory = viewModelFactory { initializer { AccountViewModel(repositories.account) } }
    val account = ViewModelProvider(this, factory)[AccountViewModel::class.java]
    private val mutableHost = MutableStateFlow<AndroidReferenceHost?>(null)
    val host = mutableHost.asStateFlow()
    private val mutableDelivery = MutableStateFlow(0L)
    val delivery = mutableDelivery.asStateFlow()
    private var identity: Pair<String, Long>? = null
    private var pending: Intent? = null

    init {
        viewModelScope.launch {
            account.state.collect { state ->
                val authorized = state as? AccountState.Authorized
                val next = authorized?.session?.let { it.id to it.generation }
                if (identity != next) {
                    mutableHost.value?.close()
                    mutableHost.value = null
                    identity = next
                    if (next != null) {
                        repositories.references?.let { mutableHost.value = AndroidReferenceHost(resolver, it()) }
                    }
                }
                mutableHost.value?.let { current ->
                    pending?.let { incoming ->
                        pending = null
                        current.receive(incoming)
                    }
                }
            }
        }
    }

    fun receive(intent: Intent) {
        mutableDelivery.value++
        val current = host.value
        if (current == null) pending = intent else current.receive(intent)
    }

    override fun onCleared() {
        pending = null
        mutableHost.value?.close()
        viewModelStore.clear()
    }
}
