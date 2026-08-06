$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $repoRoot 'src/data.js'
$logoDir = Join-Path $repoRoot 'assets/logos/clubs'

function Slugify-ClubName {
  param([string]$Name)

  $normalized = $Name.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $ascii = $builder.ToString()
  $ascii = $ascii -replace '&', 'and'
  $ascii = $ascii -replace '[^a-zA-Z0-9]+', '-'
  $ascii = $ascii -replace '^-+|-+$', ''
  return $ascii.ToLowerInvariant()
}

function Get-Clubs {
  param([string]$DataText)

  $blocks = @('premierLeague', 'laLiga', 'bundesliga', 'serieA', 'ligue1', 'superLig', 'extraClubs')
  $names = New-Object System.Collections.Generic.List[string]

  foreach ($block in $blocks) {
    $pattern = "const $block = \[(.*?)\];"
    $match = [regex]::Match($DataText, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $match.Success) { continue }

    $items = [regex]::Matches($match.Groups[1].Value, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value }
    foreach ($item in $items) {
      if (-not $names.Contains($item)) { $names.Add($item) }
    }
  }

  return $names
}

$dataText = Get-Content $dataPath -Raw
$clubs = Get-Clubs -DataText $dataText
$pngFiles = Get-ChildItem (Join-Path $logoDir '*.png') -ErrorAction SilentlyContinue

$missing = @()
foreach ($club in $clubs) {
  $slug = Slugify-ClubName -Name $club
  if (-not (Test-Path (Join-Path $logoDir ($slug + '.png')))) {
    $missing += $club
  }
}

$dupGroups = $pngFiles | Group-Object { (Get-FileHash $_.FullName -Algorithm SHA256).Hash } | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending

Write-Output ("TOTAL_CLUBS={0}" -f $clubs.Count)
Write-Output ("PNG_COUNT={0}" -f $pngFiles.Count)
Write-Output ("MISSING_COUNT={0}" -f $missing.Count)
if ($missing.Count -gt 0) {
  Write-Output ("MISSING_LIST={0}" -f ($missing -join ', '))
}
Write-Output ("DUP_HASH_GROUPS={0}" -f $dupGroups.Count)
foreach ($group in $dupGroups | Select-Object -First 8) {
  Write-Output ("DUP_COUNT={0} :: {1}" -f $group.Count, (($group.Group | Select-Object -ExpandProperty Name) -join ', '))
}
