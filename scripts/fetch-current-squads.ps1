# Fetches the current 2026/27 squad for each configured team from
# API-Football (/players/squads?team=X) and writes them to
# data/api-football-current-squads.json. Phase 1 of the full roster refresh —
# `diff-and-patch-squads.ps1` reads the file, compares against team JSONs, and
# emits an add/remove report + patch.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$keyPath = Join-Path $root '.api-keys\api-football.key'
$outPath = Join-Path $root 'data\api-football-current-squads.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

$key = (Get-Content -LiteralPath $keyPath -Raw).Trim()
$headers = @{ 'x-apisports-key' = $key }
$base = 'https://v3.football.api-sports.io'

# Priority order (see chat). Top 10 today, then remaining tomorrow.
$targets = [ordered]@{
  'real-madrid'         = 541
  'barcelona'           = 529
  'manchester-city'     = 50
  'liverpool'           = 40
  'bayern-munich'       = 157
  'fenerbahce'          = 611
  'galatasaray'         = 645
  'besiktas'            = 549
  'trabzonspor'         = 998
  'chelsea'             = 49
  # tomorrow batch (uncomment when running the second day)
  # 'manchester-united'   = 33
  # 'arsenal'             = 42
  # 'tottenham-hotspur'   = 47
  # 'newcastle-united'    = 34
  # 'aston-villa'         = 66
  # 'ac-milan'            = 489
  # 'inter-milan'         = 505
  # 'juventus'            = 496
  # 'napoli'              = 492
  # 'borussia-dortmund'   = 165
  # 'bayer-leverkusen'    = 168
  # 'atletico-madrid'     = 530
  # 'paris-saint-germain' = 85
  # 'basaksehir'          = 564
}

# Load prior progress
$squads = [ordered]@{}
if (Test-Path $outPath) {
  $prev = Get-Content -LiteralPath $outPath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($prop in $prev.PSObject.Properties) { $squads[$prop.Name] = $prev.$($prop.Name) }
  Write-Host "Loaded prior squads: $($squads.Count) teams"
}

$reqUsed = 0
$lastCall = 0
function Throttle {
  $now = [Environment]::TickCount
  $d = $now - $script:lastCall
  if ($script:lastCall -gt 0 -and $d -lt 7000) { Start-Sleep -Milliseconds (7000 - $d) }
  $script:lastCall = [Environment]::TickCount
}
function Save-State {
  [System.IO.File]::WriteAllText($outPath, (ConvertTo-Json $squads -Depth 6), $utf8)
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
      Write-Host "  err [$errKind]: $errMsg"
      if ("$errMsg" -match 'per-minute') {
        Write-Host "  sleeping 60s..."; Start-Sleep -Seconds 60
        return Call-Api $url
      }
      if ("$errMsg" -match 'per-day|reached your.*daily|Requests limit') {
        Write-Host "  DAILY LIMIT — saving and exiting."; Save-State; exit 2
      }
      return $null
    }
    return $r
  } catch {
    Write-Host "  err $url -> $_"; return $null
  }
}

foreach ($ourId in $targets.Keys) {
  if ($squads.Contains($ourId)) {
    Write-Host "skip (already have): $ourId"
    continue
  }
  $afId = $targets[$ourId]
  Write-Host "team $ourId (af=$afId) ..."
  $r = Call-Api "$base/players/squads?team=$afId"
  if (-not $r -or -not $r.response) { continue }
  $entry = $r.response[0]
  $players = @()
  foreach ($p in $entry.players) {
    $players += [ordered]@{
      afId     = $p.id
      name     = $p.name
      age      = $p.age
      number   = $p.number
      position = $p.position
    }
  }
  $squads[$ourId] = [ordered]@{
    ourId    = $ourId
    afId     = $afId
    teamName = $entry.team.name
    players  = $players
    fetched  = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
  }
  Save-State
  Write-Host "  wrote $($players.Count) players"
}

Write-Host ""
Write-Host "Fetched: $($squads.Count) teams. Requests used this run: $reqUsed."
