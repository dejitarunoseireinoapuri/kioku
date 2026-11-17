param([switch]$Verify)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$kiokuRoot = Split-Path -Parent $PSScriptRoot
$kiokuNode = (Get-Command node -ErrorAction Stop).Source
if ((& $kiokuNode --version) -notmatch '^v24\.') { throw 'Use the project Node 24 tooling.' }
$kiokuJava = $env:JAVA_HOME
if (-not $kiokuJava) {
    $kiokuCandidates = @(Get-ChildItem -LiteralPath (Join-Path $kiokuRoot '.setup/k0-jdk') -Directory)
    if ($kiokuCandidates.Count -ne 1) { throw 'Configure the project JDK.' }
    $kiokuJava = $kiokuCandidates[0].FullName
}
$kiokuPrevious = @{}
foreach ($kiokuName in @('PATH', 'JAVA_HOME', 'KIOKU_TEST_NODE', 'KIOKU_REFERENCE_VERIFY', 'FIREBASE_EMULATORS_PATH', 'CI', 'METADATA_SERVER_DETECTION')) {
    $kiokuPrevious[$kiokuName] = [Environment]::GetEnvironmentVariable($kiokuName, 'Process')
}
try {
    $env:JAVA_HOME = $kiokuJava
    $env:PATH = (Join-Path $kiokuJava 'bin') + ';' + $env:PATH
    $env:KIOKU_TEST_NODE = $kiokuNode
    $env:KIOKU_REFERENCE_VERIFY = if ($Verify) { '1' } else { '0' }
    $env:FIREBASE_EMULATORS_PATH = Join-Path $kiokuRoot '.setup/firebase-emulators'
    $env:CI = 'true'
    $env:METADATA_SERVER_DETECTION = 'none'
    Push-Location -LiteralPath $kiokuRoot
    try {
        & $kiokuNode backend/node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --config firebase.references.json --project demo-kioku-sources --only auth,firestore 'node tooling/run-reference-pilot.mjs'
        if ($LASTEXITCODE -ne 0) { throw 'Reference pilot failed; inspect safe test results.' }
    } finally { Pop-Location }
} finally {
    foreach ($kiokuName in $kiokuPrevious.Keys) {
        [Environment]::SetEnvironmentVariable($kiokuName, $kiokuPrevious[$kiokuName], 'Process')
    }
}
