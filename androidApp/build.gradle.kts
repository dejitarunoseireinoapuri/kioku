import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

val nativeConfiguration =
    Properties().apply {
        val source = file("firebase.local.properties")
        if (source.isFile) source.inputStream().use { load(it) }
    }

fun firebaseValue(name: String): String {
    val value = nativeConfiguration.getProperty(name, "")
    val pattern =
        when (name) {
            "firebaseAppId" -> "1:1008044927836:android:[a-fA-F0-9]+"
            "firebaseApiKey" -> "AIza[A-Za-z0-9_-]{35}"
            "googleWebClientId" -> "[0-9]+-[A-Za-z0-9_-]+\\.apps\\.googleusercontent\\.com"
            else -> error("Unknown native Firebase field")
        }
    require(value.isEmpty() || value.matches(Regex(pattern))) { "Invalid native Firebase field: $name (value omitted)" }
    return "\"$value\""
}

android {
    namespace = "io.github.dejitarunoseireinoapuri.kioku"
    compileSdk = 37
    defaultConfig {
        applicationId = "io.github.dejitarunoseireinoapuri.kioku"
        minSdk = 29
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "FIREBASE_APP_ID", firebaseValue("firebaseAppId"))
        buildConfigField("String", "FIREBASE_API_KEY", firebaseValue("firebaseApiKey"))
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", firebaseValue("googleWebClientId"))
    }
    buildTypes {
        debug { applicationIdSuffix = ".dev" }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    lint {
        warningsAsErrors = true
        abortOnError = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

dependencies {
    implementation(project(":shared"))
    implementation(libs.android.activity)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.functions)
    implementation(libs.firebase.appcheck)
    implementation(libs.credentials.core)
    implementation(libs.credentials.google)
    implementation(libs.googleid)
    androidTestImplementation(libs.android.test.runner)
    androidTestImplementation(libs.android.test.junit)
    androidTestImplementation(libs.compose.test)
    androidTestImplementation(libs.compose.foundation)
    debugImplementation(libs.compose.test.manifest)
}
