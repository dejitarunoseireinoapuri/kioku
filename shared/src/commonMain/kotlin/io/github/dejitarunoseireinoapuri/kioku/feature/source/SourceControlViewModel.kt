package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetPreview
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.previewForget
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface ControlFeedback {
    data object Unavailable : ControlFeedback

    data object Processing : ControlFeedback

    data class Clarification(
        val text: String,
    ) : ControlFeedback
}

sealed interface SourceControlState {
    data object Loading : SourceControlState

    data object Missing : SourceControlState

    data class Ready(
        val source: EditableSource,
        val editing: String? = null,
        val draft: String = "",
        val feedback: ControlFeedback? = null,
        val forget: PendingSourceForget? = null,
    ) : SourceControlState

    data class Working(
        val previous: Ready,
        val action: ChangeAction,
    ) : SourceControlState

    data class Done(
        val result: MemoryChange.Confirmed,
        val forgottenText: String? = null,
    ) : SourceControlState
}

data class PendingSourceForget(
    val ids: List<String>,
    val preview: ForgetPreview,
)

sealed interface SourceControlEvent {
    data class Edit(
        val id: String,
    ) : SourceControlEvent

    data class Draft(
        val text: String,
    ) : SourceControlEvent

    data class Forget(
        val id: String? = null,
    ) : SourceControlEvent

    data object Apply : SourceControlEvent

    data object ConfirmForget : SourceControlEvent

    data object CancelForget : SourceControlEvent

    data object Cancel : SourceControlEvent

    data object Retry : SourceControlEvent

    data object Reload : SourceControlEvent
}

