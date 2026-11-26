package io.github.dejitarunoseireinoapuri.kioku.platform

import androidx.activity.ComponentActivity
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeCaptureRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeMemoryControlRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeQueryRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeTextConversationRepository

private const val APP = "kioku-location-trial"
private const val LOOPBACK = "127.0.0.1"
private const val AUTH_PORT = 9097
private const val FUNCTIONS_PORT = 5007

internal fun locationTrialRepositories(activity: ComponentActivity): AndroidRepositories {
    val context = activity.applicationContext
    val app = FirebaseApp.getApps(context).firstOrNull { it.name == APP } ?: createTrialApp(activity)
    val auth = FirebaseAuth.getInstance(app)
    val functions = FirebaseFunctions.getInstance(app, "europe-west1")
    val account = LocationTrialAccount(context, auth, functions)
    if (auth.currentUser == null) account.signIn {}
    val memory = AndroidMemoryPort(auth, functions)
    return AndroidRepositories(
        NativeAccountRepository(account),
        NativeCaptureRepository(memory),
        null,
        NativeQueryRepository(memory),
        NativeMemoryControlRepository(memory),
        NativeTextConversationRepository(memory),
    )
}

private fun createTrialApp(activity: ComponentActivity): FirebaseApp {
    val options =
        FirebaseOptions
            .Builder()
            .setProjectId("demo-kioku-local")
            .setApplicationId("1:123456789:android:1234567890abcdef")
            .setApiKey("fake-api-key")
            .build()
    return FirebaseApp.initializeApp(activity.applicationContext, options, APP).also { app ->
        FirebaseAuth.getInstance(app).useEmulator(LOOPBACK, AUTH_PORT)
        FirebaseFunctions.getInstance(app, "europe-west1").useEmulator(LOOPBACK, FUNCTIONS_PORT)
    }
}
