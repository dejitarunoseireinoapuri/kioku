package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.isDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import io.github.dejitarunoseireinoapuri.kioku.domain.AiConfiguration
import io.github.dejitarunoseireinoapuri.kioku.domain.ConfigurationResult
import kotlinx.coroutines.CompletableDeferred
import org.junit.After
import org.junit.Rule
import org.junit.Test

class EntryLoadingTest {
    @get:Rule val compose = createAndroidComposeRule<LifecycleTestActivity>()
    private val account = FixtureAccount()
    private val controls = QueryManagementFixture()

    @After fun close() {
        compose.runOnUiThread { LifecycleTestActivity.content = null }
    }

    @Test fun entryWaitsForAccountThenMemoryWithoutShowingTheConversationBetweenStages() {
        val configuration = CompletableDeferred<ConfigurationResult>()
        val revision = CompletableDeferred<Long?>()
        account.configurationLoad = { configuration.await() }
        controls.revisionRead = { revision.await() }
        open()
        compose.onNodeWithTag("account-loading").assertIsDisplayed()
        compose.onNodeWithText("Entrando...").assertIsDisplayed()
        assertNoConversation()
        configuration.complete(ConfigurationResult.Loaded(AiConfiguration.Ready))
        compose.waitUntil(5000) { compose.onNodeWithTag("memory-loading").isDisplayed() }
        compose.onNodeWithTag("account-loading").assertDoesNotExist()
        compose.onNodeWithText("Comprobando cambios en tu memoria...").assertIsDisplayed()
        assertNoConversation()
        captureBrandScreen(compose.activity, "kioku-entry-memory-loading.png") { compose.onRoot().captureToImage() }
        revision.complete(0L)
        compose.waitUntil(5000) { compose.onNodeWithTag("text-composer").isDisplayed() }
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.onNodeWithTag("memory-loading").assertDoesNotExist()
        compose.onNodeWithContentDescription("Ajustes").assertIsDisplayed()
    }

    @Test fun failedInitialMemoryCheckEndsLoadingInsteadOfLeavingTheAppStuck() {
        val revision = CompletableDeferred<Long?>()
        controls.revisionRead = { revision.await() }
        open()
        compose.waitUntil(5000) { compose.onNodeWithTag("memory-loading").isDisplayed() }
        assertNoConversation()
        revision.complete(null)
        compose.waitUntil(5000) { compose.onNodeWithTag("text-composer").isDisplayed() }
        compose.onNodeWithTag("memory-loading").assertDoesNotExist()
        compose.onNodeWithTag("text-composer").assertIsEnabled()
        compose.onNodeWithContentDescription("Ajustes").assertIsEnabled()
    }

    private fun open() {
        compose.runOnUiThread {
            LifecycleTestActivity.content = { KiokuApp(account, controlRepository = controls) }
        }
        compose.activityRule.scenario.recreate()
    }

    private fun assertNoConversation() {
        compose.onNodeWithTag("text-composer").assertDoesNotExist()
        compose.onNodeWithTag("conversation-messages").assertDoesNotExist()
        compose.onNodeWithContentDescription("Ajustes").assertDoesNotExist()
    }
}
