package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText

internal fun memoryItemContaining(text: String): SemanticsMatcher =
    hasAnyAncestor(
        SemanticsMatcher("Memory item row") {
            it.config.getOrNull(SemanticsProperties.TestTag)?.startsWith("memory-item-") == true
        } and hasAnyDescendant(hasText(text, substring = true, ignoreCase = true)),
    )
