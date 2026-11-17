package io.github.dejitarunoseireinoapuri.kioku

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import io.github.dejitarunoseireinoapuri.kioku.domain.ReferenceIssue
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportApp
import io.github.dejitarunoseireinoapuri.kioku.feature.references.ReferenceImportState

/** Fail-closed entry until the authenticated import transport is activated separately. */
class ReferenceImportActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ReferenceImportApp(ReferenceImportState(issue = ReferenceIssue.Unavailable), ::finish)
        }
    }
}
