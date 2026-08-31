pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "TradeOfflineAi"
include(":bridge")
include(":benchmark")
include(":llamaAndroid")
project(":llamaAndroid").projectDir = file("../../vendor/llama.cpp/examples/llama.android/lib")
