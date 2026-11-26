package io.github.dejitarunoseireinoapuri.kioku

import io.github.dejitarunoseireinoapuri.kioku.platform.locationTrialRepositories

class LocationTrialActivity : MainActivity() {
    internal override fun createRepositories() = locationTrialRepositories(this)
}
