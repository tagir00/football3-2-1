# Reads data/api-football-trophies.json and patches each player's `trophies`
# count in the team JSONs. Idempotent; players without an af_id or without a
# trophy record keep trophies=0.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$trophyPath = Join-Path $root 'data\api-football-trophies.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

if (-not (Test-Path $trophyPath)) { throw "Missing $trophyPath — run fetch script first." }

$raw = Get-Content -LiteralPath $trophyPath -Raw -Encoding UTF8 | ConvertFrom-Json
$byId = @{}
foreach ($prop in $raw.PSObject.Properties) {
  $byId[$prop.Name] = [int]$prop.Value.wins
}
Write-Host "Loaded trophy records for $($byId.Count) players"

$patched = 0; $withTrophies = 0; $zeroOrUnknown = 0
foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  $rawJ = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $j = ConvertFrom-Json $rawJ
  foreach ($p in $j.players) {
    $wins = 0
    if ($p.PSObject.Properties.Match('apiFootballId').Count -gt 0 -and $p.apiFootballId) {
      $k = "$($p.apiFootballId)"
      if ($byId.ContainsKey($k)) { $wins = $byId[$k] }
    }
    if ($wins -gt 0) { $withTrophies++ } else { $zeroOrUnknown++ }
    if ($p.PSObject.Properties.Match('trophies').Count -gt 0) { $p.trophies = $wins } else { $p | Add-Member -MemberType NoteProperty -Name trophies -Value $wins }
  }
  $json = ConvertTo-Json $j -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($f.FullName, $json, $utf8)
  $patched++
}
Write-Host "Patched $patched teams. Players with trophies: $withTrophies | Zero/unknown: $zeroOrUnknown"
