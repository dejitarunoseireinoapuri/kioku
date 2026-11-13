package io.github.dejitarunoseireinoapuri.kioku

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import io.github.dejitarunoseireinoapuri.kioku.platform.firebaseAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.platform.firebaseCaptureRepository

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        val account = firebaseAccountRepository(this)
        val capture = firebaseCaptureRepository(this)
        setContent { KiokuApp(account, capture) }
    }
}
