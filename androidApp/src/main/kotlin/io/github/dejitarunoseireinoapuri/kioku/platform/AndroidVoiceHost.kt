package io.github.dejitarunoseireinoapuri.kioku.platform

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import io.github.dejitarunoseireinoapuri.kioku.di.LocalVoiceInput

@Composable
internal fun AndroidVoiceHost(content: @Composable () -> Unit) {
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
    val context = LocalContext.current.applicationContext
    val input = remember { AndroidVoiceInput(context, { permission.launch(Manifest.permission.RECORD_AUDIO) }) }
    DisposableEffect(input) { onDispose { input.close() } }
    LifecycleEventEffect(Lifecycle.Event.ON_PAUSE) { input.cancel() }
    CompositionLocalProvider(LocalVoiceInput provides input, content = content)
}
