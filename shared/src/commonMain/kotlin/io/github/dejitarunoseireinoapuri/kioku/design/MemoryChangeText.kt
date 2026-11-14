package io.github.dejitarunoseireinoapuri.kioku.design

import androidx.compose.runtime.Composable
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.control_corrected
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgotten
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgotten_fallback
import org.jetbrains.compose.resources.stringResource

@Composable
fun memoryChangeText(
    action: ChangeAction,
    forgottenText: String? = null,
): String =
    when {
        action == ChangeAction.Correct -> stringResource(Res.string.control_corrected)
        forgottenText != null -> stringResource(Res.string.control_forgotten, forgottenText)
        else -> stringResource(Res.string.control_forgotten_fallback)
    }
