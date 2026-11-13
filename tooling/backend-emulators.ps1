param([string]$FunctionsNode = '', [switch]$LiveCaptureSmoke)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$kiokuRoot = Split-Path -Parent $PSScriptRoot
if (-not $FunctionsNode) {
    $FunctionsNode = Join-Path $kiokuRoot '.setup/k1-node/node-v22.23.5-win-x64/node.exe'
}
if (-not (Test-Path -LiteralPath $FunctionsNode -PathType Leaf)) {
    throw 'Provide -FunctionsNode with an official Node 22 executable.'
}
if ((& $FunctionsNode --version) -notmatch '^v22\.') { throw 'Functions requires Node 22.' }
$kiokuTestNode = (Get-Command node -ErrorAction Stop).Source
if ((& $kiokuTestNode --version) -notmatch '^v24\.') { throw 'The test tooling requires Node 24.' }
$kiokuJava = $env:JAVA_HOME
if (-not $kiokuJava -or -not (Test-Path -LiteralPath (Join-Path $kiokuJava 'bin/java.exe'))) {
    $kiokuCandidates = @(Get-ChildItem -LiteralPath (Join-Path $kiokuRoot '.setup/k0-jdk') -Directory)
    if ($kiokuCandidates.Count -ne 1) { throw 'Configure JAVA_HOME with JDK 21 or newer.' }
    $kiokuJava = $kiokuCandidates[0].FullName
}
$kiokuPrevious = @{}
foreach ($kiokuName in @('PATH', 'JAVA_HOME', 'KIOKU_TEST_NODE', 'FIREBASE_EMULATORS_PATH', 'CI', 'METADATA_SERVER_DETECTION')) {
    $kiokuPrevious[$kiokuName] = [Environment]::GetEnvironmentVariable($kiokuName, 'Process')
}
try {
    $env:PATH = (Split-Path -Parent $FunctionsNode) + ';' + (Join-Path $kiokuJava 'bin') + ';' + $env:PATH
    $env:JAVA_HOME = $kiokuJava
    $env:KIOKU_TEST_NODE = $kiokuTestNode
    $env:FIREBASE_EMULATORS_PATH = Join-Path $kiokuRoot '.setup/firebase-emulators'
    $env:CI = 'true'
    # The guarded demo runs on this PC, never on a GCE metadata server.
    $env:METADATA_SERVER_DETECTION = 'none'
    Push-Location -LiteralPath $kiokuRoot
    try {
        $kiokuValidationCommand = if ($LiveCaptureSmoke) {
            'node tooling/run-backend-emulator-tests.mjs --live-capture'
        } else { 'node tooling/run-backend-emulator-tests.mjs' }
        & $FunctionsNode 'backend/node_modules/firebase-tools/lib/bin/firebase.js' emulators:exec `
            --config firebase.local.json --project demo-kioku-local --only auth,firestore,functions `
            $kiokuValidationCommand
        if ($LASTEXITCODE -ne 0) { throw 'Local backend validation failed; see the test result.' }
    } finally { Pop-Location }
} finally {
    foreach ($kiokuName in $kiokuPrevious.Keys) {
        [Environment]::SetEnvironmentVariable($kiokuName, $kiokuPrevious[$kiokuName], 'Process')
    }
}
