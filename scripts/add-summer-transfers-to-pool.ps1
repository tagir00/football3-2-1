# Reads scripts/apply-summer-2026-transfers.ps1's intra-pool moves + new
# signings and merges the "to" club into each player's clubs entry in
# careerAugmentations.json (add section). Ensures recent transfers show up in
# Rastgele Beşler even though they landed after the Transfermarkt CSV cut-off.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$transferScripts = @(
  (Join-Path $root 'scripts\apply-summer-2026-transfers.ps1'),
  (Join-Path $root 'scripts\apply-late-window-2026.ps1')
)
$augPath = Join-Path $root 'src\games\rastgele-besler\careerAugmentations.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

# Team slug -> canonical name used in playerPool.json
$slugToName = @{
  'ac-milan'            = 'AC Milan'
  'arsenal'             = 'Arsenal'
  'aston-villa'         = 'Aston Villa'
  'atletico-madrid'     = 'Atletico Madrid'
  'barcelona'           = 'Barcelona'
  'basaksehir'          = 'Basaksehir'
  'bayer-leverkusen'    = 'Bayer Leverkusen'
  'bayern-munich'       = 'Bayern Munich'
  'besiktas'            = 'Besiktas'
  'borussia-dortmund'   = 'Borussia Dortmund'
  'chelsea'             = 'Chelsea'
  'fenerbahce'          = 'Fenerbahce'
  'galatasaray'         = 'Galatasaray'
  'inter-milan'         = 'Inter Milan'
  'juventus'            = 'Juventus'
  'liverpool'           = 'Liverpool'
  'manchester-city'     = 'Manchester City'
  'manchester-united'   = 'Manchester United'
  'napoli'              = 'Napoli'
  'newcastle-united'    = 'Newcastle United'
  'paris-saint-germain' = 'Paris Saint-Germain'
  'real-madrid'         = 'Real Madrid'
  'tottenham-hotspur'   = 'Tottenham Hotspur'
  'trabzonspor'         = 'Trabzonspor'
}

# Parse all transfer scripts and merge results
$playerAddClubs = @{}
foreach ($transferScript in $transferScripts) {
  if (-not (Test-Path $transferScript)) { continue }
  $content = Get-Content -LiteralPath $transferScript -Raw -Encoding UTF8
  $intra = [regex]::Matches($content, "@\{\s*name\s*=\s*'([^']+)';\s*from\s*=\s*'([^']+)';\s*to\s*=\s*'([^']+)'\s*\}")
  $newSig = [regex]::Matches($content, "@\{\s*team\s*=\s*'([^']+)';\s*player\s*=\s*\[ordered\]@\{[^}]*?name\s*=\s*'([^']+)'")
  foreach ($m in $intra) {
  $name = $m.Groups[1].Value
  $toSlug = $m.Groups[3].Value
  if (-not $slugToName.ContainsKey($toSlug)) { continue }
  $toName = $slugToName[$toSlug]
  if (-not $playerAddClubs.ContainsKey($name)) { $playerAddClubs[$name] = @() }
  if ($playerAddClubs[$name] -notcontains $toName) { $playerAddClubs[$name] += $toName }
  # Also capture the "from" club so their historical stint is preserved when we
  # override elsewhere. For intra-pool moves the from is already in TM data,
  # but adding it again is harmless (dedup happens on the set).
  $fromSlug = $m.Groups[2].Value
  if ($slugToName.ContainsKey($fromSlug)) {
    $fromName = $slugToName[$fromSlug]
    if ($playerAddClubs[$name] -notcontains $fromName) { $playerAddClubs[$name] += $fromName }
  }
}
  foreach ($m in $newSig) {
    $toSlug = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    if (-not $slugToName.ContainsKey($toSlug)) { continue }
    $toName = $slugToName[$toSlug]
    if (-not $playerAddClubs.ContainsKey($name)) { $playerAddClubs[$name] = @() }
    if ($playerAddClubs[$name] -notcontains $toName) { $playerAddClubs[$name] += $toName }
  }
}
Write-Host "Parsed $($playerAddClubs.Count) players from summer 2026 transfers"

# Load current augmentations
$aug = Get-Content -LiteralPath $augPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $aug.add) {
  $aug | Add-Member -MemberType NoteProperty -Name 'add' -Value ([pscustomobject]@{})
}
$merged = 0
foreach ($name in $playerAddClubs.Keys) {
  $newClubs = $playerAddClubs[$name]
  if ($aug.add.PSObject.Properties.Match($name).Count -gt 0) {
    $existing = @($aug.add.$name)
    $set = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($c in $existing) { [void]$set.Add($c) }
    foreach ($c in $newClubs) { [void]$set.Add($c) }
    $aug.add.$name = @($set) | Sort-Object
  } else {
    $aug.add | Add-Member -MemberType NoteProperty -Name $name -Value (@($newClubs) | Sort-Object)
  }
  $merged++
}

# Save back with indented JSON (readability)
$json = $aug | ConvertTo-Json -Depth 5
$json = ($json -replace "`r`n","`n")
[System.IO.File]::WriteAllText($augPath, $json, $utf8)
Write-Host "Merged $merged players into careerAugmentations.json ($augPath)"
