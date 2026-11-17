package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceFailure
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceWorkspaceRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReferenceWorkspaceViewModel(
    private val repository: ReferenceWorkspaceRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ReferenceWorkspaceState())
    val state = mutableState.asStateFlow()
    private var job: Job? = null
    private var generation = 0L

    fun refresh() = run(ReferenceWork.Loading) { load(it) }

    fun editQuestion(text: String) {
        if (state.value.work == ReferenceWork.Searching) interrupt()
        if (text.length <=
            MAX_QUESTION
        ) {
            mutableState.value =
                state.value.copy(question = text, searched = false, citations = emptyList())
        }
    }

    fun editWeb(text: String) {
        if (text.length <= MAX_URL) mutableState.value = state.value.copy(web = text)
    }

    fun importFiles(inputs: List<ReferenceInput>) {
        if (state.value.work != null) return report(ReferenceIssue.Busy)
        if (inputs.isEmpty() || inputs.size > MAX_FILES) return report(ReferenceIssue.TooLarge)
        val snapshot = inputs.toList()
        mutableState.value = state.value.copy(items = snapshot.map { ReferenceImportItem(it) })
        run(ReferenceWork.Importing) { epoch ->
            for (input in snapshot) {
                val result = repository.importFile(input)
                if (generation != epoch) return@run
                commit(epoch) {
                    it.copy(
                        items =
                            it.items.map {
                                if (it.input.id == input.id) it.copy(result = result) else it
                            },
                    )
                }
            }
            load(epoch)
        }
    }

    fun importWeb(requestId: String) =
        run(ReferenceWork.Importing) { epoch ->
            val result = repository.importWeb(state.value.web, requestId)
            if (result is ReferenceImportResult.Failed) throw ReferenceFailure(result.issue)
            load(epoch)
        }

    fun select(source: ReferenceSummary?) {
        interrupt()
        mutableState.value =
            state.value.copy(selected = source, citations = emptyList(), detail = emptyList(), searched = false)
    }

    fun read() {
        val source = state.value.selected ?: return
        run(ReferenceWork.Reading) { epoch ->
            val detail = repository.read(source)
            commit(epoch) { it.copy(detail = detail) }
        }
    }

    fun ask() {
        val question = state.value.question.trim()
        val source = state.value.selected?.id
        if (question.isEmpty()) return
        if (state.value.work == null) mutableState.value = state.value.copy(citations = emptyList(), searched = false)
        run(ReferenceWork.Searching) { epoch ->
            val citations = repository.query(question, source)
            commit(epoch) { it.copy(citations = citations, searched = true, detail = emptyList()) }
        }
    }

    fun previewForget(source: ReferenceSummary?) {
        mutableState.value = state.value.copy(forgetTarget = source)
    }

    fun confirmForget() {
        val source = state.value.forgetTarget ?: return
        mutableState.value = state.value.copy(forgetTarget = null)
        run(ReferenceWork.Forgetting) { epoch ->
            repository.forget(source)
            commit(epoch) {
                it.copy(
                    selected = null,
                    citations = emptyList(),
                    detail = emptyList(),
                    searched = false,
                    items =
                        it.items.filterNot { item ->
                            (item.result as? ReferenceImportResult.Stored)?.id == source.id
                        },
                )
            }
            load(epoch)
        }
    }

    fun report(issue: ReferenceIssue) {
        mutableState.value = state.value.copy(issue = issue)
    }

    fun interrupt() {
        generation++
        job?.cancel()
        mutableState.value = state.value.copy(work = null)
    }

    private suspend fun load(epoch: Long) {
        val sources = repository.catalog()
        commit(epoch) { current ->
            current.copy(
                sources = sources,
                citations =
                    current.citations.filter { citation ->
                        sources.any {
                            it.id == citation.sourceId &&
                                it.revision == citation.revision
                        }
                    },
                detail =
                    current.detail.filter { citation ->
                        sources.any {
                            it.id == citation.sourceId &&
                                it.revision == citation.revision
                        }
                    },
                selected =
                    sources.find {
                        it.id ==
                            current.selected?.id
                    },
            )
        }
    }

    private fun run(
        work: ReferenceWork,
        block: suspend (Long) -> Unit,
    ) {
        if (state.value.work != null) return report(ReferenceIssue.Busy)
        val epoch = ++generation
        mutableState.value = state.value.copy(work = work, issue = null)
        job =
            viewModelScope.launch {
                try {
                    block(epoch)
                } catch (
                    error: CancellationException,
                ) {
                    throw error
                } catch (
                    error: ReferenceFailure,
                ) {
                    if (generation == epoch) report(error.issue)
                } catch (
                    _: Exception,
                ) {
                    if (generation == epoch) report(ReferenceIssue.Unavailable)
                } finally {
                    if (generation == epoch) mutableState.value = state.value.copy(work = null)
                }
            }
    }

    private fun commit(
        epoch: Long,
        transform: (ReferenceWorkspaceState) -> ReferenceWorkspaceState,
    ) {
        if (generation == epoch) mutableState.value = transform(state.value)
    }

    private companion object {
        const val MAX_QUESTION = 2000
        const val MAX_URL = 4096
        const val MAX_FILES = 5
    }
}
