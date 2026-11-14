package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.TextField
import androidx.compose.material.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import io.github.dejitarunoseireinoapuri.kioku.design.ActionButton
import io.github.dejitarunoseireinoapuri.kioku.design.ContentLoadingNotice
import io.github.dejitarunoseireinoapuri.kioku.design.IconAction
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuColors
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuSpacing
import io.github.dejitarunoseireinoapuri.kioku.design.Panel
import io.github.dejitarunoseireinoapuri.kioku.design.TopBar
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.resources.Res
import io.github.dejitarunoseireinoapuri.kioku.resources.back
import io.github.dejitarunoseireinoapuri.kioku.resources.control_apply
import io.github.dejitarunoseireinoapuri.kioku.resources.control_cancel
import io.github.dejitarunoseireinoapuri.kioku.resources.control_corrected
import io.github.dejitarunoseireinoapuri.kioku.resources.control_correcting
import io.github.dejitarunoseireinoapuri.kioku.resources.control_correction_hint
import io.github.dejitarunoseireinoapuri.kioku.resources.control_edit
import io.github.dejitarunoseireinoapuri.kioku.resources.control_explanation
import io.github.dejitarunoseireinoapuri.kioku.resources.control_failed
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forget_all
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forget_item
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgetting
import io.github.dejitarunoseireinoapuri.kioku.resources.control_forgotten
import io.github.dejitarunoseireinoapuri.kioku.resources.control_loading
import io.github.dejitarunoseireinoapuri.kioku.resources.control_reload
import io.github.dejitarunoseireinoapuri.kioku.resources.control_retry
import io.github.dejitarunoseireinoapuri.kioku.resources.control_title
import io.github.dejitarunoseireinoapuri.kioku.resources.control_unavailable
import io.github.dejitarunoseireinoapuri.kioku.resources.control_uncertain
import io.github.dejitarunoseireinoapuri.kioku.resources.icon_back
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

@Composable
fun SourceControlRoute(
    sourceId: String,
    repository: MemoryControlRepository,
    onBack: () -> Unit,
    viewModel: SourceControlViewModel = koinViewModel(parameters = { parametersOf(repository, sourceId) }),
    onChanged: (MemoryChange.Confirmed) -> Unit,
) {
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { viewModel.check() }
    LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) { viewModel.conceal() }
    val state by viewModel.state.collectAsStateWithLifecycle()
    val done = state as? SourceControlState.Done
    LaunchedEffect(done) { done?.let { onChanged(it.result) } }
    SourceControlScreen(state, viewModel::onEvent, onBack)
}

@Composable
fun SourceControlScreen(
    state: SourceControlState,
    onEvent: (SourceControlEvent) -> Unit,
    onBack: () -> Unit,
) {
    val scroll = rememberScrollState()
    val working = state is SourceControlState.Working
    val forward = controlInputEvents(onEvent)
    LaunchedEffect(working, scroll.maxValue) { if (working) scroll.animateScrollTo(scroll.maxValue) }
    Column(Modifier.fillMaxSize()) {
        TopBar(stringResource(Res.string.control_title), leading = {
            IconAction(Res.drawable.icon_back, stringResource(Res.string.back), onBack)
        })
        Column(
            Modifier.weight(1f).verticalScroll(scroll).padding(KiokuSpacing.Large),
            verticalArrangement = Arrangement.spacedBy(KiokuSpacing.Large),
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
                    Text(
                        stringResource(
                            if (state.result.action == ChangeAction.Correct) {
                                Res.string.control_corrected
                            } else {
                                Res.string.control_forgotten
                            },
                        ),
                    )
                }

                else -> {
                    ControlContent(state, forward)
                }
            }
        }
    }
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
private fun ControlContent(
    state: SourceControlState,
    onEvent: (SourceControlEvent) -> Unit,
) {
    val ready = (state as? SourceControlState.Working)?.previous ?: state as SourceControlState.Ready
    val working = state is SourceControlState.Working
    val enabled = !working && ready.feedback != ControlFeedback.Processing
    Text(stringResource(Res.string.control_explanation), color = KiokuColors.Secondary)
    ready.source.items.forEach { item ->
        Panel {
            Text(item.text)
            if (ready.editing == item.id) {
                CorrectionEditor(ready, enabled, onEvent)
            } else {
                ActionButton(
                    stringResource(Res.string.control_edit),
                    { onEvent(SourceControlEvent.Edit(item.id)) },
                    enabled = enabled,
                )
                ActionButton(stringResource(Res.string.control_forget_item), {
                    onEvent(SourceControlEvent.Forget(item.id))
                }, enabled = enabled)
            }
        }
    }
    ActionButton(
        stringResource(Res.string.control_forget_all),
        { onEvent(SourceControlEvent.Forget()) },
        enabled = enabled,
    )
    if (working) {
        ContentLoadingNotice(
            stringResource(
                if (state.action == ChangeAction.Correct) {
                    Res.string.control_correcting
                } else {
                    Res.string.control_forgetting
                },
            ),
        )
    }
    ControlFeedbackNotice(ready.feedback, working, onEvent)
}

@Composable
private fun CorrectionEditor(
    ready: SourceControlState.Ready,
    enabled: Boolean,
    onEvent: (SourceControlEvent) -> Unit,
) {
    Text(
        stringResource(Res.string.control_correction_hint),
        style = MaterialTheme.typography.body2,
        color = KiokuColors.Secondary,
    )
    TextField(
        value = ready.draft,
        onValueChange = { onEvent(SourceControlEvent.Draft(it)) },
        enabled = enabled,
        modifier = Modifier.fillMaxWidth().testTag("correction-input"),
        maxLines = 5,
        colors =
            TextFieldDefaults.textFieldColors(
                textColor = KiokuColors.Text,
                backgroundColor = KiokuColors.Surface,
                cursorColor = KiokuColors.Coral,
                focusedIndicatorColor = KiokuColors.Coral,
            ),
    )
    ActionButton(
        stringResource(Res.string.control_apply),
        { onEvent(SourceControlEvent.Apply) },
        enabled =
            enabled && ready.draft.isNotBlank(),
    )
    ActionButton(stringResource(Res.string.control_cancel), { onEvent(SourceControlEvent.Cancel) }, enabled = enabled)
}

@Composable
private fun ControlFeedbackNotice(
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
