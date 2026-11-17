package io.github.dejitarunoseireinoapuri.kioku.domain

enum class ReferenceFormat { Text, Markdown, Pdf, Docx, Web }

enum class ReferenceIssue {
    Unavailable,
    SignInRequired,
    Permission,
    Unsupported,
    TooLarge,
    Invalid,
    Interrupted,
    Busy,
    DriveLink,
}

data class ReferenceInput(
    val id: String,
    val title: String,
    val format: ReferenceFormat,
)

sealed interface ReferenceImportResult {
    data class Stored(
        val id: String,
        val revision: String,
        val fragments: Int,
        val partial: Boolean,
    ) : ReferenceImportResult

    data class Failed(
        val issue: ReferenceIssue,
    ) : ReferenceImportResult
}

/** The adapter owns reading and transfer. Only the authenticated server may confirm Stored. */
interface ReferenceImportRepository {
    val available: Boolean

    suspend fun importSource(
        session: AccountSession,
        input: ReferenceInput,
    ): ReferenceImportResult
}
