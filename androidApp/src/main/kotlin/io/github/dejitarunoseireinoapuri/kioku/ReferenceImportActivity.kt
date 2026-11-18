package io.github.dejitarunoseireinoapuri.kioku

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import io.github.dejitarunoseireinoapuri.kioku.design.KiokuTheme
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceSummary
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountScreen
import io.github.dejitarunoseireinoapuri.kioku.feature.account.AccountState
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWork
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceActions
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceWorkspaceApp
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.AppearanceSettingsState
import io.github.dejitarunoseireinoapuri.kioku.feature.settings.LocalAppearanceSettings
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidAppearanceRepository
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidReferenceHost
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidRepositories
import io.github.dejitarunoseireinoapuri.kioku.platform.ReferenceSessionHost
import io.github.dejitarunoseireinoapuri.kioku.platform.firebaseRepositories

/** Production share entry using the same Google account and backend as Kioku. */
class ReferenceImportActivity : ComponentActivity() {
    private lateinit var session: ReferenceSessionHost
    private lateinit var repositories: AndroidRepositories
    internal val referenceState get() =
        session.host.value
            ?.model
            ?.state
    private val picker =
        registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
            if (uris.isNotEmpty()) {
                session.receive(
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
        val repositoriesFactory =
            viewModelFactory { initializer { firebaseRepositories(this@ReferenceImportActivity) } }
        repositories = ViewModelProvider(this, repositoriesFactory)[AndroidRepositories::class.java]
        repositories.attach(this)
        val factory = viewModelFactory { initializer { ReferenceSessionHost(repositories, contentResolver) } }
        session = ViewModelProvider(this, factory)[ReferenceSessionHost::class.java]
        setContent { Content() }
        if (savedInstanceState == null && intent.action in setOf(Intent.ACTION_SEND, Intent.ACTION_SEND_MULTIPLE)) {
            session.receive(intent)
        }
    }

    @androidx.compose.runtime.Composable
    private fun Content() {
        val account by session.account.state.collectAsState()
        val host by session.host.collectAsState()
        val appearance = remember { AndroidAppearanceRepository(applicationContext) }
        val rain by appearance.fallingLetters.collectAsState(initial = true)
        CompositionLocalProvider(
            LocalAppearanceSettings provides AppearanceSettingsState(rain, appearance::setFallingLetters),
        ) {
            KiokuTheme {
                val current = host
                if (account is AccountState.Authorized && current != null) {
                    val state by current.model.state.collectAsState()
                    val receiving by current.receiving.collectAsState()
                    ReferenceWorkspaceApp(
                        if (receiving) {
                            state.copy(work = ReferenceWork.Receiving)
                        } else {
                            state
                        },
                        actions(current),
                        pilot = false,
                    )
                } else {
                    AccountScreen(
                        account,
                        session.account::signIn,
                        session.account::retry,
                        session.account::signOut,
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Consume this delivery as an event; the original launch intent remains the task's identity.
        session.receive(intent)
    }

    override fun onDestroy() {
        repositories.detach(this)
        super.onDestroy()
    }

    private fun actions(host: AndroidReferenceHost): ReferenceWorkspaceActions =
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

            override fun example() = Unit

            override fun refresh() = host.model.refresh()

            override fun question(text: String) = host.model.editQuestion(text)

            override fun web(text: String) = host.model.editWeb(text)

            override fun importWeb() =
                host.model.importWeb(
                    java.util.UUID
                        .randomUUID()
                        .toString(),
                )

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
