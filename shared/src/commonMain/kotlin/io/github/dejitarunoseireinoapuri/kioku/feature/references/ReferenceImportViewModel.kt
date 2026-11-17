package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountSession
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReferenceImportViewModel(
    private val repository: ReferenceImportRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ReferenceImportState())
    val state = mutableState.asStateFlow()
    private var session: AccountSession? = null
    private var generation = 0L
    private var job: Job? = null

    fun authorize(current: AccountSession?) {
        if (session?.id == current?.id && session?.generation == current?.generation) return
        cancel()
        session = current
    }

    fun receive(inputs: List<ReferenceInput>) {
        if (state.value.busy) {
            mutableState.value = state.value.copy(issue = ReferenceIssue.Busy)
            return
        }
        val problem = admissionIssue(inputs)
        if (problem != null) {
            mutableState.value = ReferenceImportState(issue = problem)
            return
        }
        val actor = requireNotNull(session)
        val accepted = inputs.toList()
        val epoch = ++generation
        mutableState.value = ReferenceImportState(accepted.map { ReferenceImportItem(it) }, accepted.first().id)
        job =
            viewModelScope.launch {
                for (input in accepted) {
                    if (epoch != generation) return@launch
                    mutableState.value = state.value.copy(readingId = input.id)
                    val result =
                        try {
                            repository.importSource(actor, input)
                        } catch (error: CancellationException) {
                            throw error
                        } catch (_: Exception) {
                            ReferenceImportResult.Failed(ReferenceIssue.Unavailable)
                        }
                    if (epoch != generation) return@launch
                    mutableState.value =
                        state.value.copy(
                            items =
                                state.value.items.map {
                                    if (it.input.id == input.id) it.copy(result = result) else it
                                },
                        )
                }
                mutableState.value = state.value.copy(readingId = null)
            }
    }

    private fun admissionIssue(inputs: List<ReferenceInput>): ReferenceIssue? =
        when {
            !repository.available -> ReferenceIssue.Unavailable

            session == null -> ReferenceIssue.SignInRequired

            inputs.isEmpty() || inputs.map { it.id }.distinct().size != inputs.size -> ReferenceIssue.Invalid

            inputs.size > MAX_FILES -> ReferenceIssue.TooLarge

            inputs.any {
                it.id.isBlank() || it.title.isBlank() || it.title.length > MAX_TITLE
            } -> ReferenceIssue.Invalid

            else -> null
        }

    fun cancel() {
        generation++
        job?.cancel()
        job = null
        mutableState.value = ReferenceImportState()
    }

    override fun onCleared() {
        cancel()
    }

    private companion object {
        const val MAX_FILES = 5
        const val MAX_TITLE = 200
    }
}
