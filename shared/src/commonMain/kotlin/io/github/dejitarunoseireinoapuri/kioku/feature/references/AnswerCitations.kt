package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.window.Dialog
import io.github.dejitarunoseireinoapuri.kioku.CompositionViewModels
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceWorkspaceRepository
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_reading
import io.github.dejitarunoseireinoapuri.kioku.resources.references_unavailable
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

val LocalReferenceReader = staticCompositionLocalOf<(() -> ReferenceWorkspaceRepository?)?> { null }

@Composable
internal fun AnswerCitations(
    citations: List<ReferenceCitation>,
    enabled: Boolean,
) {
    var selected by remember(citations) { mutableStateOf<ReferenceCitation?>(null) }
    val reader = LocalReferenceReader.current
    Column {
        citations.forEach { cite ->
            ActionButton(cite.title, { selected = cite }, enabled = enabled && reader != null)
        }
    }
    selected?.let { cite ->
        val repository = remember(cite, reader) { reader?.invoke() }
        if (repository != null) {
            Dialog(onDismissRequest = { selected = null }) {
                CompositionViewModels { CurrentCitation(cite, repository) }
            }
        }
    }
}

@Composable
private fun CurrentCitation(
    citation: ReferenceCitation,
    repository: ReferenceWorkspaceRepository,
) {
    val model = koinViewModel<ReferenceWorkspaceViewModel>(parameters = { parametersOf(repository) })
    val state by model.state.collectAsState()
    LaunchedEffect(citation) {
        model.select(ReferenceSummary(citation.sourceId, citation.revision, citation.title, false, 0))
        model.read()
    }
    val current =
        state.detail.find {
            it.location == citation.location && it.number == citation.number && it.text == citation.text
        }
    if (current != null) {
        Column(Modifier.verticalScroll(rememberScrollState())) { WorkspaceCitation(current) }
    } else {
        Panel {
            Text(
                stringResource(
                    if (state.issue != null || state.detail.isNotEmpty()) {
                        Res.string.references_unavailable
                    } else {
                        Res.string.reference_reading
                    },
                ),
            )
        }
    }
}
