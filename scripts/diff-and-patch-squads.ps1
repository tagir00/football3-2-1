# Reads data/api-football-current-squads.json (the ground truth from
# API-Football) and reconciles each Draftinho team JSON:
#   - Names in AF but not in ours    → new signing candidates (auto-added with
#                                       9200xxx ids and reasonable defaults)
#   - Names in ours but not in AF    → likely departures (moved to another
#                                       tracked team, or left the pool)
#
# The script writes a report to data/squad-diff-report.txt for user review,
# and (unless -DryRun is passed) applies the additions and removes departures
# whose disappearance is corroborated by another tracked team having gained
# the same player (safe: we never lose a player, we relocate them). Departures
# not corroborated are LEFT ALONE — the report flags them so the user can
# decide.

param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$squadsPath = Join-Path $root 'data\api-football-current-squads.json'
$reportPath = Join-Path $root 'data\squad-diff-report.txt'
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

# AF short-name (e.g. "M. Bettinelli") to canonical form: if it's like
# "X. Something" we match against last-token; last name still yields the same
# key so equality works vs our stored full names.
function Get-MatchToken {
  param([string]$s)
  $n = Get-NormName $s
  if (-not $n) { return @() }
  $tokens = $n -split ' '
  # Return the full normalized name AND every individual token that is at
  # least 3 chars long. This catches "Alisson Becker" ↔ "Alisson",
  # "D. Livaković" ↔ "Dominik Livaković", "M. Catovic" ↔ "Mirza Catovic",
  # and similar AF-vs-TM name shortenings.
  $out = @($n)
  foreach ($t in $tokens) { if ($t.Length -ge 3) { $out += $t } }
  return $out
}

if (-not (Test-Path $squadsPath)) { throw "Missing $squadsPath — run fetch-current-squads.ps1 first." }

$squads = Get-Content -LiteralPath $squadsPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Step 1: build a global "who's where in AF" map so we can detect intra-pool moves
$afGlobal = @{}   # normName -> ourTeamId (from AF squads)
foreach ($prop in $squads.PSObject.Properties) {
  $ourId = $prop.Name
  $entry = $squads.$ourId
  foreach ($p in $entry.players) {
    foreach ($tok in (Get-MatchToken $p.name)) {
      if (-not $afGlobal.ContainsKey($tok)) { $afGlobal[$tok] = @() }
      if ($afGlobal[$tok] -notcontains $ourId) { $afGlobal[$tok] += $ourId }
    }
  }
}

$positionMap = @{
  'Goalkeeper' = 'GK'; 'Defender' = 'DEF'; 'Midfielder' = 'MID'; 'Attacker' = 'FW'
}

$report = New-Object System.Collections.ArrayList
$nextNewId = 9200000
$totalAdded = 0; $totalRemoved = 0; $totalRelocated = 0; $totalKept = 0