class SourceControlViewModel(
    private val repository: MemoryControlRepository,
    private val sourceId: String,
) : ViewModel() {
    private val mutableState = MutableStateFlow<SourceControlState>(SourceControlState.Loading)
    val state = mutableState.asStateFlow()
    private var command: MemoryChangeCommand? = null
    private var approvedForgetText: String? = null
    private var job: Job? = null
    private var generation = 0
    private var paused: SourceControlState? = null

    init {
        load()
    }

    fun check() {
        val restored = paused ?: state.value
        paused = null
        if (restored !is SourceControlState.Ready) {
            mutableState.value = restored
            return
        }
        val ready = restored
        val epoch = ++generation
        mutableState.value = SourceControlState.Loading
        job =
            viewModelScope.launch {
                val revision = repository.revision()
                if (epoch != generation) return@launch
                when (revision) {
                    null -> present(SourceControlState.Missing)
                    ready.source.memoryRevision -> present(ready)
                    else -> load()
                }
            }
    }

    fun conceal() {
        if (paused == null) paused = state.value
        mutableState.value = SourceControlState.Loading
    }

    private fun present(next: SourceControlState) {
        if (paused == null) mutableState.value = next else paused = next
    }

    fun onEvent(event: SourceControlEvent) {
        when (event) {
            SourceControlEvent.Reload -> {
                load()
            }

            SourceControlEvent.Retry -> {
                (state.value as? SourceControlState.Ready)?.let { ready ->
                    command?.let { execute(it, ready) }
                }
            }

            else -> {
                (state.value as? SourceControlState.Ready)
                    ?.takeUnless { it.feedback == ControlFeedback.Processing }
                    ?.let { handleEvent(it, event) }
            }
        }
    }

    private fun handleEvent(
        ready: SourceControlState.Ready,
        event: SourceControlEvent,
    ) {
        if (ready.forget != null) {
            decideForget(ready, event)
            return
        }
        when (event) {
            is SourceControlEvent.Edit -> {
                selectEdit(ready, event.id)
            }

            is SourceControlEvent.Draft -> {
                command = null
                mutableState.value = ready.copy(draft = event.text.take(MAX_CORRECTION_LENGTH), feedback = null)
            }

            is SourceControlEvent.Forget -> {
                forget(ready, event.id)
            }

            SourceControlEvent.Apply -> {
                apply(ready)
            }

            SourceControlEvent.Cancel -> {
                command = null
                mutableState.value = ready.copy(editing = null, draft = "", feedback = null)
            }

            SourceControlEvent.Reload, SourceControlEvent.Retry,
            SourceControlEvent.ConfirmForget, SourceControlEvent.CancelForget,
            -> {}
        }
    }

    private fun selectEdit(
        ready: SourceControlState.Ready,
        id: String,
    ) {
        if (ready.source.items.any { it.id == id }) {
            command = null
            mutableState.value = ready.copy(editing = id, draft = "", feedback = null)
        }
    }

    private fun forget(
        ready: SourceControlState.Ready,
        id: String?,
    ) {
        val ids = id?.let { listOf(it) } ?: ready.source.items.map { it.id }
        val scope = if (id == null) ForgetScope.Source else ForgetScope.AllOccurrences
        ready.source.previewForget(ids, scope)?.let { preview ->
            command = null
            approvedForgetText = null
            mutableState.value = ready.copy(forget = PendingSourceForget(ids, preview), feedback = null)
        }
    }

    private fun decideForget(
        ready: SourceControlState.Ready,
        event: SourceControlEvent,
    ) {
        val pending = ready.forget ?: return
        when (event) {
            SourceControlEvent.ConfirmForget -> {
                prepare(ready, pending.ids, ChangeAction.Forget, pending.preview.scope)
            }

            SourceControlEvent.CancelForget -> {
                mutableState.value = ready.copy(forget = null)
            }

            else -> {}
        }
    }

    private fun apply(ready: SourceControlState.Ready) {
        if (ready.editing != null &&
            ready.draft.isNotBlank()
        ) {
            prepare(ready, listOf(ready.editing), ChangeAction.Correct)
        }
    }

    private fun load() {
        if (state.value is SourceControlState.Working) return
        val epoch = ++generation
        job?.cancel()
        command = null
        approvedForgetText = null
        if (paused != null) paused = SourceControlState.Loading
        mutableState.value = SourceControlState.Loading
        job =
            viewModelScope.launch {
                val source = repository.details(sourceId)
                if (epoch ==
                    generation
                ) {
                    present(source?.let { SourceControlState.Ready(it) } ?: SourceControlState.Missing)
                }
            }
    }

    private fun prepare(
        ready: SourceControlState.Ready,
        ids: List<String>,
        action: ChangeAction,
        forgetScope: ForgetScope = ForgetScope.Source,
    ) {
        approvedForgetText =
            ready.forget
                ?.preview
                ?.text
                .takeIf { action == ChangeAction.Forget }
        val pending =
            repository
                .prepare(
                    ready.source,
                    ids,
                    action,
                    ready.draft.takeIf { action == ChangeAction.Correct },
                ).copy(forgetScope = forgetScope)
        command = pending
        execute(pending, ready)
    }

    private fun execute(
        pending: MemoryChangeCommand,
        ready: SourceControlState.Ready,
    ) {
        val epoch = ++generation
        val previous = ready.copy(feedback = null, forget = null)
        mutableState.value = SourceControlState.Working(previous, pending.action)
        job =
            viewModelScope.launch {
                val result = repository.execute(pending)
                if (epoch != generation) return@launch
                present(
                    when (result) {
                        is MemoryChange.Confirmed -> {
                            SourceControlState.Done(result, approvedForgetText)
                        }

                        is MemoryChange.Clarification -> {
                            previous.copy(
                                feedback = ControlFeedback.Clarification(result.text),
                            )
                        }

                        is MemoryChange.Failed -> {
                            previous.copy(feedback = ControlFeedback.Unavailable)
                        }

                        MemoryChange.Processing -> {
                            previous.copy(feedback = ControlFeedback.Processing)
                        }
                    },
                )
            }
    }

    override fun onCleared() {
        generation++
        job?.cancel()
        command = null
        approvedForgetText = null
        paused = null
        mutableState.value = SourceControlState.Missing
    }
}

private const val MAX_CORRECTION_LENGTH = 2000
