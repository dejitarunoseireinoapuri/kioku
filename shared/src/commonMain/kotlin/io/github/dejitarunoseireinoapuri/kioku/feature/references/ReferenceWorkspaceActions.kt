package io.github.dejitarunoseireinoapuri.kioku.feature.references

import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary

interface ReferenceWorkspaceActions {
    fun pick()

    fun example()

    fun refresh()

    fun question(text: String)

    fun web(text: String)

    fun importWeb()

    fun select(source: ReferenceSummary?)

    fun read()

    fun ask()

    fun previewForget(source: ReferenceSummary?)

    fun confirmForget()

    fun interrupt()

    fun retry()
}
