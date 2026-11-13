package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import kotlinx.coroutines.CompletableDeferred
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class AccountNavigationTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()
    private val account = FixtureAccount(authorized = false)

    @Before
    fun openAccount() {
        compose.setContent { KiokuApp(account) }
    }

    @Test
    fun deniedIdentityCannotOpenAConversation() {
        account.configuration = ConfigurationResult.Failed(AccountIssue.Denied)
        compose.onNodeWithText("Continuar con Google").performClick()
        compose
            .onNodeWithText("Esta cuenta no tiene acceso a Kioku. Puedes cerrar sesión y elegir otra.")
            .assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
    }

    @Test
    fun logoutRemovesDraftAndNavigationFromPreviousSession() {
        compose.onNodeWithText("Continuar con Google").performClick()
        compose.onNodeWithTag("text-composer").performTextInput("Borrador privado ficticio")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose
            .onNodeWithText("Cerrar sesión")
            .performScrollTo()
            .assertIsDisplayed()
            .performClick()
        compose
            .onNodeWithText("Continuar con Google")
            .performScrollTo()
            .assertIsDisplayed()
            .performClick()
        compose.onNodeWithText("Borrador privado ficticio").assertDoesNotExist()
        compose.onNodeWithTag("text-composer").assertIsDisplayed()
    }

    @Test
    fun configurationCanRefreshWithoutLosingTheDraft() {
        account.configuration = ConfigurationResult.Loaded(AiConfiguration.NotConfigured)
        compose.onNodeWithText("Continuar con Google").performClick()
        compose.onNodeWithTag("text-composer").performTextInput("Texto todavía no enviado")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("IA sin configurar").assertIsDisplayed()
        account.configuration = ConfigurationResult.Loaded(AiConfiguration.Ready)
        compose.onNodeWithText("Actualizar estado").performClick()
        compose.onNodeWithText("IA configurada").assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithText("Texto todavía no enviado").assertIsDisplayed()
    }

    @Test
    fun refreshKeepsAccountReadableUntilItCompletesAndPreservesTheDraft() {
        compose.onNodeWithText("Continuar con Google").performClick()
        compose.onNodeWithTag("text-composer").performTextInput("Borrador de prueba")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        val result = CompletableDeferred<ConfigurationResult>()
        var calls = 0
        account.configurationLoad = {
            calls++
            result.await()
        }
        compose.onNodeWithText("Actualizar estado").performClick()
        compose.waitUntil(5000) { compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.onNodeWithText("Actualizando estado...").assertIsDisplayed()
        captureBrandScreen(compose.activity, "kioku-content-loading.png") { compose.onRoot().captureToImage() }
        compose.onNodeWithText("Actualizando...").assertIsNotEnabled()
        compose.onNodeWithText("Cerrar sesión").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        result.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
        compose.waitUntil(5000) { !compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.onNodeWithText("IA configurada").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("content-loading").assertDoesNotExist()
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithTag("text-composer").assertTextContains("Borrador de prueba")
        assertEquals(1, calls)
    }

    @Test
    fun logoutDuringConfigurationLoadingCannotRestoreTheOldAccount() {
        compose.onNodeWithText("Continuar con Google").performClick()
        compose.onNodeWithContentDescription("Ajustes").performClick()
        val result = CompletableDeferred<ConfigurationResult>()
        account.configurationLoad = { result.await() }
        compose.onNodeWithText("Actualizar estado").performClick()
        compose.waitUntil(5000) { compose.onNodeWithTag("content-loading").isDisplayed() }
        compose.onNodeWithText("Cerrar sesión").performScrollTo().performClick()
        compose.onNodeWithText("Continuar con Google").assertIsDisplayed()
        result.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
        compose.waitForIdle()
        compose.onNodeWithText("Continuar con Google").assertIsDisplayed()
        compose.onNodeWithTag("content-loading").assertDoesNotExist()
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
    }
}
