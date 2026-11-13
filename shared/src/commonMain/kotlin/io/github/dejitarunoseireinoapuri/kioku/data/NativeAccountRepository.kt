package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
import kotlin.coroutines.resume

private const val CONFIGURATION_TIMEOUT_MS = 20_000L

class NativeAccountRepository(
    private val port: NativeAccountPort,
) : AccountRepository {
    override val sessions: Flow<AccountSession?> =
        callbackFlow {
            val observation = port.observeSession { trySend(it) }
            awaitClose { observation.cancel() }
        }.distinctUntilChanged()

    override suspend fun signIn(): SignInResult =
        suspendCancellableCoroutine { continuation ->
            val request = port.signIn { if (continuation.isActive) continuation.resume(it) }
            continuation.invokeOnCancellation { request.cancel() }
        }

    override suspend fun signOut() = port.signOut()

    override suspend fun loadConfiguration(): ConfigurationResult =
        withTimeout(CONFIGURATION_TIMEOUT_MS) {
            suspendCancellableCoroutine { continuation ->
                val request = port.loadConfiguration { if (continuation.isActive) continuation.resume(it) }
                continuation.invokeOnCancellation { request.cancel() }
            }
        }
}
