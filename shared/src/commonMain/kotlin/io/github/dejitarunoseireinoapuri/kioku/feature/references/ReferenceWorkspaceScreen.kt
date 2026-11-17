package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSafeArea
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.design.MatrixBackdrop
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.ScreenHeading
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_all
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_empty
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_example
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_forgetting
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_importing
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_partial
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_pick
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_pilot_notice
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_pilot_title
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_reading
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_receiving
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_refresh
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_retry
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_searching
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_stop_waiting
import org.jetbrains.compose.resources.stringResource

@Composable
fun ReferenceWorkspaceApp(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    KiokuTheme {
        Surface(color = KiokuColors.Background, contentColor = KiokuColors.Text) {
            MatrixBackdrop { KiokuSafeArea { WorkspaceContent(state, actions) } }
        }
    }
}

@Composable
private fun WorkspaceContent(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    val scroll = rememberScrollState()
    LaunchedEffect(state.selected?.id) { scroll.scrollTo(0) }
    Column(
        Modifier.fillMaxSize().verticalScroll(scroll).padding(KiokuSpacing.Medium),
        verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium),
    ) {
        ScreenHeading(stringResource(Res.string.reference_pilot_title))
        Panel { Text(stringResource(Res.string.reference_pilot_notice), color = KiokuColors.Secondary) }
        WorkspaceProgress(state, actions)
        if (state.selected == null) WorkspaceImportResults(state, actions)
        if (state.selected == null) WorkspaceLibrary(state, actions) else WorkspaceSelection(state, actions)
        WorkspaceQuery(state, actions)
    }
    state.forgetTarget?.let { WorkspaceForgetDialog(it, actions) }
}

@Composable
private fun WorkspaceProgress(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    state.work?.let { work ->
        val label =
            when (work) {
                ReferenceWork.Loading -> Res.string.reference_loading
                ReferenceWork.Receiving -> Res.string.reference_receiving
                ReferenceWork.Importing -> Res.string.reference_importing
                ReferenceWork.Reading -> Res.string.reference_reading
                ReferenceWork.Searching -> Res.string.reference_searching
                ReferenceWork.Forgetting -> Res.string.reference_forgetting
            }
        Panel {
            Text(stringResource(label), Modifier.testTag("reference-work"))
            ActionButton(stringResource(Res.string.reference_stop_waiting), actions::interrupt)
        }
    }
    state.issue?.let { issue ->
        Panel {
            Text(stringResource(referenceIssueText(issue)))
            ActionButton(stringResource(Res.string.reference_refresh), actions::refresh)
            if (state.items.isNotEmpty()) ActionButton(stringResource(Res.string.reference_retry), actions::retry)
        }
    }
}

@Composable
private fun WorkspaceLibrary(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    val enabled = state.work == null
    ActionButton(stringResource(Res.string.reference_pick), actions::pick, enabled = enabled)
    ActionButton(stringResource(Res.string.reference_example), actions::example, enabled = enabled)
    ActionButton(stringResource(Res.string.reference_refresh), actions::refresh, enabled = enabled)
    WorkspaceWeb(state, actions)
    if (state.sources.isEmpty() && enabled) Text(stringResource(Res.string.reference_empty))
    state.sources.forEach { source ->
        Panel {
            ActionButton(source.title, {
                actions.select(source)
            }, Modifier.testTag("reference-source-${source.id}"), enabled = enabled)
            if (source.partial) Text(stringResource(Res.string.reference_partial))
        }
    }
}

@Composable
private fun WorkspaceSelection(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    val source = requireNotNull(state.selected)
    ActionButton(stringResource(Res.string.reference_all), { actions.select(null) })
    WorkspaceSource(source, state.work == null, actions)
    state.detail.forEach { WorkspaceCitation(it) }
}
