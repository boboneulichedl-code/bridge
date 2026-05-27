plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.24"
    id("org.jetbrains.intellij.platform") version "2.2.1"
}

group = "com.coreai"
version = "2.3.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        androidStudio("2024.2.1.9")
        bundledPlugins("org.jetbrains.android")
    }
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.11.0")
}

kotlin {
    jvmToolchain(17)
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "242"
        }
    }
    signing {
        enabled = false
    }
    publishing {
        enabled = false
    }
}

tasks {
    buildSearchableOptions {
        enabled = false
    }
}
