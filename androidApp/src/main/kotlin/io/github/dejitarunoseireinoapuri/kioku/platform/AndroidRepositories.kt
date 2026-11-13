package io.github.dejitarunoseireinoapuri.kioku.platform

import androidx.activity.ComponentActivity
import androidx.lifecycle.ViewModel
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.CaptureRepository

/** Native dependencies share the Activity's retained lifetime without retaining an Activity instance. */
internal class AndroidRepositories(
    val account: AccountRepository,
    val capture: CaptureRepository?,
    private val accountPort: AndroidAccountPort?,
) : ViewModel() {
    fun attach(activity: ComponentActivity) = accountPort?.attach(activity)

    fun detach(activity: ComponentActivity) = accountPort?.detach(activity)
}
