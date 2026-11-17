package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.mandatorySystemGestures
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/** Consume the larger system/keyboard/mandatory gesture inset once, then add breathing room. */
@Composable
fun KiokuSafeArea(content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing.union(WindowInsets.mandatorySystemGestures))
            .padding(bottom = KiokuSpacing.Small),
    ) { content() }
}
