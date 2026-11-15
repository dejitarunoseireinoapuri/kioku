package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeDescription
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.control_corrected_detail
import io.github.dejitarunoseireinoapuri.kioku.resources.control_corrected_target
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgotten
import org.jetbrains.compose.resources.stringResource

@Composable
fun MemoryChangeNotice(
    action: ChangeAction,
    description: MemoryChangeDescription? = null,
    title: String = memoryChangeText(action),
) {
    Panel(Modifier.testTag("memory-change-notice")) {
        Text(title, fontWeight = FontWeight.SemiBold)
        description?.let {
            Text(
                if (action == ChangeAction.Correct && it.replacementText != null) {
                    stringResource(Res.string.control_corrected_detail, it.previousText, it.replacementText)
                } else if (action == ChangeAction.Forget) {
                    stringResource(Res.string.control_forgotten, it.previousText)
                } else {
                    stringResource(Res.string.control_corrected_target, it.previousText)
                },
            )
        }
    }
}
