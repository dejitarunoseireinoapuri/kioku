package io.github.dejitarunoseireinoapuri.kioku

import androidx.compose.ui.window.ComposeUIViewController
import io.github.dejitarunoseireinoapuri.kioku.data.DisconnectedAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountPort
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountRepository

fun mainViewController(port: NativeAccountPort? = null) =
    (if (port == null) DisconnectedAccountRepository() else NativeAccountRepository(port)).let { repository ->
        ComposeUIViewController { KiokuApp(repository) }
    }
