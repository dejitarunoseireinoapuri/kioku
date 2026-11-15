package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.window.Dialog
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetPreview
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.control_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_confirm
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_confirm_copies
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_confirm_source
import io.github.dejitarunoseireinoapuri.kioku.resources.forget_confirm_title
import org.jetbrains.compose.resources.stringResource

@Composable
fun ForgetConfirmationDialog(
    preview: ForgetPreview,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
) {
    Dialog(onDismissRequest = onCancel) {
        Panel(
            Modifier
                .testTag("forget-confirmation")
                .heightIn(max = KiokuSpacing.ConfirmationMaxHeight)
                .verticalScroll(rememberScrollState()),
        ) {
            ScreenHeading(stringResource(Res.string.forget_confirm_title))
            Text(
                stringResource(
                    if (preview.scope == ForgetScope.AllOccurrences) {
                        Res.string.forget_confirm_copies
                    } else {
                        Res.string.forget_confirm_source
                    },
                ),
                color = KiokuColors.Secondary,
            )
            Text(
                preview.text,
                modifier =
                    Modifier
                        .heightIn(max = KiokuSpacing.ConfirmationTextHeight)
                        .verticalScroll(rememberScrollState()),
            )
            Column(
                Modifier.fillMaxWidth().padding(top = KiokuSpacing.Small),
                verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Small),
            ) {
                ActionButton(stringResource(Res.string.control_cancel), onCancel, Modifier.fillMaxWidth())
                AccentButton(
                    stringResource(Res.string.forget_confirm),
                    onConfirm,
                    Modifier.fillMaxWidth().testTag("forget-confirm-action"),
                )
            }
        }
    }
}
