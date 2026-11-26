$ErrorActionPreference = 'Stop'
$kiokuRoot = Split-Path -Parent $PSScriptRoot
$kiokuFunctionNode = Join-Path $kiokuRoot '.setup/k1-node/node-v22.23.5-win-x64/node.exe'
if (-not (Test-Path -LiteralPath $kiokuFunctionNode -PathType Leaf)) { throw 'Prepare the Node 22 Firebase emulator toolchain first.' }
if (-not $env:JAVA_HOME) {
    $kiokuTrialJdk = Get-ChildItem -LiteralPath (Join-Path $kiokuRoot '.setup/k0-jdk') -Directory -Filter 'jdk-21*' | Select-Object -First 1
    if (-not $kiokuTrialJdk) { throw 'Configure JAVA_HOME with JDK 21 or newer.' }
    $env:JAVA_HOME = $kiokuTrialJdk.FullName
}
$env:PATH = (Split-Path -Parent $kiokuFunctionNode) + ';' + (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
$env:FIREBASE_EMULATORS_PATH = Join-Path $kiokuRoot '.setup/firebase-emulators'
$env:GCLOUD_PROJECT = 'demo-kioku-local'
$env:CI = 'true'
$env:METADATA_SERVER_DETECTION = 'none'
foreach ($kiokuTrialPort in @(4407, 5007, 8087, 9097)) {
    if (Get-NetTCPConnection -LocalPort $kiokuTrialPort -State Listen -ErrorAction SilentlyContinue) {
        throw "A service is already listening on the reserved local port $kiokuTrialPort."
    }
}
Push-Location -LiteralPath $kiokuRoot
try {
    if (-not (Test-Path -LiteralPath 'backend/lib/src/index.js' -PathType Leaf)) { throw 'Build the local backend before starting the trial.' }
    & $kiokuFunctionNode 'backend/node_modules/firebase-tools/lib/bin/firebase.js' emulators:exec `
        --config firebase.local.json --project demo-kioku-local --only auth,firestore,functions `
        'node tooling/location-trial-owner.mjs --local-trial'
    exit $LASTEXITCODE
} finally { Pop-Location }
