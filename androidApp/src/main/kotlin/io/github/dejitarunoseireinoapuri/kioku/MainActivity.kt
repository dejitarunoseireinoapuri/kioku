package io.github.dejitarunoseireinoapuri.kioku

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceImportResult
import io.github.dejitarunoseireinoapuri.kioku.feature.references.LocalReferenceEntry
import io.github.dejitarunoseireinoapuri.kioku.feature.references.LocalReferenceReader
import io.github.dejitarunoseireinoapuri.kioku.feature.references.LocalSharedSourceNotice
import io.github.dejitarunoseireinoapuri.kioku.feature.references.LocalSourceDelivery
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWork
import io.github.dejitarunoseireinoapuri.kioku.feature.references.SharedSourceNotice
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidAppearanceRepository
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidReferenceRepository
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidRepositories
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidVoiceHost
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceFileReader
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceSessionHost
import io.github.dejitarunoseireinoapuri.kioku.platform.firebaseRepositories

class MainActivity : ComponentActivity() {
    private lateinit var repositories: AndroidRepositories
    private lateinit var sharedSources: ReferenceSessionHost
    internal val referenceState get() =
        sharedSources.host.value
            ?.model
            ?.state

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(SystemBarStyle.dark(Color.TRANSPARENT), SystemBarStyle.dark(Color.TRANSPARENT))
        val factory = viewModelFactory { initializer { firebaseRepositories(this@MainActivity) } }
        repositories = ViewModelProvider(this, factory)[AndroidRepositories::class.java]
        repositories.attach(this)
        val sources = viewModelFactory { initializer { ReferenceSessionHost(repositories, contentResolver) } }
        sharedSources = ViewModelProvider(this, sources)[ReferenceSessionHost::class.java]
        setContent { Content() }
        if (savedInstanceState == null) receiveShare(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // A delivery is an event, not the identity of this retained chat Activity.
        receiveShare(intent)
    }

    private fun receiveShare(intent: Intent) {
        if (intent.action in setOf(Intent.ACTION_SEND, Intent.ACTION_SEND_MULTIPLE)) sharedSources.receive(intent)
    }

    @Composable
    private fun Content() {
        val delivery by sharedSources.delivery.collectAsState()
        CompositionLocalProvider(
            LocalReferenceEntry provides
                { startActivity(Intent(this@MainActivity, ReferenceImportActivity::class.java)) },
            LocalSourceDelivery provides delivery,
            LocalReferenceReader provides {
                repositories.references?.let {
                    AndroidReferenceRepository(it(), ReferenceFileReader(contentResolver))
                }
            },
            LocalSharedSourceNotice provides { ImportStatus() },
        ) { AppBody() }
    }

    @Composable
    private fun ImportStatus() {
        val host by sharedSources.host.collectAsState()
        val delivery by sharedSources.delivery.collectAsState()
        host?.let { current ->
            val state by current.model.state.collectAsState()
            val receiving by current.receiving.collectAsState()
            if (delivery > 0) {
                SharedSourceNotice(
                    if (receiving) state.copy(work = ReferenceWork.Receiving) else state,
                    { current.model.report(null) },
                    {
                        current.model.importFiles(
                            state.items.filter { it.result !is ReferenceImportResult.Stored }.map { it.input },
                        )
                    },
                )
            }
        }
    }

    @Composable
    private fun AppBody() {
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

    override fun onDestroy() {
        repositories.detach(this)
        super.onDestroy()
    }
}
