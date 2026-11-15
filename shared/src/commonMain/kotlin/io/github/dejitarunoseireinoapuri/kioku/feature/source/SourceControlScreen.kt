package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.ForgetConfirmationDialog
import io.github.dejitarunoseireinoapuri.kioku.design.IconAction
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.design.memoryChangeText
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.back
import io.github.dejitarunoseireinoapuri.kioku.resources.control_deleted
import io.github.dejitarunoseireinoapuri.kioku.resources.control_failed
import io.github.dejitarunoseireinoapuri.kioku.resources.control_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.control_refresh_failed
import io.github.dejitarunoseireinoapuri.kioku.resources.control_reload
import io.github.dejitarunoseireinoapuri.kioku.resources.control_retry
import io.github.dejitarunoseireinoapuri.kioku.resources.control_title
import io.github.dejitarunoseireinoapuri.kioku.resources.control_unavailable
import io.github.dejitarunoseireinoapuri.kioku.resources.control_uncertain
import io.github.dejitarunoseireinoapuri.kioku.resources.control_updated
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_back
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

@Composable
fun SourceControlRoute(
    sourceId: String,
    repository: MemoryControlRepository,
    onBack: () -> Unit,
    viewModel: SourceControlViewModel =
        koinViewModel(parameters = { parametersOf(repository, sourceId) }),
    onMutation: () -> Unit = {},
    onChanged: (MemoryChange.Confirmed) -> Unit,
) {
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { viewModel.check() }
    LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) { viewModel.conceal() }
    val state by viewModel.state.collectAsStateWithLifecycle()
    val change by viewModel.changes.collectAsStateWithLifecycle()
    LaunchedEffect(change) { viewModel.consumeChange()?.let(onChanged) }
    SourceControlScreen(state, { event ->
        if (event == SourceControlEvent.Apply || event == SourceControlEvent.ConfirmForget ||
            event == SourceControlEvent.Retry
        ) {
            onMutation()
        }
        viewModel.onEvent(event)
    }, onBack)
}

@Composable
fun SourceControlScreen(
    state: SourceControlState,
    onEvent: (SourceControlEvent) -> Unit,
    onBack: () -> Unit,
) {
    val scroll = rememberScrollState()
    val working = state is SourceControlState.Working
    val feedback = (state as? SourceControlState.Ready)?.feedback
    val notice = (state as? SourceControlState.Ready)?.notice
    val forward = controlInputEvents(onEvent)
    (state as? SourceControlState.Ready)?.forget?.let { pending ->
        ForgetConfirmationDialog(
            pending.preview,
            { forward(SourceControlEvent.ConfirmForget) },
            { forward(SourceControlEvent.CancelForget) },
        )
    }
    LaunchedEffect(working, feedback, notice, scroll.maxValue) {
        if (working || feedback != null || notice != null) scroll.animateScrollTo(scroll.maxValue)
    }
    Column(Modifier.fillMaxSize()) {
        TopBar(
            stringResource(Res.string.control_title),
            leading = { IconAction(Res.drawable.icon_back, stringResource(Res.string.back), onBack) },
            titleStyle = MaterialTheme.typography.body1.copy(fontWeight = FontWeight.SemiBold),
        )
        Column(
            Modifier.weight(1f).verticalScroll(scroll).padding(KiokuSpacing.Large),
            verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large),
        ) {
            ControlScreenContent(state, forward)
        }
    }
}

@Composable
private fun ControlScreenContent(
    state: SourceControlState,
    onEvent: (SourceControlEvent) -> Unit,
) {
    when (state) {
        SourceControlState.Loading -> {
            ContentLoadingNotice(stringResource(Res.string.control_loading))
        }

        SourceControlState.Missing -> {
            Text(stringResource(Res.string.control_unavailable))
            ActionButton(stringResource(Res.string.control_reload), { onEvent(SourceControlEvent.Reload) })
        }

        is SourceControlState.Done -> {
            ControlChangeNotice(state.result.action)
        }

        is SourceControlState.Refreshing -> {
            ControlChangeNotice(state.result.action)
            ContentLoadingNotice(stringResource(Res.string.control_loading))
        }

        is SourceControlState.RefreshFailed -> {
            ControlChangeNotice(state.result.action)
            Text(stringResource(Res.string.control_refresh_failed))
            ActionButton(stringResource(Res.string.control_reload), { onEvent(SourceControlEvent.Reload) })
        }

        else -> {
            SourceControlContent(state, onEvent)
        }
    }
}

@Composable
internal fun ControlChangeNotice(action: ChangeAction) {
    Text(stringResource(if (action == ChangeAction.Forget) Res.string.control_deleted else Res.string.control_updated))
}

@Composable
private fun controlInputEvents(onEvent: (SourceControlEvent) -> Unit): (SourceControlEvent) -> Unit {
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    return { event ->
        if (event == SourceControlEvent.Apply || event == SourceControlEvent.Cancel ||
            event is SourceControlEvent.Forget
        ) {
            focus.clearFocus()
            keyboard?.hide()
        }
        onEvent(event)
    }
}

@Composable
internal fun ControlFeedbackNotice(
    feedback: ControlFeedback?,
    working: Boolean,
    onEvent: (SourceControlEvent) -> Unit,
) {
    when (feedback) {
        null -> {}

        is ControlFeedback.Clarification -> {
            Text(feedback.text)
        }

        else -> {
            Text(
                stringResource(
                    if (feedback ==
                        ControlFeedback.Processing
                    ) {
                        Res.string.control_uncertain
                    } else {
                        Res.string.control_failed
                    },
                ),
            )
            ActionButton(
                stringResource(Res.string.control_retry),
                { onEvent(SourceControlEvent.Retry) },
                enabled = !working,
            )
            ActionButton(
                stringResource(Res.string.control_reload),
                { onEvent(SourceControlEvent.Reload) },
                enabled = !working,
            )
        }
    }
}
