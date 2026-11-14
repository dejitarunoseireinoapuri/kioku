package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ProvideTextStyle
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import kotlinx.coroutines.launch

@Composable
fun ContentLoadingNotice(
    status: String,
    modifier: Modifier = Modifier,
) {
    val requester = remember { BringIntoViewRequester() }
    val scope = rememberCoroutineScope()
    var revealed by remember(status) { mutableStateOf(false) }
    Surface(
        modifier =
            modifier
                .fillMaxWidth()
                .testTag("content-loading")
                .bringIntoViewRequester(requester)
                .onGloballyPositioned {
                    if (revealed) return@onGloballyPositioned
                    revealed = true
                    scope.launch { requester.bringIntoView() }
                }.semantics(mergeDescendants = true) {
                    liveRegion = LiveRegionMode.Polite
                    progressBarRangeInfo = ProgressBarRangeInfo.Indeterminate
                },
        color = KiokuColors.Raised,
        shape = MaterialTheme.shapes.small,
        border = BorderStroke(KiokuSpacing.Stroke, KiokuColors.Rule),
    ) {
        Row(
            Modifier.padding(KiokuSpacing.Medium),
            horizontalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            LoadingMark(Modifier.size(KiokuSpacing.InlineLoadingMark))
            ProvideTextStyle(MaterialTheme.typography.body2) {
                LoadingStatusText(status, Modifier.weight(1f), textAlign = TextAlign.Start)
            }
        }
    }
}
