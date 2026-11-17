package io.github.dejitarunoseireinoapuri.kioku.domain

import kotlinx.coroutines.flow.StateFlow

/** Device-local decoration preference, independent of account and memory. */
interface AppearanceRepository {
    val fallingLetters: StateFlow<Boolean>

    fun setFallingLetters(enabled: Boolean)
}
