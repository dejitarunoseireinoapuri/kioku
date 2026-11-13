package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

/** Reserves space for progress without covering or disposing the current screen. */
@Composable
fun ContentLoadingLayout(
    status: StringResource?,
    content: @Composable () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        Box(Modifier.weight(1f).fillMaxWidth()) { content() }
        if (status != null) {
            ContentLoadingNotice(
                stringResource(status),
                Modifier.padding(horizontal = KiokuSpacing.Medium, vertical = KiokuSpacing.Small),
            )
        }
    }
}
