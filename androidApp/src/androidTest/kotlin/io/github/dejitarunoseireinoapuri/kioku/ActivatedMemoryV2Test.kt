package io.github.dejitarunoseireinoapuri.kioku

import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.platform.AndroidMemoryPort
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assume.assumeTrue
import org.junit.Test

/** Opt-in metadata check: never captures, queries, corrects or calls an AI provider. */
class ActivatedMemoryV2Test {
    @Test
    fun installedClientReachesTheEmptyV2GenerationWithItsExistingAccount() {
        assumeTrue(InstrumentationRegistry.getArguments().getString("activatedV2Project") == "kioku-9454f")
        ActivityScenario.launch(MainActivity::class.java).use {
            val app = FirebaseApp.getInstance("kioku")
            assertEquals("kioku-9454f", app.options.projectId)
            val auth = FirebaseAuth.getInstance(app)
            assertNotNull(auth.currentUser)
            val controls =
                NativeMemoryControlRepository(
                    AndroidMemoryPort(auth, FirebaseFunctions.getInstance(app, "europe-west1")),
                )
            runBlocking { assertEquals(0L, controls.revision()) }
        }
    }
}
