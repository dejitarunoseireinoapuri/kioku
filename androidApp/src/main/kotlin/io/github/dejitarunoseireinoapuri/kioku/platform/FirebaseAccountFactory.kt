package io.github.dejitarunoseireinoapuri.kioku.platform

import androidx.activity.ComponentActivity
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import io.github.dejitarunoseireinoapuri.kioku.BuildConfig
import io.github.dejitarunoseireinoapuri.kioku.data.DisconnectedAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.data.NativeAccountRepository
import io.github.dejitarunoseireinoapuri.kioku.domain.AccountRepository

fun firebaseAccountRepository(activity: ComponentActivity): AccountRepository {
    if (BuildConfig.FIREBASE_APP_ID.isBlank() || BuildConfig.FIREBASE_API_KEY.isBlank() ||
        !BuildConfig.GOOGLE_WEB_CLIENT_ID.endsWith(".apps.googleusercontent.com")
    ) {
        return DisconnectedAccountRepository()
    }
    val options =
        FirebaseOptions
            .Builder()
            .setProjectId("kioku-9454f")
            .setGcmSenderId("1008044927836")
            .setApplicationId(BuildConfig.FIREBASE_APP_ID)
            .setApiKey(BuildConfig.FIREBASE_API_KEY)
            .build()
    val app =
        FirebaseApp.getApps(activity).find { it.name == "kioku" }
            ?: FirebaseApp.initializeApp(activity.applicationContext, options, "kioku")
    FirebaseAppCheck.getInstance(app).installAppCheckProviderFactory(PlayIntegrityAppCheckProviderFactory.getInstance())
    return NativeAccountRepository(
        AndroidAccountPort(activity, FirebaseAuth.getInstance(app), FirebaseFunctions.getInstance(app, "europe-west1")),
    )
}
