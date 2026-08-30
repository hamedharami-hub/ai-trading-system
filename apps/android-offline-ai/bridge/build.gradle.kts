plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.jetbrains.kotlin.android)
}

android {
    namespace = "com.aitrading.offlineai"
    compileSdk = 36

    defaultConfig {
        minSdk = 33
        consumerProguardFiles("consumer-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(17)
        compileOptions { targetCompatibility = JavaVersion.VERSION_17 }
    }
}

dependencies {
    api(project(":llamaAndroid"))
    implementation(libs.androidx.core.ktx)
    testImplementation(libs.junit)
}
