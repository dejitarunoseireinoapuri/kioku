package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.staticCompositionLocalOf
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_importing
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_partial
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_retry
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_stored
import kotlinx.coroutines.delay
import org.jetbrains.compose.resources.stringResource

val LocalSourceDelivery = staticCompositionLocalOf { 0L }
val LocalSharedSourceNotice = staticCompositionLocalOf<@Composable () -> Unit> { {} }

/** Import receipts are transient presentation, never feed evidence or conversation context. */
@Composable
fun SharedSourceNotice(
    state: ReferenceWorkspaceState,
    dismiss: () -> Unit,
    retry: () -> Unit,
) {
    val results = state.items.mapNotNull { it.result } + listOfNotNull(state.webReceipt)
    val confirmed =
        state.issue == null && results.isNotEmpty() && results.size >= state.items.size &&
            results.all { it is ReferenceImportResult.Stored }
    val partial = results.filterIsInstance<ReferenceImportResult.Stored>().any { it.partial }
    val issue = state.issue ?: results.filterIsInstance<ReferenceImportResult.Failed>().firstOrNull()?.issue
    ImportProgress(confirmed, partial, state.work)
    issue?.let {
        ImportFailure(it, state, dismiss, retry)
    }
    LaunchedEffect(confirmed, state.work) {
        if (confirmed && state.work == null) {
            delay(NOTICE_MS)
            dismiss()
        }
    }
}

@Composable
private fun ImportProgress(
    confirmed: Boolean,
    partial: Boolean,
    work: ReferenceWork?,
) {
    if (work == ReferenceWork.Importing || work == ReferenceWork.Receiving || confirmed) {
        val text =
            when {
                work != null -> Res.string.reference_importing
                partial -> Res.string.reference_partial
                else -> Res.string.reference_stored
            }
        Panel { Text(stringResource(text)) }
    }
}

@Composable
private fun ImportFailure(
    issue: ReferenceIssue,
    state: ReferenceWorkspaceState,
    dismiss: () -> Unit,
    retry: () -> Unit,
) {
    Panel {
        Text(stringResource(referenceIssueText(issue)))
        if (state.items.any { it.result !is ReferenceImportResult.Stored }) {
            ActionButton(stringResource(Res.string.reference_retry), retry, enabled = state.work == null)
        }
        ActionButton(stringResource(Res.string.reference_cancel), dismiss, enabled = state.work == null)
    }
}

private const val NOTICE_MS = 5000L
