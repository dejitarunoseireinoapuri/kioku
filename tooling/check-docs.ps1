param([string]$Root = (Split-Path -Parent $PSScriptRoot))

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$rootPrefix = $resolvedRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$failures = [Collections.Generic.List[string]]::new()
$documents = [Collections.Generic.List[IO.FileInfo]]::new()

foreach ($name in @('AGENTS.md', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md')) {
    $path = Join-Path $resolvedRoot $name
    if (Test-Path -LiteralPath $path -PathType Leaf) {
        $documents.Add((Get-Item -LiteralPath $path))
    } else {
        $failures.Add("Missing root document: $name")
    }
}
foreach ($document in (Get-ChildItem -LiteralPath (Join-Path $resolvedRoot 'docs') -Filter '*.md' -Recurse)) {
    $documents.Add($document)
}

$contents = @{}
foreach ($document in $documents) {
    $relative = [IO.Path]::GetRelativePath($resolvedRoot, $document.FullName).Replace('\', '/')
    $text = [IO.File]::ReadAllText($document.FullName)
    $contents[$relative] = $text
    if ($text -match 'sk-(?:proj-)?[A-Za-z0-9_-]{24,}') {
        $failures.Add("Possible secret marker in $relative (value omitted)")
    }
    if ($text -match '(?i)[a-z]:[\\/](?:Users|home)[\\/]') {
        $failures.Add("Personal absolute path in $relative")
    }
    foreach ($match in [regex]::Matches($text, '\[[^\]]+\]\(([^)]+)\)')) {
        $target = $match.Groups[1].Value.Trim().Trim('<', '>')
        if ($target -match '^(https?://|mailto:|#)') { continue }
        $filePart = [Uri]::UnescapeDataString(($target -split '#', 2)[0])
        if ([IO.Path]::IsPathRooted($filePart) -or $filePart -match '^[A-Za-z]+:') {
            $failures.Add("Non-relative local link in $relative")
            continue
        }
        $destination = [IO.Path]::GetFullPath((Join-Path $document.DirectoryName $filePart))
        if (-not $destination.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
            $failures.Add("Link escapes repository in $relative")
        } elseif (-not (Test-Path -LiteralPath $destination)) {
            $failures.Add("Missing link in ${relative}: $filePart")
        }
    }
}

$mapPath = Join-Path $resolvedRoot '.governance/docs-map.json'
$map = Get-Content -LiteralPath $mapPath -Raw | ConvertFrom-Json
foreach ($property in $map.PSObject.Properties) {
    $candidate = [IO.Path]::GetFullPath((Join-Path $resolvedRoot $property.Value))
    if (-not $candidate.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase) -or
        -not (Test-Path -LiteralPath $candidate)) {
        $failures.Add("Invalid governance role: $($property.Name)")
    }
}

$owners = @{
    'FR-\d{3}' = 'docs/01-functional/FUNCTIONAL_REQUIREMENTS.md'
    'AC-\d{3}' = 'docs/01-functional/FUNCTIONAL_REQUIREMENTS.md'
    'BR-\d{3}' = 'docs/00-product/BUSINESS_RULES.md'
    'UC-\d{3}' = 'docs/01-functional/USE_CASES.md'
    'TEST-[A-Z]+-\d{3}' = 'docs/06-quality/TEST_MATRIX.md'
}
foreach ($pattern in $owners.Keys) {
    $owner = $owners[$pattern]
    $known = @([regex]::Matches($contents[$owner], $pattern) | ForEach-Object Value | Select-Object -Unique)
    foreach ($entry in $contents.GetEnumerator()) {
        foreach ($identifier in ([regex]::Matches($entry.Value, $pattern) | ForEach-Object Value | Select-Object -Unique)) {
            if ($identifier -notin $known) { $failures.Add("Undefined ${identifier} in $($entry.Key)") }
        }
    }
}

$adrRoot = Join-Path $resolvedRoot $map.adr_dir
$adrIndex = [IO.File]::ReadAllText((Join-Path $resolvedRoot $map.adr_index))
$adrs = @(Get-ChildItem -LiteralPath $adrRoot -Filter 'ADR-*.md')
foreach ($adr in $adrs) {
    if (-not $adrIndex.Contains($adr.Name)) { $failures.Add("ADR missing from index: $($adr.Name)") }
}

if ($failures.Count -gt 0) {
    foreach ($failure in $failures) { Write-Output "ERROR: $failure" }
    exit 1
}
Write-Output "Documentation OK: $($documents.Count) files, $($adrs.Count) ADRs, links/map/identifiers checked."
Write-Output 'This does not validate app builds, provider access, live security or product correctness.'
exit 0
