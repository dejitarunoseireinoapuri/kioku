import dev.detekt.gradle.Detekt
import org.gradle.api.attributes.Bundling
import org.gradle.process.CommandLineArgumentProvider

plugins {
    id("jvm-toolchains")
    alias(libs.plugins.kotlin.multiplatform) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.multiplatform) apply false
    alias(libs.plugins.compose.multiplatform) apply false
    alias(libs.plugins.detekt)
}

detekt {
    buildUponDefaultConfig = true
    config.setFrom(files("config/detekt/detekt.yml"))
}

tasks.named<Detekt>("detekt") {
    setSource(files("shared/src", "androidApp/src"))
    include("**/*.kt")
    exclude("**/build/**")
}

val ktlint by configurations.creating {
    attributes { attribute(Bundling.BUNDLING_ATTRIBUTE, objects.named(Bundling.SHADOWED)) }
}

tasks.withType<JavaExec>().configureEach {
    javaLauncher.set(javaToolchains.launcherFor { languageVersion.set(JavaLanguageVersion.of(21)) })
}
dependencies { ktlint("com.pinterest.ktlint:ktlint-cli:${libs.versions.ktlint.get()}") }

val kotlinFormatFiles =
    files(
        fileTree("shared/src") { include("**/*.kt") },
        fileTree("androidApp/src") { include("**/*.kt") },
        allprojects.map { it.buildFile }.filter { it.extension == "kts" },
        file("settings.gradle.kts"),
    )

val kotlinFormatArguments =
    CommandLineArgumentProvider { kotlinFormatFiles.files.sortedBy { it.path }.map { it.absolutePath } }

tasks.register<JavaExec>("formatCheck") {
    group = "verification"
    description = "Checks hand-written Kotlin and Gradle Kotlin scripts."
    classpath = ktlint
    mainClass.set("com.pinterest.ktlint.Main")
    argumentProviders.add(kotlinFormatArguments)
}

tasks.register<JavaExec>("formatKotlin") {
    group = "formatting"
    classpath = ktlint
    mainClass.set("com.pinterest.ktlint.Main")
    args("--format")
    argumentProviders.add(kotlinFormatArguments)
}

allprojects {
    dependencyLocking { lockAllConfigurations() }
}

tasks.register<Exec>("checkArchitecture") {
    group = "verification"
    commandLine("node", "tooling/check-mobile-architecture.mjs")
}

tasks.register("mobileCheck") {
    group = "verification"
    description = "Runs mobile formatting, architecture, static analysis, host tests and Android Lint."
    dependsOn("formatCheck", "checkArchitecture", "detekt", ":shared:testAndroidHostTest", ":androidApp:lintDebug")
}
