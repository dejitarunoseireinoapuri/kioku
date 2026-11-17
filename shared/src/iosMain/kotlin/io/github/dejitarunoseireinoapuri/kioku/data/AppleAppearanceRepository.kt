package io.github.dejitarunoseireinoapuri.kioku.data

import io.github.dejitarunoseireinoapuri.kioku.domain.AppearanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import platform.Foundation.NSUserDefaults

class AppleAppearanceRepository : AppearanceRepository {
    private val preferences = NSUserDefaults.standardUserDefaults
    private val enabled =
        MutableStateFlow(
            if (preferences.objectForKey("falling_letters") ==
                null
            ) {
                true
            } else {
                preferences.boolForKey("falling_letters")
            },
        )
    override val fallingLetters = enabled.asStateFlow()

    override fun setFallingLetters(enabled: Boolean) {
        preferences.setBool(enabled, forKey = "falling_letters")
        this.enabled.value = enabled
    }
}
