import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.multiplatform)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.compose.multiplatform)
}

kotlin {
    android {
        namespace = "io.github.dejitarunoseireinoapuri.kioku.shared"
        compileSdk = 37
        minSdk = 29
        androidResources { enable = true }
        withHostTest { isIncludeAndroidResources = true }
        compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
    }
    iosArm64()
    iosSimulatorArm64()
    targets.withType<org.jetbrains.kotlin.gradle.plugin.mpp.KotlinNativeTarget>().configureEach {
        binaries.framework {
            baseName = "KiokuShared"
            isStatic = true
            binaryOption("bundleId", "io.github.dejitarunoseireinoapuri.kioku.shared")
        }
    }
    compilerOptions { allWarningsAsErrors.set(true) }
    sourceSets {
        commonMain.dependencies {
            implementation(libs.compose.runtime)
            implementation(libs.compose.foundation)
            implementation(libs.compose.material)
            implementation(libs.compose.ui)
            implementation(libs.compose.resources)
            implementation(libs.lifecycle.viewmodel)
            implementation(libs.lifecycle.runtime)
            implementation(libs.navigation.ui)
            implementation(libs.coroutines.core)
            implementation(libs.serialization.json)
            implementation(libs.koin.compose)
            implementation(libs.koin.viewmodel)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.coroutines.test)
        }
    }
}

compose.resources {
    publicResClass = true
    packageOfResClass = "io.github.dejitarunoseireinoapuri.kioku.resources"
}
