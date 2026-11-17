package io.github.dejitarunoseireinoapuri.kioku

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import io.github.dejitarunoseireinoapuri.kioku.feature.references.LocalReferenceEntry
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidAppearanceRepository
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidRepositories
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidVoiceHost
import io.github.dejitarunoseireinoapuri.kioku.platform.firebaseRepositories

class MainActivity : ComponentActivity() {
    private lateinit var repositories: AndroidRepositories

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        val factory = viewModelFactory { initializer { firebaseRepositories(this@MainActivity) } }
        repositories = ViewModelProvider(this, factory)[AndroidRepositories::class.java]
        repositories.attach(this)
        setContent {
            CompositionLocalProvider(
                LocalReferenceEntry provides {
                    startActivity(Intent(this@MainActivity, ReferenceImportActivity::class.java))
                },
            ) {
                AndroidVoiceHost {
                    KiokuApp(
                        repositories.account,
                        repositories.capture,
                        repositories.queries,
                        repositories.controls,
                        repositories.conversation,
                        remember { AndroidAppearanceRepository(applicationContext) },
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        repositories.detach(this)
        super.onDestroy()
    }
}
