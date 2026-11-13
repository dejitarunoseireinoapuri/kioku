package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
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
        compose.onNodeWithText("Cerrar sesión").performClick()
        compose.onNodeWithText("Continuar con Google").assertIsDisplayed().performClick()
        compose.onNodeWithText("Borrador privado ficticio").assertDoesNotExist()
        compose.onNodeWithTag("text-composer").assertIsDisplayed()
    }

    @Test
    fun configurationCanRefreshWithoutLosingTheDraft() {
        account.configuration = ConfigurationResult.Loaded(AiConfiguration.NotConfigured)
        compose.onNodeWithText("Continuar con Google").performClick()
        compose.onNodeWithTag("text-composer").performTextInput("Texto todavía no enviado")
        compose.onNodeWithContentDescription("Ajustes").performClick()
        compose.onNodeWithText("IA pendiente de configurar en el servidor").assertIsDisplayed()
        account.configuration = ConfigurationResult.Loaded(AiConfiguration.Ready)
        compose.onNodeWithText("Comprobar configuración").performClick()
        compose.onNodeWithText("IA configurada en el servidor").assertIsDisplayed()
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithText("Texto todavía no enviado").assertIsDisplayed()
    }
}
