package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceObserver
import io.github.dejitarunoseireinoapuri.kioku.feature.voice.VoiceAction
import io.github.dejitarunoseireinoapuri.kioku.feature.voice.VoiceState
import io.github.dejitarunoseireinoapuri.kioku.feature.voice.VoiceViewModel
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class VoiceViewModelTest {
    private val input = VoiceFixture()
    private val model = VoiceViewModel(input)

    @Test fun heldSpeechOnlyCompletesAfterRelease() {
        model.act(VoiceAction.Press)
        input.observer.ready()
        input.observer.partial("Plan ficticio")
        assertIs<VoiceState.Listening>(model.state.value)
        assertEquals(0, input.finishes)
        model.act(VoiceAction.Release)
        assertIs<VoiceState.Finishing>(model.state.value)
        input.observer.completed("Plan ficticio")
        assertEquals(VoiceState.Completed("Plan ficticio"), model.state.value)
    }

    @Test fun lockedSpeechSurvivesReleaseAndOnlyFinishesOnce() {
        model.act(VoiceAction.Press)
        model.act(VoiceAction.Lock)
        input.observer.ready()
        model.act(VoiceAction.Release)
        assertEquals(VoiceState.Listening(locked = true), model.state.value)
        assertEquals(0, input.finishes)
        model.act(VoiceAction.Finish)
        model.act(VoiceAction.Finish)
        assertEquals(1, input.finishes)
    }

    @Test fun cancellationRejectsLateAndPreviousSessionEvents() {
        model.act(VoiceAction.Press)
        val obsolete = input.observer
        model.cancel()
        obsolete.completed("Dato ficticio descartado")
        assertEquals(VoiceState.Idle, model.state.value)
        model.act(VoiceAction.Press)
        obsolete.ready()
        obsolete.failed(VoiceIssue.Interrupted)
        assertIs<VoiceState.Preparing>(model.state.value)
    }

    @Test fun earlyNativeCompletionNeverBecomesASubmittedMessage() {
        model.act(VoiceAction.Press)
        input.observer.ready()
        input.observer.completed("Intervención ficticia cortada")
        assertEquals(VoiceState.Failed(VoiceIssue.Interrupted, "Intervención ficticia cortada"), model.state.value)
    }

    @Test fun failureRetainsTextOnlyForExplicitEditingWithoutAutomaticSubmission() {
        model.act(VoiceAction.Press)
        input.observer.ready()
        input.observer.partial("Texto ficticio parcial")
        input.observer.failed(VoiceIssue.Interrupted)
        model.act(VoiceAction.KeepText)
        assertEquals(VoiceState.Completed("Texto ficticio parcial", submit = false), model.state.value)
        model.consume()
        assertEquals(VoiceState.Idle, model.state.value)
    }

    @Test fun missingPermissionDoesNotStartAgainUntilAnotherGesture() {
        model.act(VoiceAction.Press)
        input.observer.failed(VoiceIssue.Permission)
        model.act(VoiceAction.Permission)
        assertEquals(1, input.permissions)
        assertEquals(1, input.begins)
        assertEquals(VoiceState.Failed(VoiceIssue.Permission), model.state.value)
    }

    @Test fun blankFinalTextDoesNotProduceAMessage() {
        model.act(VoiceAction.Press)
        input.observer.ready()
        model.act(VoiceAction.Release)
        input.observer.completed("  ")
        assertEquals(VoiceState.Failed(VoiceIssue.NoSpeech), model.state.value)
    }

    @Test fun accessibilityStartsLockedAndStopsOnTheNextActivation() {
        model.act(VoiceAction.AccessibleToggle)
        input.observer.ready()
        assertEquals(VoiceState.Listening(locked = true), model.state.value)
        model.act(VoiceAction.AccessibleToggle)
        assertIs<VoiceState.Finishing>(model.state.value)
        assertEquals(1, input.finishes)
    }

    @Test fun quickReleaseAndLateReadyNeverReopenTheMicrophoneState() {
        model.act(VoiceAction.Press)
        model.act(VoiceAction.Release)
        input.observer.ready()
        assertIs<VoiceState.Finishing>(model.state.value)
        input.observer.completed("Prueba ficticia")
        input.observer.failed(VoiceIssue.Interrupted)
        assertEquals(VoiceState.Completed("Prueba ficticia"), model.state.value)
    }

    @Test fun oversizedFinalTextNeverSubmitsATruncatedMessage() {
        model.setTextLimit(5)
        model.act(VoiceAction.Press)
        input.observer.ready()
        model.act(VoiceAction.Release)
        input.observer.completed("Nara ficticia")
        assertEquals(VoiceState.Failed(VoiceIssue.TooLong, "Nara "), model.state.value)
        model.act(VoiceAction.KeepText)
        assertEquals(VoiceState.Completed("Nara ", submit = false), model.state.value)
    }

    @Test fun oversizedPartialStopsAndRejectsLateFinal() {
        model.setTextLimit(5)
        model.act(VoiceAction.Press)
        input.observer.ready()
        input.observer.partial("Nara ficticia")
        input.observer.completed("Nara ficticia")
        assertEquals(VoiceState.Failed(VoiceIssue.TooLong, "Nara "), model.state.value)
    }
}

private class VoiceFixture : VoiceInput {
    lateinit var observer: VoiceObserver
    var begins = 0
    var finishes = 0
    var permissions = 0

    override fun begin(observer: VoiceObserver) {
        begins++
        this.observer = observer
    }

    override fun finish() {
        finishes++
    }

    override fun cancel() = Unit

    override fun requestPermission() {
        permissions++
    }
}
