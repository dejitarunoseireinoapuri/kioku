package io.github.dejitarunoseireinoapuri.kioku

import android.content.ClipData
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.net.toUri
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWork
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceActions
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceApp
import io.github.dejitarunoseireinoapuri.kioku.pilot.PilotHost
import java.util.UUID

/** Separate application ID and launcher: never constructs the owner's account or memory adapters. */
class ReferencePilotActivity : ComponentActivity() {
    private lateinit var host: PilotHost
    internal val referenceState get() = host.model.state
    private val picker =
        registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
            if (uris.isNotEmpty()) {
                host.receive(
                    Intent(Intent.ACTION_SEND_MULTIPLE).apply {
                        putParcelableArrayListExtra(Intent.EXTRA_STREAM, ArrayList(uris))
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    },
                )
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(SystemBarStyle.dark(Color.TRANSPARENT), SystemBarStyle.dark(Color.TRANSPARENT))
        val factory = viewModelFactory { initializer { PilotHost(contentResolver) } }
        host = ViewModelProvider(this, factory)[PilotHost::class.java]
        setContent {
            val state by host.model.state.collectAsState()
            val receiving by host.receiving.collectAsState()
            ReferenceWorkspaceApp(if (receiving) state.copy(work = ReferenceWork.Receiving) else state, actions())
        }
        if (savedInstanceState == null && intent.action in setOf(Intent.ACTION_SEND, Intent.ACTION_SEND_MULTIPLE)) {
            host.receive(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Consume this delivery as an event; the original launch intent remains the task's identity.
        host.receive(intent)
    }

    private fun actions(): ReferenceWorkspaceActions =
        object : ReferenceWorkspaceActions {
            override fun pick() =
                picker.launch(
                    arrayOf(
                        "text/plain",
                        "text/markdown",
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ),
                )

            override fun example() {
                val uris = ArrayList((0..3).map { "content://$packageName.samples/$it".toUri() })
                startActivity(
                    Intent(Intent.ACTION_SEND_MULTIPLE)
                        .setClass(this@ReferencePilotActivity, ReferencePilotActivity::class.java)
                        .setType("*/*")
                        .putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        .apply {
                            clipData =
                                ClipData.newRawUri("Ejemplos ficticios", uris.first()).apply {
                                    uris.drop(1).forEach { addItem(ClipData.Item(it)) }
                                }
                        },
                )
            }

            override fun refresh() = host.model.refresh()

            override fun question(text: String) = host.model.editQuestion(text)

            override fun web(text: String) = host.model.editWeb(text)

            override fun importWeb() = host.model.importWeb(UUID.randomUUID().toString())

            override fun select(source: ReferenceSummary?) {
                host.interrupt()
                host.model.select(source)
            }

            override fun read() = host.model.read()

            override fun ask() = host.model.ask()

            override fun previewForget(source: ReferenceSummary?) = host.model.previewForget(source)

            override fun confirmForget() = host.model.confirmForget()

            override fun interrupt() = host.interrupt()

            override fun retry() =
                host.model.importFiles(
                    host.model.state.value.items
                        .map { it.input },
                )
        }
}
