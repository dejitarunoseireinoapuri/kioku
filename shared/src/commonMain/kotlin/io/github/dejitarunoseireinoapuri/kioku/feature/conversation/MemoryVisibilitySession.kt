package io.github.dejitarunoseireinoapuri.kioku.feature.conversation

import io.github.dejitarunoseireinoapuri.kioku.domain.MemoryControlRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

internal data class VisibilityResult(
    val revision: Long?,
    val resetContent: Boolean,
    val preserveDraft: Boolean,
)

/** A server revision gates presentation of private content after returning to the app. */
internal class MemoryVisibilitySession(
    private val repository: MemoryControlRepository?,
    private val scope: CoroutineScope,
    private val onChecking: (MemoryVisibility) -> Unit,
    private val onResolved: (VisibilityResult) -> Unit,
) {
    private var revision: Long? = null
    private var job: Job? = null
    private var generation = 0

    fun accept(value: Long) {
        generation++
        job?.cancel()
        revision = value
        onChecking(MemoryVisibility.Visible)
    }

    fun hide() {
        if (repository != null) {
            generation++
            job?.cancel()
            onChecking(MemoryVisibility.Hidden)
        }
    }

    fun acceptCapture(value: Long) {
        val previous = revision
        if (previous != null && value <= previous) return
        accept(value)
        onResolved(VisibilityResult(value, previous != null && value != previous + 1, false))
    }

    fun beforeSubmit(
        state: ConversationState,
        onReady: () -> Unit,
    ) {
        if (state.conversation != null) {
            if (state.canEdit) onReady()
        } else {
            check(preserveDraft = true, onReady = onReady)
        }
    }

    fun check(
        preserveDraft: Boolean = false,
        onReady: () -> Unit = {},
    ) {
        val controls = repository
        if (controls == null) {
            onReady()
            return
        }
        val epoch = ++generation
        job?.cancel()
        onChecking(if (preserveDraft) MemoryVisibility.Checking else MemoryVisibility.Hidden)
        job =
            scope.launch {
                val next = controls.revision()?.takeUnless { value -> revision?.let { value < it } == true }
                if (epoch != generation) return@launch
                val changed = next == null || (revision != null && next != revision)
                revision = next
                onResolved(VisibilityResult(next, changed, preserveDraft))
                onChecking(MemoryVisibility.Visible)
                if (next != null) onReady()
            }
    }
}
