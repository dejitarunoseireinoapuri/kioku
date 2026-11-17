package io.github.dejitarunoseireinoapuri.kioku.feature.voice

import androidx.lifecycle.ViewModel
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceInput
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceIssue
import io.github.dejitarunoseireinoapuri.kioku.domain.VoiceObserver
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class VoiceViewModel(
    private val input: VoiceInput,
) : ViewModel() {
    private val mutableState = MutableStateFlow<VoiceState>(VoiceState.Idle)
    val state = mutableState.asStateFlow()
    private var generation = 0
    private var textLimit = MAX_TEXT_LENGTH

    fun setTextLimit(limit: Int) {
        if (!state.value.busy) textLimit = limit.coerceIn(0, MAX_TEXT_LENGTH)
    }

    fun act(action: VoiceAction) {
        when (action) {
            VoiceAction.Press -> {
                begin()
            }

            VoiceAction.Release -> {
                if (!state.value.locked) finish()
            }

            VoiceAction.Lock -> {
                lock()
            }

            VoiceAction.Finish -> {
                finish()
            }

            VoiceAction.Cancel -> {
                cancel()
            }

            VoiceAction.Permission -> {
                input.requestPermission()
            }

            VoiceAction.KeepText -> {
                keepText()
            }

            VoiceAction.AccessibleToggle -> {
                if (state.value.busy) {
                    finish()
                } else {
                    begin()
                    lock()
                }
            }
        }
    }

    private fun begin() {
        if (state.value.busy || state.value is VoiceState.Completed) return
        val epoch = ++generation
        mutableState.value = VoiceState.Preparing()
        input.begin(
            object : VoiceObserver {
                override fun ready() {
                    if (epoch != generation) return
                    val current = state.value
                    if (current is VoiceState.Preparing) {
                        mutableState.value =
                            VoiceState.Listening(locked = current.locked)
                    }
                }

                override fun partial(text: String) {
                    if (epoch != generation) return
                    if (rejectOversized(text)) return
                    mutableState.value =
                        when (val current = state.value) {
                            is VoiceState.Listening -> current.copy(text = text)
                            is VoiceState.Finishing -> current.copy(text = text)
                            else -> current
                        }
                }

                override fun completed(text: String) {
                    if (epoch != generation) return
                    if (rejectOversized(text)) return
                    generation++
                    val finishing = state.value is VoiceState.Finishing
                    mutableState.value =
                        when {
                            !finishing -> VoiceState.Failed(VoiceIssue.Interrupted, text)
                            text.isBlank() -> VoiceState.Failed(VoiceIssue.NoSpeech)
                            else -> VoiceState.Completed(text)
                        }
                    input.cancel()
                }

                override fun failed(issue: VoiceIssue) {
                    if (epoch != generation) return
                    generation++
                    mutableState.value = VoiceState.Failed(issue, state.value.transcript)
                    input.cancel()
                }
            },
        )
    }

    private fun lock() {
        mutableState.value =
            when (val current = state.value) {
                is VoiceState.Preparing -> current.copy(locked = true)
                is VoiceState.Listening -> current.copy(locked = true)
                else -> current
            }
    }

    private fun rejectOversized(text: String): Boolean {
        if (text.length <= textLimit) return false
        generation++
        mutableState.value = VoiceState.Failed(VoiceIssue.TooLong, text.take(textLimit))
        input.cancel()
        return true
    }

    private fun finish() {
        if (!state.value.busy || state.value is VoiceState.Finishing) return
        mutableState.value = VoiceState.Finishing(state.value.transcript)
        input.finish()
    }

    private fun keepText() {
        val current = state.value as? VoiceState.Failed ?: return
        if (current.text.isNotBlank()) mutableState.value = VoiceState.Completed(current.text, submit = false)
    }

    fun consume() {
        if (state.value is VoiceState.Completed) mutableState.value = VoiceState.Idle
    }

    fun cancel() {
        generation++
        input.cancel()
        mutableState.value = VoiceState.Idle
    }

    override fun onCleared() {
        cancel()
    }

    private companion object {
        const val MAX_TEXT_LENGTH = 8000
    }
}
