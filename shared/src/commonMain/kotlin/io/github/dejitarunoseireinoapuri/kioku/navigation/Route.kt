package io.github.dejitarunoseireinoapuri.kioku.navigation

import androidx.navigation3.runtime.NavKey
import androidx.savedstate.serialization.SavedStateConfiguration
import kotlinx.serialization.Serializable
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.polymorphic
import kotlinx.serialization.modules.subclass

@Serializable
sealed interface Route : NavKey {
    @Serializable
    data object Conversation : Route

    @Serializable
    data object Settings : Route

    @Serializable
    data class Source(
        val id: String,
    ) : Route
}

val navigationConfiguration =
    SavedStateConfiguration {
        serializersModule =
            SerializersModule {
                polymorphic(NavKey::class) {
                    subclass(Route.Conversation::class, Route.Conversation.serializer())
                    subclass(Route.Settings::class, Route.Settings.serializer())
                    subclass(Route.Source::class, Route.Source.serializer())
                }
            }
    }
