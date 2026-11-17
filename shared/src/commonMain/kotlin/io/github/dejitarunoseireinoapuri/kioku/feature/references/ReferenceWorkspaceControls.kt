package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.window.Dialog
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_confirm
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_forget
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_forget_notice
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_forget_title
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_found
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_import_web
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_line
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_no_matches
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_open_web
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_page
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_paragraph
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_partial
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_question
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_read
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_retry
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_search
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_section
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_stored
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_web
import org.jetbrains.compose.resources.stringResource

@Composable
internal fun WorkspaceWeb(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    Panel {
        OutlinedTextField(
            state.web,
            actions::web,
            Modifier.fillMaxWidth().testTag("reference-web"),
            label = { Text(stringResource(Res.string.reference_web)) },
        )
        ActionButton(stringResource(Res.string.reference_import_web), actions::importWeb, enabled = state.work == null)
    }
}

@Composable
internal fun WorkspaceImportResults(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    state.items.forEach { item ->
        Panel {
            Text(item.input.title)
            when (val result = item.result) {
                is ReferenceImportResult.Stored -> {
                    Text(
                        stringResource(
                            if (result.partial) Res.string.reference_partial else Res.string.reference_stored,
                        ),
                    )
                }

                is ReferenceImportResult.Failed -> {
                    Text(stringResource(referenceIssueText(result.issue)))
                }

                null -> {
                    // Await server confirmation.
                }
            }
        }
    }
    if (state.work == null && state.items.any { it.result !is ReferenceImportResult.Stored }) {
        ActionButton(stringResource(Res.string.reference_retry), actions::retry)
    }
}

@Composable
internal fun WorkspaceQuery(
    state: ReferenceWorkspaceState,
    actions: ReferenceWorkspaceActions,
) {
    val keyboard = LocalSoftwareKeyboardController.current
    Panel {
        OutlinedTextField(
            state.question,
            actions::question,
            Modifier.fillMaxWidth().testTag("reference-question"),
            label = { Text(stringResource(Res.string.reference_question)) },
        )
        ActionButton(
            stringResource(Res.string.reference_search),
            {
                keyboard?.hide()
                actions.ask()
            },
            enabled = state.work == null && state.question.isNotBlank(),
        )
        state.answer?.let { Text(it, Modifier.testTag("reference-answer")) }
        if (state.searched && state.answer == null) {
            Text(
                stringResource(
                    if (state.citations.isEmpty()) Res.string.reference_no_matches else Res.string.reference_found,
                ),
            )
        }
    }
    state.citations.forEach { WorkspaceCitation(it) }
}

@Composable
internal fun WorkspaceSource(
    source: ReferenceSummary,
    enabled: Boolean,
    actions: ReferenceWorkspaceActions,
) {
    Panel {
        Text(source.title)
        ActionButton(stringResource(Res.string.reference_read), actions::read, enabled = enabled)
        ActionButton(stringResource(Res.string.reference_forget), { actions.previewForget(source) }, enabled = enabled)
    }
}

@Composable
internal fun WorkspaceCitation(citation: ReferenceCitation) {
    val uriHandler = LocalUriHandler.current
    val label =
        when (citation.location) {
            "page" -> Res.string.reference_page
            "paragraph" -> Res.string.reference_paragraph
            "line" -> Res.string.reference_line
            else -> Res.string.reference_section
        }
    Panel {
        Text(citation.title)
        Text(stringResource(label, citation.number))
        Text(citation.text, Modifier.testTag("reference-citation"))
        citation.url?.takeIf { it.startsWith("https://") }?.let { url ->
            ActionButton(stringResource(Res.string.reference_open_web), { uriHandler.openUri(url) })
        }
    }
}

@Composable
internal fun WorkspaceForgetDialog(
    source: ReferenceSummary,
    actions: ReferenceWorkspaceActions,
) {
    Dialog(onDismissRequest = { actions.previewForget(null) }) {
        Panel {
            Text(stringResource(Res.string.reference_forget_title))
            Text(source.title)
            Text(stringResource(Res.string.reference_forget_notice))
            Column(verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small)) {
                ActionButton(stringResource(Res.string.reference_cancel), { actions.previewForget(null) })
                ActionButton(stringResource(Res.string.reference_confirm), actions::confirmForget, primary = true)
            }
        }
    }
}
