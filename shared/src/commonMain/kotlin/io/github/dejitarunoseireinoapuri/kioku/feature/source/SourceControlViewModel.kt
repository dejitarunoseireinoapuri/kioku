package io.github.dejitarunoseireinoapuri.kioku.feature.source

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetScope
import io.github.dejitarunoseireinoapuri.kioku.domain.MAX_MANAGEMENT_SOURCES
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeDescription
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.describeChange
import io.github.dejitarunoseireinoapuri.kioku.domain.previewForget
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

class SourceControlViewModel(
    private val repository: MemoryControlRepository,
    initialSourceIds: List<String>,
) : ViewModel() {
    constructor(repository: MemoryControlRepository, sourceId: String) : this(repository, listOf(sourceId))

    private val mutableState = MutableStateFlow<SourceControlState>(SourceControlState.Checking)
    val state = mutableState.asStateFlow()
    private var command: MemoryChangeCommand? = null
    private var job: Job? = null
    private var generation = 0
    private var paused: SourceControlState? = null
    private var sourceIds = initialSourceIds.distinct()
    var changeDescription: MemoryChangeDescription? = null
        private set
    private var confirmed: MemoryChange.Confirmed? = null
    private val mutableChanges = MutableStateFlow<MemoryChange.Confirmed?>(null)
    val changes = mutableChanges.asStateFlow()

    fun consumeChange(): MemoryChange.Confirmed? = mutableChanges.value.also { mutableChanges.value = null }

    init {
        require(sourceIds.isNotEmpty() && sourceIds.size <= MAX_MANAGEMENT_SOURCES)
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
        mutableState.value = SourceControlState.Checking
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
        if (ready.sources.any { source -> source.items.any { it.id == id } }) {
            command = null
            mutableState.value = ready.copy(editing = id, draft = "", feedback = null)
        }
    }

    private fun forget(
        ready: SourceControlState.Ready,
        id: String?,
    ) {
        val source = ready.sources.firstOrNull { item -> id == null || item.items.any { it.id == id } } ?: return
        val ids = id?.let { listOf(it) } ?: source.items.map { it.id }
        val scope = if (id == null) ForgetScope.Source else ForgetScope.AllOccurrences
        source.previewForget(ids, scope)?.let { preview ->
            command = null
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
        val waiting =
            confirmed?.let { SourceControlState.Refreshing(it, changeDescription) } ?: SourceControlState.Checking
        if (paused != null) paused = waiting
        mutableState.value = waiting
        job =
            viewModelScope.launch {
                if (confirmed == null) {
                    val revision = repository.revision()
                    if (epoch != generation) return@launch
                    if (revision == null) {
                        present(SourceControlState.Missing)
                        return@launch
                    }
                    present(SourceControlState.Loading)
                }
                refreshContent(epoch)
            }
    }

    private fun prepare(
        ready: SourceControlState.Ready,
        ids: List<String>,
        action: ChangeAction,
        forgetScope: ForgetScope = ForgetScope.Source,
    ) {
        val pending =
            repository
                .prepare(
                    ready.sources.first { source -> ids.all { id -> source.items.any { it.id == id } } },
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
        val previous = ready.copy(feedback = null, forget = null, notice = null, description = null)
        mutableState.value = SourceControlState.Working(previous, pending.action)
        job =
            viewModelScope.launch {
                val result = repository.execute(pending)
                if (epoch != generation) return@launch
                if (result is MemoryChange.Confirmed) {
                    confirmedChange(pending, ready, result, epoch)
                    return@launch
                }
                present(
                    when (result) {
                        is MemoryChange.Confirmed -> {
                            error("Confirmed changes are refreshed before presentation")
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

    private suspend fun confirmedChange(
        pending: MemoryChangeCommand,
        previous: SourceControlState.Ready,
        result: MemoryChange.Confirmed,
        epoch: Int,
    ) {
        command = null
        confirmed = result.copy(previousSourceId = pending.sourceId)
        changeDescription =
            previous.sources
                .firstOrNull { it.source.id == pending.sourceId }
                ?.describeChange(pending.memoryIds, pending.correction)
        mutableChanges.value = confirmed
        sourceIds =
            previous.sources
                .flatMap { source ->
                    result.replacements.firstOrNull { it.sourceId == source.source.id }?.sourceIds
                        ?: if (source.source.id == pending.sourceId) result.sourceIds else listOf(source.source.id)
                }.distinct()
        present(SourceControlState.Refreshing(result, changeDescription))
        refreshContent(epoch, notify = true)
    }

    private suspend fun refreshContent(
        epoch: Int,
        notify: Boolean = false,
    ) {
        val sources =
            withTimeoutOrNull(CONTROL_REFRESH_TIMEOUT_MS) {
                sourceIds.map { repository.details(it) }
            } ?: sourceIds.map { null }
        if (epoch != generation) return
        val current = sources.filterNotNull()
        val result = confirmed
        val unavailable =
            if (result ==
                null
            ) {
                SourceControlState.Missing
            } else {
                SourceControlState.RefreshFailed(result, changeDescription)
            }
        present(
            when {
                sources.any { it == null } || current.map { it.memoryRevision }.distinct().size > 1 ||
                    (notify && current.any { result != null && it.memoryRevision != result.memoryRevision }) -> {
                    unavailable
                }

                current.isNotEmpty() -> {
                    SourceControlState.Ready(
                        current.first(),
                        related = current.drop(1),
                        notice = result?.action,
                        description = changeDescription,
                    )
                }

                result != null -> {
                    SourceControlState.Done(result, changeDescription)
                }

                else -> {
                    SourceControlState.Missing
                }
            },
        )
    }

    override fun onCleared() {
        generation++
        job?.cancel()
        command = null
        changeDescription = null
        paused = null
        mutableState.value = SourceControlState.Missing
    }
}

private const val MAX_CORRECTION_LENGTH = 2000
private const val CONTROL_REFRESH_TIMEOUT_MS = 195000L
