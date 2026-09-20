# Pulls player weight (and API-Football id / height) for every team in our
# draftinho pool via the API-Football /players endpoint (team+season).
# Budget respects both the 100/day and observed ~10/minute free-tier limits.
# Saves incremental progress after each team so we can resume across days.
#
# Output:
#   data/api-football-players.json  -> { "<afId>": { af_id, weight, height, apiName, ... } }
#   data/api-football-name-index.json -> { "<normName>": { af_id, weight, height } }
#   data/api-football-team-squads.json -> { "<ourTeamId>": [afId, ...], "<ourTeamId>__done": true }

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$keyPath = Join-Path $root '.api-keys\api-football.key'
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$playersOut = Join-Path $root 'data\api-football-players.json'
$nameIdxOut = Join-Path $root 'data\api-football-name-index.json'
$squadOut   = Join-Path $root 'data\api-football-team-squads.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

$key = (Get-Content -LiteralPath $keyPath -Raw).Trim()
$headers = @{ 'x-apisports-key' = $key }
$base = 'https://v3.football.api-sports.io'

$teamMap = [ordered]@{
  'real-madrid'         = 541
  'barcelona'           = 529
  'atletico-madrid'     = 530
  'manchester-city'     = 50
  'manchester-united'   = 33
  'arsenal'             = 42
  'chelsea'             = 49
  'liverpool'           = 40
  'tottenham-hotspur'   = 47
  'newcastle-united'    = 34
  'aston-villa'         = 66
  'ac-milan'            = 489
  'inter-milan'         = 505
  'juventus'            = 496
  'napoli'              = 492
  'bayern-munich'       = 157
  'borussia-dortmund'   = 165
  'bayer-leverkusen'    = 168
  'paris-saint-germain' = 85
  'fenerbahce'          = 611
  'galatasaray'         = 645
  'besiktas'            = 549
  'trabzonspor'         = 998
  'basaksehir'          = 564
}

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

# Load prior progress if the script was interrupted before.
$byId = @{}
if (Test-Path $playersOut) {
  $prev = Get-Content -LiteralPath $playersOut -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($prop in $prev.PSObject.Properties) {
    $obj = @{}
    foreach ($p in $prop.Value.PSObject.Properties) { $obj[$p.Name] = $p.Value }
    $byId["$($prop.Name)"] = $obj
  }
}
$byName = @{}
if (Test-Path $nameIdxOut) {
  $prev = Get-Content -LiteralPath $nameIdxOut -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($prop in $prev.PSObject.Properties) {
    $obj = @{}
    foreach ($p in $prop.Value.PSObject.Properties) { $obj[$p.Name] = $p.Value }
    $byName["$($prop.Name)"] = $obj
  }
}
$squadByTeam = [ordered]@{}
if (Test-Path $squadOut) {
  $prev = Get-Content -LiteralPath $squadOut -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($prop in $prev.PSObject.Properties) {
    $squadByTeam["$($prop.Name)"] = @($prop.Value)
  }
}

$reqUsed = 0
$lastCallTicks = 0

function Save-State {
  # Convert hashtables to ordered dictionaries with string keys for JSON.
  $idsOrdered = [ordered]@{}
  foreach ($k in ($byId.Keys | Sort-Object { [int]$_ })) { $idsOrdered["$k"] = $byId[$k] }
  [System.IO.File]::WriteAllText($playersOut, (ConvertTo-Json $idsOrdered -Depth 6), $utf8)

  $namesOrdered = [ordered]@{}
  foreach ($k in ($byName.Keys | Sort-Object)) { $namesOrdered[$k] = $byName[$k] }
  [System.IO.File]::WriteAllText($nameIdxOut, (ConvertTo-Json $namesOrdered -Depth 4), $utf8)

  [System.IO.File]::WriteAllText($squadOut, (ConvertTo-Json $squadByTeam -Depth 4), $utf8)
}

function Throttle {
  # ~7 seconds between API calls to stay under ~10 req/min.
  $now = [Environment]::TickCount
  $delta = $now - $script:lastCallTicks
  if ($script:lastCallTicks -gt 0 -and $delta -lt 7000) {
    Start-Sleep -Milliseconds (7000 - $delta)
  }
  $script:lastCallTicks = [Environment]::TickCount
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
        Write-Host "  sleeping 60s to reset per-minute counter..."
        Start-Sleep -Seconds 60
        return Call-Api $url
      }
      if ("$errMsg" -match 'per-day|reached your.*daily') {
        Write-Host "  DAILY LIMIT HIT. Saving progress and exiting."
        Save-State
        exit 2
      }
      return $null
    }
    return $r
  } catch {
    Write-Host "  ERR $url -> $_"
    return $null
  }
}

foreach ($ourId in $teamMap.Keys) {
  $doneKey = "${ourId}__done"
  if ($squadByTeam.Contains($doneKey)) {
    Write-Host "team $ourId — already complete (skip)"
    continue
  }
  $tid = $teamMap[$ourId]
  Write-Host "team $ourId (af=$tid)..."
  if (-not $squadByTeam.Contains($ourId)) { $squadByTeam[$ourId] = @() }
  $page = 1
  $totalPages = 1
  do {
    $r = Call-Api "$base/players?team=$tid&season=2024&page=$page"
    if (-not $r -or -not $r.response) { break }
    foreach ($entry in $r.response) {
      $p = $entry.player
      if (-not $p) { continue }
      $afId = [int]$p.id
      $wStr = "$($p.weight)".Trim()
      $hStr = "$($p.height)".Trim()
      $w = $null; $h = $null
      if ($wStr) { $tmp = 0; if ([int]::TryParse(($wStr -replace ' kg',''), [ref]$tmp)) { $w = $tmp } }
      if ($hStr) { $tmp = 0; if ([int]::TryParse(($hStr -replace ' cm',''), [ref]$tmp)) { $h = $tmp } }
      $key = "$afId"
      if (-not $byId.ContainsKey($key) -or ($w -and -not $byId[$key].weight)) {
        $byId[$key] = @{
          af_id       = $afId
          apiName     = $p.name
          firstname   = $p.firstname
          lastname    = $p.lastname
          weight      = $w
          height      = $h
          nationality = $p.nationality
          birth       = $p.birth.date
        }
      }
      $variants = @( (Get-NormName $p.name), (Get-NormName ("$($p.firstname) $($p.lastname)")) ) | Where-Object { $_ } | Select-Object -Unique
      foreach ($nv in $variants) {
        if (-not $byName.ContainsKey($nv) -or ($w -and -not $byName[$nv].weight)) {
          $byName[$nv] = @{ af_id = $afId; apiName = $p.name; weight = $w; height = $h }
        }
      }
      if ($squadByTeam[$ourId] -notcontains $afId) {
        $squadByTeam[$ourId] = @($squadByTeam[$ourId]) + $afId
      }
    }
    $totalPages = [int]$r.paging.total
    Write-Host "  page $page/$totalPages (roster so far: $(@($squadByTeam[$ourId]).Count))"
    $page++
  } while ($page -le $totalPages)
  $squadByTeam[$doneKey] = $true
  Save-State
}

Write-Host ""
Write-Host "API requests used in this run: $reqUsed"
Write-Host "Distinct AF ids: $($byId.Count) | Distinct normalized names: $($byName.Count)"
Save-State
Write-Host "Fetch complete. Now run apply-api-football-weights.ps1 to patch team JSONs."
