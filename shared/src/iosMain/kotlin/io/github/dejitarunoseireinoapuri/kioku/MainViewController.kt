package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.window.ComposeUIViewController
import io.github.dejitarunoseireinoapuri.kioku.data.DisconnectedAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryPort

fun mainViewController(
    port: NativeAccountPort? = null,
    memoryPort: NativeMemoryPort? = null,
) = (if (port == null) DisconnectedAccountRepository() else NativeAccountRepository(port)).let { repository ->
    val captures = memoryPort?.let(::NativeCaptureRepository)
    ComposeUIViewController { KiokuApp(repository, captures) }
}
