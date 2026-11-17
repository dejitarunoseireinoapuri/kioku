package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.AppearanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MemoryAppearanceRepository : AppearanceRepository {
    private val enabled = MutableStateFlow(true)
    override val fallingLetters = enabled.asStateFlow()

    override fun setFallingLetters(enabled: Boolean) {
        this.enabled.value = enabled
    }
}
