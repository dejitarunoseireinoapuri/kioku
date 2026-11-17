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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSafeArea
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.design.MatrixBackdrop
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_conflict
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_connection
import io.github.dejitarunoseireinoapuri.kioku.resources.reference_no_text
import io.github.dejitarunoseireinoapuri.kioku.resources.references_busy
import io.github.dejitarunoseireinoapuri.kioku.resources.references_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.references_drive_link
import io.github.dejitarunoseireinoapuri.kioku.resources.references_interrupted
import io.github.dejitarunoseireinoapuri.kioku.resources.references_invalid
import io.github.dejitarunoseireinoapuri.kioku.resources.references_partial
import io.github.dejitarunoseireinoapuri.kioku.resources.references_permission
import io.github.dejitarunoseireinoapuri.kioku.resources.references_reading
import io.github.dejitarunoseireinoapuri.kioku.resources.references_sign_in
import io.github.dejitarunoseireinoapuri.kioku.resources.references_stored
import io.github.dejitarunoseireinoapuri.kioku.resources.references_title
import io.github.dejitarunoseireinoapuri.kioku.resources.references_too_large
import io.github.dejitarunoseireinoapuri.kioku.resources.references_unavailable
import io.github.dejitarunoseireinoapuri.kioku.resources.references_unsupported
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun ReferenceImportApp(
    state: ReferenceImportState,
    onCancel: () -> Unit,
) {
    KiokuTheme {
        Surface(color = KiokuColors.Background, contentColor = KiokuColors.Text) {
            MatrixBackdrop { KiokuSafeArea { ReferenceImportScreen(state, onCancel) } }
        }
    }
}

@Composable
fun ReferenceImportScreen(
    state: ReferenceImportState,
    onCancel: () -> Unit,
) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(KiokuSpacing.Large),
        verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Medium),
    ) {
        Text(stringResource(Res.string.references_title))
        state.issue?.let { Text(stringResource(referenceIssueText(it))) }
        state.items.forEach { item ->
            Panel {
                Text(item.input.title)
                when (val result = item.result) {
                    is ReferenceImportResult.Stored -> {
                        Text(
                            stringResource(
                                if (result.partial) Res.string.references_partial else Res.string.references_stored,
                            ),
                        )
                    }

                    is ReferenceImportResult.Failed -> {
                        Text(stringResource(referenceIssueText(result.issue)))
                    }

                    null -> {
                        if (state.readingId ==
                            item.input.id
                        ) {
                            Text(stringResource(Res.string.references_reading), Modifier.testTag("reference-reading"))
                        }
                    }
                }
            }
        }
        ActionButton(stringResource(Res.string.references_cancel), onCancel)
    }
}

internal fun referenceIssueText(issue: ReferenceIssue): StringResource =
    when (issue) {
        ReferenceIssue.Unavailable -> Res.string.references_unavailable
        ReferenceIssue.SignInRequired -> Res.string.references_sign_in
        ReferenceIssue.Permission -> Res.string.references_permission
        ReferenceIssue.Unsupported -> Res.string.references_unsupported
        ReferenceIssue.TooLarge -> Res.string.references_too_large
        ReferenceIssue.Invalid -> Res.string.references_invalid
        ReferenceIssue.Interrupted -> Res.string.references_interrupted
        ReferenceIssue.Busy -> Res.string.references_busy
        ReferenceIssue.DriveLink -> Res.string.references_drive_link
        ReferenceIssue.Connection, ReferenceIssue.NoText, ReferenceIssue.Conflict -> workspaceIssueText(issue)
    }

private fun workspaceIssueText(issue: ReferenceIssue): StringResource =
    when (issue) {
        ReferenceIssue.Connection -> Res.string.reference_connection
        ReferenceIssue.NoText -> Res.string.reference_no_text
        else -> Res.string.reference_conflict
    }
