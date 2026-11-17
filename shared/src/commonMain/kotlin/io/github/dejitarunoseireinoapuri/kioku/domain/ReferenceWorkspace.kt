package io.github.dejitarunoseireinoapuri.kioku.domain

data class ReferenceSummary(
    val id: String,
    val revision: String,
    val title: String,
    val partial: Boolean,
    val fragments: Int,
)

data class ReferenceCitation(
    val sourceId: String,
    val revision: String,
    val title: String,
    val location: String,
    val number: Int,
    val text: String,
    val url: String? = null,
)

class ReferenceFailure(
    val issue: ReferenceIssue,
) : RuntimeException(issue.name)

data class ReferenceAnswer(
    val text: String?,
    val citations: List<ReferenceCitation>,
)

/** Server-confirmed text sources only. Pilot and production composition are separate. */
interface ReferenceWorkspaceRepository {
    suspend fun catalog(): List<ReferenceSummary>

    suspend fun importFile(input: ReferenceInput): ReferenceImportResult

    suspend fun importWeb(
        url: String,
        requestId: String,
    ): ReferenceImportResult

    suspend fun read(source: ReferenceSummary): List<ReferenceCitation>

    suspend fun query(
        question: String,
        sourceId: String?,
    ): ReferenceAnswer

    suspend fun forget(source: ReferenceSummary)
}
