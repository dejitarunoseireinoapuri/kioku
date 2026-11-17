package io.github.dejitarunoseireinoapuri.kioku.feature.references

import androidx.compose.runtime.staticCompositionLocalOf

/** Native sharing entry, supplied only on platforms with an authenticated document adapter. */
val LocalReferenceEntry = staticCompositionLocalOf<(() -> Unit)?> { null }
