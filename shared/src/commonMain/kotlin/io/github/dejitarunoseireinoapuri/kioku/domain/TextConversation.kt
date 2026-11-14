package io.github.dejitarunoseireinoapuri.kioku.domain

enum class TextIntent { Tell, Ask }

enum class OfferDecision { Accept, Reject }

data class TextContext(
    val revision: Long = 0,
    val questions: List<String> = emptyList(),
    val sourceIds: List<String> = emptyList(),
)

data class TextWorkIds(
    val route: String,
    val action: String,
    val query: String,
)

data class PlanStamp(
    val revision: Long,
    val receivedAt: String,
    val expiresAt: Long,
)

sealed interface TextPlan {
    val stamp: PlanStamp

    data class Ask(
        override val stamp: PlanStamp,
    ) : TextPlan

    data class Tell(
        override val stamp: PlanStamp,
    ) : TextPlan

    data class Offer(
        override val stamp: PlanStamp,
        val fact: String,
        val alsoAsk: Boolean,
    ) : TextPlan

    data class Change(
        override val stamp: PlanStamp,
        val sourceId: String,
        val version: String,
        val memoryIds: List<String>,
        val action: ChangeAction,
        val correction: String?,
        val forgetScope: ForgetScope? = null,
    ) : TextPlan
}

/** Pending owner text and prepared plans remain exclusively in this account's in-memory session. */
data class TextCommand(
    val ids: TextWorkIds,
    val intent: TextIntent,
    val text: String,
    val zone: String,
    val context: TextContext,
    val plan: TextPlan? = null,
    val decision: OfferDecision? = null,
    val capture: CaptureCommand.Clarify? = null,
    val forgetApproval: ForgetPreview? = null,
)

sealed interface TextOutcome {
    data class Asked(
        val answer: QueryOutcome,
    ) : TextOutcome

    data class Captured(
        val capture: CaptureOutcome,
    ) : TextOutcome

    data class Offered(
        val fact: String,
        val answer: QueryOutcome? = null,
    ) : TextOutcome

    data class Clarification(
        val question: String,
    ) : TextOutcome

    data class Changed(
        val result: MemoryChange.Confirmed,
    ) : TextOutcome

    data class ConfirmForget(
        val preview: ForgetPreview,
    ) : TextOutcome

    data object ForgetCancelled : TextOutcome

    data class Failed(
        val issue: CaptureIssue,
    ) : TextOutcome

    data object Declined : TextOutcome

    data object Processing : TextOutcome

    data object RepeatRequired : TextOutcome

    data object Expired : TextOutcome
}

data class TextExecution(
    val command: TextCommand,
    val outcome: TextOutcome,
)

interface TextConversationRepository {
    fun prepare(
        text: String,
        intent: TextIntent,
        context: TextContext,
    ): TextCommand

    fun clarify(
        text: String,
        pending: CaptureOutcome.Clarification,
        intent: TextIntent,
        context: TextContext,
    ): TextCommand

    suspend fun execute(
        command: TextCommand,
        onPrepared: (TextCommand) -> Unit = {},
    ): TextExecution

    suspend fun source(id: String): MemorySource?

    suspend fun recoverCapture(command: TextCommand): CaptureOutcome
}
