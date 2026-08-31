$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot

if ($repositoryRoot.Length -gt 32 -and $env:AITRADING_SHORT_ANDROID_BUILD -ne '1') {
    $shortRoot = Join-Path $env:USERPROFILE 'trade-build'
    if (Test-Path -LiteralPath $shortRoot) {
        throw "Short Android build path already exists: $shortRoot"
    }
    New-Item -ItemType Junction -Path $shortRoot -Target $repositoryRoot | Out-Null
    try {
        $env:AITRADING_SHORT_ANDROID_BUILD = '1'
        & (Join-Path $shortRoot 'scripts\build-android-offline-ai.ps1')
    }
    finally {
        Remove-Item Env:AITRADING_SHORT_ANDROID_BUILD -ErrorAction SilentlyContinue
        $junction = Get-Item -LiteralPath $shortRoot
        if ($junction.LinkType -ne 'Junction' -or $junction.Target -ne $repositoryRoot) {
            throw 'Refusing to remove an unexpected short build path'
        }
        Remove-Item -LiteralPath $shortRoot -Force
    }
    exit 0
}

$wrapperRoot = Join-Path $repositoryRoot 'vendor\llama.cpp\examples\llama.android'
$wrapperJar = Join-Path $wrapperRoot 'gradle\wrapper\gradle-wrapper.jar'
$androidProject = Join-Path $repositoryRoot 'apps\android-offline-ai'

if (-not (Test-Path -LiteralPath $wrapperJar)) {
    throw 'Pinned llama.cpp submodule is missing. Run git submodule update --init --recursive.'
}

$java = $null
if ($env:JAVA_HOME) {
    $configuredJava = Join-Path $env:JAVA_HOME 'bin\java.exe'
    if (Test-Path -LiteralPath $configuredJava) { $java = $configuredJava }
}
if (-not $java) {
    $java = Get-Command java -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
}
if (-not $java) {
    $androidStudioJava = 'C:\Program Files\Android\Android Studio\jbr\bin\java.exe'
    if (Test-Path -LiteralPath $androidStudioJava) { $java = $androidStudioJava }
}
if (-not $java) { throw 'Java 17 is required to build the Android bridge.' }
$javaVersion = (& $java -version 2>&1 | Select-Object -First 1) -join ''
if ($javaVersion -notmatch 'version "17\.') {
    throw "Java 17 is required by the pinned llamaAndroid build; detected: $javaVersion"
}

if (-not $env:ANDROID_HOME) {
    $installedSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
    if (Test-Path -LiteralPath $installedSdk) { $env:ANDROID_HOME = $installedSdk }
}
if (-not $env:ANDROID_HOME -or -not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
    throw 'Android SDK is required to build the Android bridge.'
}

& $java -classpath $wrapperJar org.gradle.wrapper.GradleWrapperMain -p $androidProject ':llamaAndroid:assembleDebug' ':bridge:assembleDebug' ':benchmark:assembleDebug'
if ($LASTEXITCODE -ne 0) { throw "Android offline AI build failed with exit code $LASTEXITCODE" }
