package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.clearAndSetSemantics
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

/** Keeps content composed, including its navigation and session scopes, underneath the loading screen. */
@Composable
fun ContentLoadingLayer(
    status: StringResource?,
    content: @Composable () -> Unit,
) {
    Box(Modifier.fillMaxSize()) {
        val unavailable =
            if (status == null) {
                Modifier
            } else {
                Modifier
                    .clearAndSetSemantics {}
                    .focusProperties { canFocus = false }
            }
        Box(Modifier.fillMaxSize().then(unavailable)) { content() }
        if (status != null) {
            val focus = LocalFocusManager.current
            val keyboard = LocalSoftwareKeyboardController.current
            val requester = remember { FocusRequester() }
            Surface(
                modifier =
                    Modifier
                        .matchParentSize()
                        .onPreviewKeyEvent { true }
                        .focusRequester(requester)
                        .focusable()
                        .pointerInput(Unit) {
                            awaitPointerEventScope {
                                while (true) awaitPointerEvent().changes.forEach { it.consume() }
                            }
                        },
                color = KiokuColors.Background,
                contentColor = KiokuColors.Text,
            ) {
                ContentLoadingScreen(stringResource(status))
            }
            LaunchedEffect(status) {
                focus.clearFocus(force = true)
                keyboard?.hide()
                requester.requestFocus()
            }
        }
    }
}
