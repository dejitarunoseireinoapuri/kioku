package io.github.dejitarunoseireinoapuri.kioku.platform

import android.content.Context
import androidx.core.content.edit
import io.github.dejitarunoseireinoapuri.kioku.domain.AppearanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class AndroidAppearanceRepository(
    context: Context,
    name: String = "appearance",
) : AppearanceRepository {
    private val preferences = context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)
    private val enabled = MutableStateFlow(preferences.getBoolean("falling_letters", true))
    override val fallingLetters = enabled.asStateFlow()

    override fun setFallingLetters(enabled: Boolean) {
        preferences.edit { putBoolean("falling_letters", enabled) }
        this.enabled.value = enabled
    }
}
