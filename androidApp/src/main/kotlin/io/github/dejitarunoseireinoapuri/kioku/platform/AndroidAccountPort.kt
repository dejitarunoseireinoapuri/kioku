package io.github.dejitarunoseireinoapuri.kioku.platform

import androidx.activity.ComponentActivity
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.BuildConfig
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCancellation
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.util.UUID

internal class AndroidAccountPort(
    private val activity: ComponentActivity,
    auth: FirebaseAuth,
    private val functions: FirebaseFunctions,
) : NativeAccountPort {
    private val session = AndroidSession(activity.applicationContext, auth)
    private val credentials = CredentialManager.create(activity)

    override fun observeSession(listener: (AccountSession?) -> Unit) = session.observe(listener)

    override fun signIn(completion: (SignInResult) -> Unit): NativeCancellation {
        val epoch =
            session.begin() ?: run {
                completion(SignInResult.Failed(AccountIssue.Unavailable))
                return NativeCancellation {}
            }
        val job =
            activity.lifecycleScope.launch {
                try {
                    val option =
                        GetSignInWithGoogleOption
                            .Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                            .setNonce(UUID.randomUUID().toString())
                            .build()
                    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
                    val result = credentials.getCredential(activity, request).credential
                    if (result !is CustomCredential ||
                        result.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                    ) {
                        completion(SignInResult.Failed(AccountIssue.Unavailable))
                    } else {
                        val token = GoogleIdTokenCredential.createFrom(result.data).idToken
                        session.exchange(epoch, GoogleAuthProvider.getCredential(token, null), completion)
                    }
                } catch (error: CancellationException) {
                    session.cancel(epoch)
                    throw error
                } catch (_: GetCredentialCancellationException) {
                    completion(SignInResult.Failed(AccountIssue.Cancelled))
                } catch (_: NoCredentialException) {
                    completion(SignInResult.Failed(AccountIssue.Unavailable))
                } catch (_: GetCredentialException) {
                    completion(SignInResult.Failed(AccountIssue.Unavailable))
                } catch (_: GoogleIdTokenParsingException) {
                    completion(SignInResult.Failed(AccountIssue.Unavailable))
                }
            }
        return NativeCancellation {
            job.cancel()
            session.cancel(epoch)
        }
    }

    override fun signOut() {
        session.signOut()
        activity.lifecycleScope.launch {
            try {
                credentials.clearCredentialState(ClearCredentialStateRequest())
            } catch (error: CancellationException) {
                throw error
            } catch (_: androidx.credentials.exceptions.ClearCredentialException) {
                // Local Firebase access is already closed; no remote error is displayed or logged.
            }
        }
    }

    override fun loadConfiguration(completion: (ConfigurationResult) -> Unit) =
        AndroidConfiguration(functions).load(completion)
}
