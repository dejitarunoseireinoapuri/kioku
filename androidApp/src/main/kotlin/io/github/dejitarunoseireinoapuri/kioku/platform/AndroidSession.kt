package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.Context
import androidx.core.content.edit
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult

/** Main-thread native session gate; a late Firebase task cannot reopen a cancelled session. */
internal class AndroidSession(
    context: Context,
    private val auth: FirebaseAuth,
) {
    private val preferences = context.getSharedPreferences("kioku_account_gate", Context.MODE_PRIVATE)
    private val listeners = mutableSetOf<(AccountSession?) -> Unit>()
    private var generation = 0L
    private var pending = false

    fun observe(listener: (AccountSession?) -> Unit): NativeCancellation {
        listeners.add(listener)
        val native = FirebaseAuth.AuthStateListener { listener(current()) }
        auth.addAuthStateListener(native)
        return NativeCancellation {
            listeners.remove(listener)
            auth.removeAuthStateListener(native)
        }
    }

    fun begin(): Long? {
        if (pending) return null
        generation++
        accepted(false)
        return generation
    }

    fun exchange(
        epoch: Long,
        credential: AuthCredential,
        completion: (SignInResult) -> Unit,
    ) {
        if (epoch != generation) return
        pending = true
        auth.signInWithCredential(credential).addOnCompleteListener { task ->
            pending = false
            if (epoch != generation) {
                auth.signOut()
            } else if (task.isSuccessful) {
                accepted(true)
                completion(SignInResult.Completed)
            } else {
                accepted(false)
                auth.signOut()
                completion(SignInResult.Failed(AccountIssue.Unavailable))
            }
        }
    }

    fun cancel(epoch: Long) {
        if (epoch == generation) signOut()
    }

    fun signOut() {
        generation++
        accepted(false)
        auth.signOut()
    }

    private fun current(): AccountSession? {
        val user = auth.currentUser?.takeIf { preferences.getBoolean("accepted", false) }
        return user?.let { AccountSession(it.uid, generation, it.email.orEmpty()) }
    }

    private fun accepted(value: Boolean) {
        preferences.edit { putBoolean("accepted", value) }
        listeners.toList().forEach { it(current()) }
    }
}
