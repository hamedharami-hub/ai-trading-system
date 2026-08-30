$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$wrapperRoot = Join-Path $repositoryRoot 'vendor\llama.cpp\examples\llama.android'
$wrapperJar = Join-Path $wrapperRoot 'gradle\wrapper\gradle-wrapper.jar'
$androidProject = Join-Path $repositoryRoot 'apps\android-offline-ai'

if (-not (Test-Path -LiteralPath $wrapperJar)) {
    throw 'Pinned llama.cpp submodule is missing. Run git submodule update --init --recursive.'
}

$java = Get-Command java -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $java) {
    $androidStudioJava = 'C:\Program Files\Android\Android Studio\jbr\bin\java.exe'
    if (Test-Path -LiteralPath $androidStudioJava) { $java = $androidStudioJava }
}
if (-not $java) { throw 'Java 17+ is required to build the Android bridge.' }

if (-not $env:ANDROID_HOME) {
    $installedSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
    if (Test-Path -LiteralPath $installedSdk) { $env:ANDROID_HOME = $installedSdk }
}
if (-not $env:ANDROID_HOME -or -not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
    throw 'Android SDK is required to build the Android bridge.'
}

& $java -classpath $wrapperJar org.gradle.wrapper.GradleWrapperMain -p $androidProject ':bridge:assembleDebug'
if ($LASTEXITCODE -ne 0) { throw "Android offline AI build failed with exit code $LASTEXITCODE" }
