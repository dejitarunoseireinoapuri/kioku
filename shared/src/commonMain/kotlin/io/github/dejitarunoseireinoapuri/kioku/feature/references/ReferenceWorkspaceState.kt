package io.github.dejitarunoseireinoapuri.kioku.feature.references

import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceCitation
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary

enum class ReferenceWork { Loading, Receiving, Importing, Reading, Searching, Forgetting }

data class ReferenceWorkspaceState(
    val sources: List<ReferenceSummary> = emptyList(),
    val selected: ReferenceSummary? = null,
    val citations: List<ReferenceCitation> = emptyList(),
    val answer: String? = null,
    val detail: List<ReferenceCitation> = emptyList(),
    val question: String = "",
    val web: String = "",
    val items: List<ReferenceImportItem> = emptyList(),
    val webReceipt: ReferenceImportResult.Stored? = null,
    val work: ReferenceWork? = null,
    val issue: ReferenceIssue? = null,
    val searched: Boolean = false,
    val forgetTarget: ReferenceSummary? = null,
)