foreach ($prop in $squads.PSObject.Properties) {
  $ourId = $prop.Name
  $entry = $squads.$ourId
  $teamJsonPath = Join-Path $teamsDir "$ourId.json"
  if (-not (Test-Path $teamJsonPath)) {
    [void]$report.Add("SKIP $ourId (no team JSON)")
    continue
  }
  $j = Get-Content -LiteralPath $teamJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

  # Build lookup sets
  $ourTokens = @{}    # normalized name/surname -> player index
  for ($i=0; $i -lt $j.players.Count; $i++) {
    foreach ($tok in (Get-MatchToken $j.players[$i].name)) {
      if (-not $ourTokens.ContainsKey($tok)) { $ourTokens[$tok] = $i }
    }
  }
  $afTokens = @{}
  for ($i=0; $i -lt $entry.players.Count; $i++) {
    foreach ($tok in (Get-MatchToken $entry.players[$i].name)) {
      if (-not $afTokens.ContainsKey($tok)) { $afTokens[$tok] = $i }
    }
  }

  # A. AF players NOT in ours → add
  foreach ($afP in $entry.players) {
    $tokens = Get-MatchToken $afP.name
    $known = $false
    foreach ($t in $tokens) { if ($ourTokens.ContainsKey($t)) { $known = $true; break } }
    if ($known) { $totalKept++; continue }
    # Reserve / youth heuristic. AF's /players/squads returns the club's full
    # registered list including B-team players (Castilla, Cantera, Bayern II).
    # Skip anything that quacks like a reserve so the report stays clean.
    $shirt = 99
    if ($afP.number -is [int]) { $shirt = $afP.number }
    elseif ("$($afP.number)" -match '^\d+$') { $shirt = [int]$afP.number }
    $age = 0
    if ($afP.age -is [int]) { $age = $afP.age }
    elseif ("$($afP.age)" -match '^\d+$') { $age = [int]$afP.age }
    if ($shirt -ge 40) { continue }
    if ($age -le 19 -and $shirt -ge 25) { continue }
    if ($age -le 17) { continue }
    [void]$report.Add("+ ${ourId}: $($afP.name) (af=$($afP.afId), #$($afP.number), $($afP.position), age $($afP.age))")
    if (-not $DryRun) {
      $pos = if ($positionMap.ContainsKey("$($afP.position)")) { $positionMap["$($afP.position)"] } else { 'MID' }
      $newP = [pscustomobject]([ordered]@{
        id = ++$nextNewId
        name = $afP.name
        slug = (Get-NormName $afP.name) -replace ' ','-'
        position = $pos
        shirt = $afP.number
        age = [int]$afP.age
        birth = $null
        height = 180
        marketValue = 0
        intlGoals = 0
        intlAppearances = 0
        assists = 0
        yellowCards = 0
        redCards = 0
        nationality = $null
        clubApps = 0
        weight = $null
        apiFootballId = $afP.afId
        trophies = 0
      })
      $j.players = @($j.players) + $newP
    }
    $totalAdded++
  }

  # B. Our players NOT in AF → possibly departed. Only remove if another
  #    tracked team's AF squad now has them (safe intra-pool relocation).
  $toRemoveIndices = @()
  for ($i=0; $i -lt $j.players.Count; $i++) {
    $p = $j.players[$i]
    $tokens = Get-MatchToken $p.name
    $stillHere = $false
    foreach ($t in $tokens) { if ($afTokens.ContainsKey($t)) { $stillHere = $true; break } }
    if ($stillHere) { continue }
    $foundElsewhere = $null
    foreach ($t in $tokens) {
      if ($afGlobal.ContainsKey($t)) {
        $others = $afGlobal[$t] | Where-Object { $_ -ne $ourId }
        if ($others) { $foundElsewhere = $others[0]; break }
      }
    }
    if ($foundElsewhere) {
      [void]$report.Add("- ${ourId}: $($p.name) → moved to $foundElsewhere (auto-removed)")
      if (-not $DryRun) { $toRemoveIndices += $i }
      $totalRelocated++
    } else {
      [void]$report.Add("? ${ourId}: $($p.name) — not in AF squad; no other tracked team has them. LEFT IN PLACE.")
    }
  }
  if (-not $DryRun -and $toRemoveIndices.Count -gt 0) {
    $j.players = @($j.players | ForEach-Object -Begin { $idx = 0 } -Process {
      if ($toRemoveIndices -notcontains $idx) { $_ }
      $idx++
    })
    $totalRemoved += $toRemoveIndices.Count
  }

  if (-not $DryRun) {
    $json = ConvertTo-Json $j -Depth 20
    $json = ($json -replace "`r`n","`n")
    if (-not $json.EndsWith("`n")) { $json += "`n" }
    [System.IO.File]::WriteAllText($teamJsonPath, $json, $utf8)
  }
}

[System.IO.File]::WriteAllText($reportPath, ($report -join "`n"), $utf8)

Write-Host ""
Write-Host "Squad reconciliation summary"
Write-Host "  Kept (already present) : $totalKept"
Write-Host "  Added (new AF players) : $totalAdded"
Write-Host "  Relocated (safe removes): $totalRelocated / $totalRemoved actually removed"
Write-Host "  Report written to $reportPath"
if ($DryRun) { Write-Host "  DRY RUN — no files changed. Re-run without -DryRun to apply." }
