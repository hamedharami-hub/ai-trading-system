$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$installRoot = Join-Path $repositoryRoot 'models\offline-ai'
$runtimeRoot = Join-Path $installRoot 'runtime-b10621-cpu'
$runtimeArchive = Join-Path $installRoot 'llama-b10621-bin-win-cpu-x64.zip'
$modelPath = Join-Path $installRoot 'Qwen3.5-0.8B-Q4_0.gguf'

$runtimeUrl = 'https://github.com/ggml-org/llama.cpp/releases/download/b10621/llama-b10621-bin-win-cpu-x64.zip'
$runtimeSha256 = '0e8b65e650e369f70f8307d890508886f171ef4fb00facccddd4a1b7ffdaca51'
$runtimeSize = 18068018
$modelUrl = 'https://huggingface.co/ggml-org/Qwen3.5-0.8B-GGUF/resolve/8fea620810c4afa23dd6443f999a48574c1611a3/Qwen3.5-0.8B-Q4_0.gguf'
$modelSha256 = '57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf'
$modelSize = 563036064

New-Item -ItemType Directory -Force -Path $installRoot | Out-Null

function Receive-VerifiedArtifact([string]$Uri, [string]$Destination, [long]$ExpectedSize, [string]$ExpectedSha256) {
    if (-not (Test-Path -LiteralPath $Destination)) {
        Invoke-WebRequest -Uri $Uri -OutFile $Destination
    }
    $actualSize = (Get-Item -LiteralPath $Destination).Length
    if ($actualSize -ne $ExpectedSize) {
        throw "Size verification failed for $Destination"
    }
    $actual = (Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $ExpectedSha256) {
        throw "SHA-256 verification failed for $Destination"
    }
}

Receive-VerifiedArtifact $runtimeUrl $runtimeArchive $runtimeSize $runtimeSha256
Receive-VerifiedArtifact $modelUrl $modelPath $modelSize $modelSha256

if (-not (Test-Path -LiteralPath $runtimeRoot)) {
    Expand-Archive -LiteralPath $runtimeArchive -DestinationPath $runtimeRoot
}

$llamaCli = Get-ChildItem -LiteralPath $runtimeRoot -Recurse -File -Filter 'llama-cli.exe' | Select-Object -First 1
if (-not $llamaCli) { throw 'Verified runtime archive does not contain llama-cli.exe' }

[pscustomobject]@{
    Runtime = $llamaCli.FullName
    Model = $modelPath
    ModelSha256 = $modelSha256
}
