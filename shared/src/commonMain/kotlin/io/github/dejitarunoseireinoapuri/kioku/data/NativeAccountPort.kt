package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult

/** Native SDK callbacks complete at most once and never expose tokens to presentation. */
interface NativeAccountPort {
    fun observeSession(listener: (AccountSession?) -> Unit): NativeCancellation

    fun signIn(completion: (SignInResult) -> Unit): NativeCancellation

    fun signOut()

    fun loadConfiguration(completion: (ConfigurationResult) -> Unit): NativeCancellation
}

fun interface NativeCancellation {
    fun cancel()
}
