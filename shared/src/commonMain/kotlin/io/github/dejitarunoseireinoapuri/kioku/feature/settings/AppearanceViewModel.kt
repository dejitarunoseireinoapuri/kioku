package io.github.dejitarunoseireinoapuri.kioku.feature.settings

import androidx.lifecycle.ViewModel
import io.github.dejitarunoseireinoapuri.kioku.domain.AppearanceRepository

class AppearanceViewModel(
    private val repository: AppearanceRepository,
) : ViewModel() {
    val fallingLetters = repository.fallingLetters

    fun setFallingLetters(enabled: Boolean) = repository.setFallingLetters(enabled)
}
