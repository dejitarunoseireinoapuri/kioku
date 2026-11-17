package io.github.dejitarunoseireinoapuri.kioku.feature.references

import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue

data class ReferenceImportItem(
    val input: ReferenceInput,
    val result: ReferenceImportResult? = null,
)

data class ReferenceImportState(
    val items: List<ReferenceImportItem> = emptyList(),
    val readingId: String? = null,
    val issue: ReferenceIssue? = null,
) {
    val busy: Boolean get() = readingId != null
}
