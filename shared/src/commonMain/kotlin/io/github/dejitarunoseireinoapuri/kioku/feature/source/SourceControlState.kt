package io.github.dejitarunoseireinoapuri.kioku.feature.source

import io.github.dejitarunoseireinoapuri.kioku.domain.ChangeAction
import io.github.dejitarunoseireinoapuri.kioku.domain.EditableSource
import io.github.dejitarunoseireinoapuri.kioku.domain.ForgetPreview
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChange
import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryChangeDescription

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
        val related: List<EditableSource> = emptyList(),
        val notice: ChangeAction? = null,
        val description: MemoryChangeDescription? = null,
    ) : SourceControlState {
        val sources: List<EditableSource> get() = listOf(source) + related
    }

    data class Working(
        val previous: Ready,
        val action: ChangeAction,
    ) : SourceControlState

    data class Done(
        val result: MemoryChange.Confirmed,
        val description: MemoryChangeDescription? = null,
    ) : SourceControlState

    data class Refreshing(
        val result: MemoryChange.Confirmed,
        val description: MemoryChangeDescription? = null,
    ) : SourceControlState

    data class RefreshFailed(
        val result: MemoryChange.Confirmed,
        val description: MemoryChangeDescription? = null,
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
