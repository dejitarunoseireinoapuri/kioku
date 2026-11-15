package io.github.dejitarunoseireinoapuri.kioku

import androidx.activity.ComponentActivity
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Density
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryItem
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.SourceKind
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlEvent
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.source.SourceControlState
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class MemoryManagementLayoutTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun largeTextShowsTheMemoryDirectlyAndKeepsItsTwoActionsReachable() {
        val events = mutableListOf<SourceControlEvent>()
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, 2f)) {
                ManagementFixture(SourceControlState.Ready(source()), events::add)
            }
        }
        compose.onNodeWithText("Gestionar un recuerdo").assertIsDisplayed()
        compose.onNodeWithText("Me apetece ver Loto el martes.").assertIsDisplayed()
        compose.onNodeWithText("Leer el relato").assertDoesNotExist()
        compose.onNodeWithText("Olvidar este relato").assertDoesNotExist()
        compose.onNodeWithText("Corregir").performScrollTo().performClick()
        assertEquals(listOf(SourceControlEvent.Edit("fixture-item")), events)
        compose.onNodeWithText("Olvidar").performScrollTo().performClick()
        assertEquals(SourceControlEvent.Forget("fixture-item"), events.last())
        captureBrandScreen(compose.activity, "kioku-manage-large-text.png") { compose.onRoot().captureToImage() }
    }

    @Test
    fun aRetainedStoryDisplaysItsCurrentMemoryWithoutExposingTheSourceText() {
        compose.setContent {
            ManagementFixture(
                SourceControlState.Ready(
                    source().copy(
                        source =
                            source().source.copy(
                                kind = SourceKind.Retained,
                                originalText = "Resto de relato ficticio distinto.",
                            ),
                    ),
                ),
            )
        }

        compose.onNodeWithText("Me apetece ver Loto el martes.").assertIsDisplayed()
        compose.onNodeWithText("Resto de relato ficticio distinto.").assertDoesNotExist()
        compose.onNodeWithText("Leer el relato").assertDoesNotExist()
        compose.onNodeWithText("Cerrar el relato").assertDoesNotExist()
        compose.onNodeWithText("Olvidar este relato").assertDoesNotExist()
    }

    private fun source() =
        EditableSource(
            MemorySource("fixture-source", "Me apetece ver Loto el martes.", "2026-11-14"),
            "fixture-version",
            listOf(MemoryItem("fixture-item", "Me apetece ver Loto el martes.")),
            0,
        )
}

@Composable
private fun ManagementFixture(
    state: SourceControlState,
    onEvent: (SourceControlEvent) -> Unit = {},
) {
    KiokuTheme {
        Surface(color = KiokuColors.Background, contentColor = KiokuColors.Text) {
            SourceControlScreen(state, onEvent, {})
        }
    }
}
