plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.kotlin.android)
}

android {
    namespace = "com.aitrading.offlineai.benchmark"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.aitrading.offlineai.benchmark"
        minSdk = 33
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(17)
        compileOptions { targetCompatibility = JavaVersion.VERSION_17 }
    }

    packaging {
        jniLibs.useLegacyPackaging = true
    }
}

dependencies {
    implementation(project(":bridge"))
    implementation(libs.kotlinx.coroutines.android)
}
