# Fetches /trophies?player=<afId> for every player known to us via the earlier
# weights pass, priorities highest market value first so the game is playable
# after the first day. Free tier: 100 req/day, ~7-8s per call for per-minute
# safety. Saves progress incrementally so we can resume across days.
#
# We count trophies where `place == "Winner"` — this excludes runner-up and
# 3rd-place finishes, giving a clean "kupa sayısı" per player.
# Output:
#   data/api-football-trophies.json -> { "<afId>": { wins, byLeague:{league:count}, updated } }
#   patches team JSONs with `trophies: <int>` per player.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$keyPath = Join-Path $root '.api-keys\api-football.key'
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$out = Join-Path $root 'data\api-football-trophies.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

$key = (Get-Content -LiteralPath $keyPath -Raw).Trim()
$headers = @{ 'x-apisports-key' = $key }
$base = 'https://v3.football.api-sports.io'

# Build ordered list of (afId, marketValue, name) — highest MV first.
$candidates = @()
foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  $j = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($p in $j.players) {
    $afId = $null
    if ($p.PSObject.Properties.Match('apiFootballId').Count -gt 0) { $afId = $p.apiFootballId }
    if (-not $afId) { continue }
    $mv = if ($p.marketValue) { [long]$p.marketValue } else { 0 }
    $candidates += [pscustomobject]@{ afId = [int]$afId; mv = $mv; name = $p.name; teamId = $j.id }
  }
}
$candidates = $candidates | Sort-Object -Property mv -Descending
# Also dedup by afId (a player might appear in multiple team JSONs after transfers)
$seen = @{}
$candidates = $candidates | Where-Object { $ok = -not $seen.ContainsKey($_.afId); $seen[$_.afId] = $true; $ok }
Write-Host "Candidate players with af_id: $($candidates.Count)"

# Load prior progress
$results = @{}
if (Test-Path $out) {
  $prev = Get-Content -LiteralPath $out -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($prop in $prev.PSObject.Properties) {
    $obj = @{}
    foreach ($p in $prop.Value.PSObject.Properties) { $obj[$p.Name] = $p.Value }
    $results["$($prop.Name)"] = $obj
  }
  Write-Host "Loaded prior trophy data: $($results.Count) players"
}

# Filter to those we haven't fetched yet
$todo = $candidates | Where-Object { -not $results.ContainsKey([string]$_.afId) }
Write-Host "To fetch this run: $($todo.Count)"

$dailyBudget = if ($env:AF_TROPHY_BUDGET) { [int]$env:AF_TROPHY_BUDGET } else { 90 }  # override via env var
$reqUsed = 0
$lastCallTicks = 0

function Throttle {
  $now = [Environment]::TickCount
  $delta = $now - $script:lastCallTicks
  if ($script:lastCallTicks -gt 0 -and $delta -lt 7500) {
    Start-Sleep -Milliseconds (7500 - $delta)
  }
  $script:lastCallTicks = [Environment]::TickCount
}

function Save-State {
  $ordered = [ordered]@{}
  foreach ($k in ($results.Keys | Sort-Object { [int]$_ })) { $ordered["$k"] = $results[$k] }
  [System.IO.File]::WriteAllText($out, (ConvertTo-Json $ordered -Depth 5), $utf8)
}

function Call-Api {
  param([string]$url)
  Throttle
  $script:reqUsed++
  try {
    $r = Invoke-RestMethod -Uri $url -Headers $headers -TimeoutSec 30
    if ($r.errors -and $r.errors.PSObject.Properties.Count -gt 0) {
      $errKind = ($r.errors.PSObject.Properties | Select-Object -First 1).Name
      $errMsg  = ($r.errors.PSObject.Properties | Select-Object -First 1).Value
      Write-Host "  API err [$errKind]: $errMsg"
      if ("$errMsg" -match 'per-minute') {
        Write-Host "  sleeping 60s..."; Start-Sleep -Seconds 60
        return Call-Api $url
      }
      if ("$errMsg" -match 'per-day|reached your.*daily|Requests limit') {
        Write-Host "  DAILY LIMIT. Saving state."; Save-State; exit 2
      }
      return $null
    }
    return $r
  } catch {
    Write-Host "  ERR $url -> $_"; return $null
  }
}

foreach ($c in $todo) {
  if ($reqUsed -ge $dailyBudget) {
    Write-Host "Daily budget ($dailyBudget) reached. Stopping."
    break
  }
  Write-Host "[$($reqUsed+1)/$dailyBudget] player $($c.afId) - $($c.name) (MV=$($c.mv))"
  $r = Call-Api "$base/trophies?player=$($c.afId)"
  if (-not $r) { continue }
  $wins = 0
  $byLeague = @{}
  foreach ($t in $r.response) {
    if (($t.place -match 'Winner')) {
      $wins++
      $lg = "$($t.country) - $($t.league)"
      if ($byLeague.ContainsKey($lg)) { $byLeague[$lg] = $byLeague[$lg] + 1 } else { $byLeague[$lg] = 1 }
    }
  }
  $ordered = [ordered]@{}
  foreach ($k in ($byLeague.Keys | Sort-Object)) { $ordered[$k] = $byLeague[$k] }
  $results["$($c.afId)"] = @{
    wins = $wins
    byLeague = $ordered
    updated = (Get-Date -Format 'yyyy-MM-dd')
    name = $c.name
  }
  if (($reqUsed % 10) -eq 0) { Save-State }
}
Save-State
Write-Host ""
Write-Host "Requests used this run: $reqUsed. Trophy records total: $($results.Count)."
Write-Host "Re-run tomorrow to continue if more players remain."
