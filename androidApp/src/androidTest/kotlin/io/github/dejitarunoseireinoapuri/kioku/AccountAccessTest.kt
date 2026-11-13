package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import io.github.dejitarunoseireinoapuri.kioku.domain.SignInResult
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.MutableStateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class AccountAccessTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun cancelledGoogleReturnsToLoginWithoutAnotherSubmission() {
        val account = ControlledAccount()
        compose.setContent { KiokuApp(account) }
        compose.onNodeWithText("Continuar con Google").performClick()
        compose.onNodeWithTag("account-loading").assertIsDisplayed()
        captureAccess("kioku-access-loading.png")
        compose.onNodeWithText("Continuar con Google").assertDoesNotExist()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        account.signInResult.complete(SignInResult.Failed(AccountIssue.Cancelled))
        compose.onNodeWithText("Continuar con Google").assertIsDisplayed()
        compose.onNodeWithTag("account-loading").assertDoesNotExist()
        captureAccess("kioku-access-login.png")
        assertEquals(1, account.signInCalls)
    }

    @Test
    fun initialScreenWaitsForConfigurationAfterGoogleCompletes() {
        val account = ControlledAccount()
        compose.setContent { KiokuApp(account) }
        compose.onNodeWithText("Continuar con Google").performClick()
        account.signInResult.complete(SignInResult.Completed)
        compose.onNodeWithTag("account-loading").assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        account.configuration.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
        compose.onNodeWithTag("text-composer").assertIsDisplayed()
        compose.onNodeWithTag("account-loading").assertDoesNotExist()
    }

    @Test
    fun googleFailureEndsLoadingAndAllowsRecovery() {
        val account = ControlledAccount()
        compose.setContent { KiokuApp(account) }
        compose.onNodeWithText("Continuar con Google").performClick()
        account.signInResult.complete(SignInResult.Failed(AccountIssue.Unavailable))
        compose.onNodeWithText("Continuar con Google").assertIsDisplayed()
        compose.onNodeWithTag("account-loading").assertDoesNotExist()
        compose.onNodeWithText("No se ha podido comprobar el acceso.", substring = true).assertIsDisplayed()
    }

    @Test
    fun smallWindowAndLargeTextKeepGoogleReachable() {
        var clicked = false
        compose.setContent {
            val density = LocalDensity.current.density
            CompositionLocalProvider(LocalDensity provides Density(density, fontScale = 2f)) {
                KiokuTheme {
                    Box(Modifier.width(320.dp).height(480.dp)) {
                        AccountScreen(AccountState.SignedOut(), { clicked = true }, {}, {})
                    }
                }
            }
        }
        compose
            .onNodeWithText("Continuar con Google")
            .performScrollTo()
            .assertIsDisplayed()
            .performClick()
        compose.runOnIdle { assertTrue(clicked) }
    }

    private fun captureAccess(name: String) {
        captureBrandScreen(compose.activity, name) { compose.onRoot().captureToImage() }
    }
}

private class ControlledAccount : AccountRepository {
    override val sessions = MutableStateFlow<AccountSession?>(null)
    val signInResult = CompletableDeferred<SignInResult>()
    val configuration = CompletableDeferred<ConfigurationResult>()
    var signInCalls = 0
        private set

    override suspend fun signIn(): SignInResult {
        signInCalls++
        val result = signInResult.await()
        if (result == SignInResult.Completed) sessions.value = AccountSession("synthetic-access", 1, "Cuenta ficticia")
        return result
    }

    override suspend fun signOut() {
        sessions.value = null
    }

    override suspend fun loadConfiguration() = configuration.await()
}
