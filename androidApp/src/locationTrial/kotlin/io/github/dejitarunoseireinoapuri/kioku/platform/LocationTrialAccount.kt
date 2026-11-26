package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import org.json.JSONObject

internal class LocationTrialAccount(
    context: Context,
    auth: FirebaseAuth,
    functions: FirebaseFunctions,
) : NativeAccountPort {
    private val session = AndroidSession(context, auth)
    private val configuration = AndroidConfiguration(functions)

    override fun observeSession(listener: (AccountSession?) -> Unit) = session.observe(listener)

    override fun signIn(completion: (SignInResult) -> Unit): NativeCancellation {
        val epoch =
            session.begin() ?: run {
                completion(SignInResult.Failed(AccountIssue.Unavailable))
                return NativeCancellation {}
            }
        // The Auth emulator accepts a synthetic provider payload. This source set has no production configuration.
        val fixture =
            JSONObject()
                .put(
                    "sub",
                    "kioku-location-trial",
                ).put("email", "owner@example.test")
                .put("email_verified", true)
        session.exchange(epoch, GoogleAuthProvider.getCredential(fixture.toString(), null), completion)
        return NativeCancellation { session.cancel(epoch) }
    }

    override fun signOut() = session.signOut()

    override fun loadConfiguration(completion: (ConfigurationResult) -> Unit) = configuration.load(completion)
}
