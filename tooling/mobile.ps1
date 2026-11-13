param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$GradleArguments
)

$ErrorActionPreference = 'Stop'
$kiokuRoot = Split-Path $PSScriptRoot -Parent
if (-not $env:JAVA_HOME) {
    $kiokuLocalJdk = Get-ChildItem (Join-Path $kiokuRoot '.setup/k0-jdk') -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($kiokuLocalJdk) { $env:JAVA_HOME = $kiokuLocalJdk.FullName }
}
if (-not $env:JAVA_HOME) {
    $kiokuStudioJdk = Join-Path $env:ProgramFiles 'Android/Android Studio/jbr'
    if (Test-Path (Join-Path $kiokuStudioJdk 'bin/java.exe')) {
        $env:JAVA_HOME = $kiokuStudioJdk
    }
}
if (-not $env:ANDROID_HOME) {
    $kiokuSdk = Join-Path $env:LOCALAPPDATA 'Android/Sdk'
    if (Test-Path $kiokuSdk) { $env:ANDROID_HOME = $kiokuSdk }
}
Push-Location $kiokuRoot
try {
    & (Join-Path $kiokuRoot 'gradlew.bat') @GradleArguments
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
