# Fetches weight/height for players who have an apiFootballId but no weight
# yet, using the per-player /players?id=X&season=2025 endpoint. Cheap: 1
# request per missing player. Respects a daily budget (default 10, override
# via env var AF_WEIGHT_BUDGET) so it can run alongside the trophy fetch on
# the same day.
#
# Skips Ajax/Benfica/Porto (dropped from CLUB_IDS). Highest market value
# first. Extends data/api-football-name-index.json with new entries. Run
# apply-api-football-weights.ps1 afterwards to patch team JSONs.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$keyPath = Join-Path $root '.api-keys\api-football.key'
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$nameIdxPath = Join-Path $root 'data\api-football-name-index.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$skipTeams = @('ajax', 'benfica', 'porto')

$budget = if ($env:AF_WEIGHT_BUDGET) { [int]$env:AF_WEIGHT_BUDGET } else { 10 }
Write-Host "Daily budget: $budget request(s)"

$key = (Get-Content -LiteralPath $keyPath -Raw).Trim()
$headers = @{ 'x-apisports-key' = $key }
$base = 'https://v3.football.api-sports.io'

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

# Load name-index (will extend it)
if (-not (Test-Path $nameIdxPath)) { throw "Missing $nameIdxPath" }
$rawIdx = Get-Content -LiteralPath $nameIdxPath -Raw -Encoding UTF8 | ConvertFrom-Json
$idx = @{}
foreach ($prop in $rawIdx.PSObject.Properties) {
  $obj = @{}
  foreach ($p in $prop.Value.PSObject.Properties) { $obj[$p.Name] = $p.Value }
  $idx[$prop.Name] = $obj
}
Write-Host "name-index loaded: $($idx.Count) entries"

# Collect players missing weight but with af_id
$candidates = @()
foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  if ($f.BaseName -in $skipTeams) { continue }
  $j = Get-Content -Raw -Encoding UTF8 $f.FullName | ConvertFrom-Json
  foreach ($p in $j.players) {
    $hasWeight = $p.PSObject.Properties.Match('weight').Count -gt 0 -and $null -ne $p.weight -and $p.weight -gt 0
    $hasAfId = $p.PSObject.Properties.Match('apiFootballId').Count -gt 0 -and $null -ne $p.apiFootballId
    if (-not $hasWeight -and $hasAfId) {
      $candidates += [pscustomobject]@{
        afId = [int]$p.apiFootballId
        name = $p.name
        team = $j.id
        mv = if ($p.marketValue) { [long]$p.marketValue } else { 0 }
      }
    }
  }
}
$candidates = $candidates | Sort-Object -Property mv -Descending
Write-Host "Candidates missing weight (af_id known): $($candidates.Count)"

if ($candidates.Count -eq 0) {
  Write-Host "Nothing to fetch. Done."
  return
}

$used = 0
$fetched = 0
foreach ($c in $candidates) {
  if ($used -ge $budget) {
    Write-Host "Budget ($budget) reached. Stopping."
    break
  }
  # /players/profiles returns the player's profile (name, weight, height,
  # birthplace, nationality) with no season dependency, so it works even
  # for reserves who have no first-team stats yet.
  $url = "$base/players/profiles?player=$($c.afId)"
  try {
    $r = Invoke-RestMethod -Uri $url -Headers $headers -TimeoutSec 30
  } catch {
    Write-Host "err on $($c.name) af=$($c.afId): $_"
    $used++
    Start-Sleep -Seconds 8
    continue
  }
  $used++
  $rows = $r.response
  if (-not $rows -or $rows.Count -eq 0) {
    Write-Host "[$used/$budget] $($c.name) af=$($c.afId) - no data returned"
    Start-Sleep -Seconds 8
    continue
  }
  # profiles endpoint returns the player object directly (not nested)
  $prof = if ($rows[0].player) { $rows[0].player } else { $rows[0] }
  $wt = $null; $ht = $null
  if ($prof.weight) {
    $m = [regex]::Match([string]$prof.weight, '(\d+)')
    if ($m.Success) { $wt = [int]$m.Value }
  }
  if ($prof.height) {
    $m = [regex]::Match([string]$prof.height, '(\d+)')
    if ($m.Success) { $ht = [int]$m.Value }
  }
  $norm = Get-NormName $prof.name
  if (-not $norm) { $norm = Get-NormName $c.name }
  $idx[$norm] = @{ af_id = [int]$c.afId; weight = $wt; height = $ht }
  $wtDisp = if ($null -ne $wt) { "$wt kg" } else { '-' }
  $htDisp = if ($null -ne $ht) { "$ht cm" } else { '-' }
  Write-Host ("[{0}/{1}] {2,-30} af={3,-6} wt={4} ht={5}" -f $used, $budget, $c.name, $c.afId, $wtDisp, $htDisp)
  $fetched++
  Start-Sleep -Seconds 8
}

# Persist updated index
$jsonOut = ConvertTo-Json $idx -Depth 6
$jsonOut = ($jsonOut -replace "`r`n","`n")
if (-not $jsonOut.EndsWith("`n")) { $jsonOut += "`n" }
[System.IO.File]::WriteAllText($nameIdxPath, $jsonOut, $utf8)

Write-Host ""
Write-Host "Requests used: $used. Fetched: $fetched. Name-index size now: $($idx.Count)."
Write-Host "Next: run apply-api-football-weights.ps1 to patch team JSONs."
