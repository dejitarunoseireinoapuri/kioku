package io.github.dejitarunoseireinoapuri.kioku.domain

/** A current authorized target shown locally before forgetting; never part of a stored receipt. */
data class ForgetPreview(
    val text: String,
    val scope: ForgetScope,
)

fun EditableSource.previewForget(
    ids: List<String>,
    scope: ForgetScope,
): ForgetPreview? {
    if (ids.isEmpty() || ids.distinct().size != ids.size) return null
    val selected = ids.mapNotNull { id -> items.find { it.id == id } }
    val text =
        if (scope == ForgetScope.Source && selected.size == items.size) {
            source.originalText
        } else {
            selected.joinToString("\n") { it.text }
        }
    return text.takeIf { selected.size == ids.size && it.isNotBlank() }?.let { ForgetPreview(it, scope) }
}
