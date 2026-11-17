package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.MemorySource
import io.github.dejitarunoseireinoapuri.kioku.domain.TextCommand
import io.github.dejitarunoseireinoapuri.kioku.domain.TextContext
import io.github.dejitarunoseireinoapuri.kioku.domain.TextConversationRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.TextExecution
import io.github.dejitarunoseireinoapuri.kioku.domain.TextIntent
import io.github.dejitarunoseireinoapuri.kioku.domain.TextOutcome
import io.github.dejitarunoseireinoapuri.kioku.domain.TextWorkIds
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceObserver

internal class VoiceUiFixture : VoiceInput {
    lateinit var observer: VoiceObserver
    var begins = 0
    var finishes = 0
    var cancels = 0
    var permissions = 0
    var issue: VoiceIssue? = null
    val finalText = "¿Qué plan ficticio tiene Nara?"

    override fun begin(observer: VoiceObserver) {
        this.observer = observer
        begins++
        val failure = issue
        if (failure == null) observer.ready() else observer.failed(failure)
    }

    override fun finish() {
        finishes++
        observer.completed(finalText)
    }

    override fun cancel() {
        cancels++
    }

    override fun requestPermission() {
        permissions++
    }
}

internal class VoiceTextFixture : TextConversationRepository {
    val commands = mutableListOf<TextCommand>()

    override fun prepare(
        text: String,
        intent: TextIntent,
        context: TextContext,
    ) = TextCommand(TextWorkIds("synthetic-route", "synthetic-action", "synthetic-query"), intent, text, "UTC", context)

    override fun clarify(
        text: String,
        pending: CaptureOutcome.Clarification,
        intent: TextIntent,
        context: TextContext,
    ) = prepare(text, intent, context)

    override suspend fun execute(
        command: TextCommand,
        onPrepared: (TextCommand) -> Unit,
    ): TextExecution {
        commands.add(command)
        return TextExecution(command, TextOutcome.Clarification("Pregunta ficticia recibida."))
    }

    override suspend fun source(id: String): MemorySource? = null

    override suspend fun recoverCapture(command: TextCommand): CaptureOutcome = CaptureOutcome.Unconfirmed
}
