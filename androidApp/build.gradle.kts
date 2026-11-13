plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
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
    }
    buildTypes {
        debug { applicationIdSuffix = ".dev" }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true }
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
    androidTestImplementation(libs.android.test.runner)
    androidTestImplementation(libs.android.test.junit)
    androidTestImplementation(libs.compose.test)
    debugImplementation(libs.compose.test.manifest)
}
