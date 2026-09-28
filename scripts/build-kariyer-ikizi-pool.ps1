# Builds the Kariyer İkizi player pool.
#
# Output: src/games/kariyer-ikizi/players.json
#   { "keys": ["n", "ref", "ca", ...], "rows": [["Didier Drogba", 1, 693, ...], ...] }
#   (columnar so ~6 900 players stay around 1 MB; null = no data for that stat)
#
# Sources:
#   - src/games/hedefi-tuttur/playerStats.json: names and the curated league /
#     trophy / fee values (official overrides, La Liga assist estimates) so both
#     games agree
#   - gitignored Transfermarkt caches in data/ (tmapi.transfermarkt.technology):
#       tm-name-ids.json                row name -> TM player id
#       tm-player-performance-club.json per club: [apps, goals, assists, yellow, red]
#       tm-clubs.json                   club meta (national team, type, parent)
#       tm-player-competitions.json     per league/CL/WC: [apps, goals, assists]
#       tm-player-profile.json          birth date + height
#
# Club totals count senior club teams only; cards add the senior national team.
# Assists and Transfermarkt-only league stats are left empty for players born
# before 1978 (TM's pre-2000 assist data is sparse), Süper Lig before 1965.
# `ref` marks the well-known players the game may pick as the reference.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$data = Join-Path $root 'data'
$outPath = Join-Path $root 'src\games\kariyer-ikizi\players.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)
function Jf($f) { Get-Content -LiteralPath $f -Raw -Encoding UTF8 | ConvertFrom-Json }
function ToMap($obj) { $h = @{}; foreach ($p in $obj.PSObject.Properties) { $h[$p.Name] = $p.Value }; return $h }

$rows = Jf (Join-Path $root 'src\games\hedefi-tuttur\playerStats.json')
$nameIds = ToMap (Jf "$data\tm-name-ids.json")
$perf = ToMap (Jf "$data\tm-player-performance-club.json")
$clubs = ToMap (Jf "$data\tm-clubs.json")
$comps = ToMap (Jf "$data\tm-player-competitions.json")
$profiles = ToMap (Jf "$data\tm-player-profile.json")

function Senior($clubId) {
  $c = $clubs[[string]$clubId]
  if (-not $c -or $c.nt -or $c.type -notin 0, 1, 2) { return $false }
  return -not ($c.name -match '\bU\d\d\b|Youth|Yth|Auswahl|Selec|Juniors?\b|Academy|Akademi')
}
function SeniorNT($clubId) { $c = $clubs[[string]$clubId]; return ($c -and $c.nt -and [string]$c.main -eq [string]$clubId) }

$KEYS = @(
  'n', 'ref', 'ca', 'cg', 'cs', 'nc', 'ng', 'tr', 'fe', 'h', 'b', 'y', 'r', 'ua', 'ug',
  'pla', 'plg', 'pls', 'lla', 'llg', 'lls', 'saa', 'sag', 'sas', 'bla', 'blg', 'bls', 'l1a', 'l1g', 'l1s', 'sla', 'slg', 'sls'
)
# league code -> TM competition id, and which stats already come curated from Hedefi Tuttur
$LEAGUES = [ordered]@{
  pl = @{ comp = 'GB1'; a = 'premierLeagueApps'; g = 'premierLeagueGoals'; s = $null }
  ll = @{ comp = 'ES1'; a = $null; g = 'laLigaGoals'; s = 'laLigaAssists' }
  sa = @{ comp = 'IT1'; a = 'serieAApps'; g = $null; s = 'serieAAssists' }
  bl = @{ comp = 'L1'; a = $null; g = 'bundesligaGoals'; s = $null }
  l1 = @{ comp = 'FR1'; a = $null; g = 'ligue1Goals'; s = $null }
  sl = @{ comp = 'TR1'; a = 'superLigApps'; g = 'superLigGoals'; s = $null }
}

$out = New-Object System.Collections.ArrayList
$seen = @{}
foreach ($row in $rows) {
  $name = $row.name
  if (-not $name -or $seen.ContainsKey($name)) { continue }
  $seen[$name] = 1
  # coach-only rows (Türk TD category) are not footballers of this game
  if ($null -ne $row.turkishCoachSuperLigApps -and $null -eq $row.careerTrophies -and $null -eq $row.serieAApps) { continue }
  $id = $nameIds[$name]
  $v = @{ n = $name }

  $prof = if ($id) { $profiles[$id] } else { $null }
  $birth = if ($prof -and $prof.b) { [string]$prof.b } else { $null }
  $year = if ($birth) { [int]$birth.Substring(0, 4) } else { 0 }
  $assistsOk = $year -ge 1978
  if ($birth) { $v.b = $birth }
  if ($prof -and $prof.h -ge 150) { $v.h = [int]$prof.h }

  $p = if ($id) { $perf[$id] } else { $null }
  if ($p) {
    $ca = 0; $cg = 0; $cs = 0; $y = 0; $r = 0; $nc = 0; $ng = 0
    foreach ($club in $p.PSObject.Properties) {
      $s = $club.Value
      if (Senior $club.Name) { $ca += $s[0]; $cg += $s[1]; $cs += $s[2]; $y += $s[3]; $r += $s[4] }
      elseif (SeniorNT $club.Name) { $nc += $s[0]; $ng += $s[1]; $y += $s[3]; $r += $s[4] }
    }
    if ($ca -gt 0) {
      $v.ca = $ca; $v.cg = $cg; $v.y = $y; $v.r = $r
      if ($assistsOk) { $v.cs = $cs }
    }
    $v.nc = $nc; $v.ng = $ng
  }
  # Turkey caps/goals: the curated (TFF-checked) numbers win
  if ($null -ne $row.turkeyApps) { $v.nc = [int]$row.turkeyApps }
  if ($null -ne $row.turkeyGoals) { $v.ng = [int]$row.turkeyGoals }

  if ($null -ne $row.careerTrophies) { $v.tr = [int]$row.careerTrophies }
  if ($null -ne $row.transferFees -and [double]$row.transferFees -gt 0) { $v.fe = [double]$row.transferFees }

  $c = if ($id) { $comps[$id] } else { $null }
  # Champions League (TM counts 1992+ only, so only for players born 1972+)
  if ($c -and $c.CL -and $c.CL[0] -gt 0 -and $year -ge 1972) { $v.ua = [int]$c.CL[0] }
  if ($null -ne $row.uclGoals) { $v.ug = [int]$row.uclGoals }

  foreach ($code in $LEAGUES.Keys) {
    $L = $LEAGUES[$code]
    $tm = if ($c) { $c.($L.comp) } else { $null }
    $played = $tm -and $tm[0] -gt 0
    $oldTurkish = $code -eq 'sl' -and $year -gt 0 -and $year -lt 1965
    $apps = if ($L.a -and $null -ne $row.($L.a)) { [int]$row.($L.a) } elseif ($played -and -not $oldTurkish) { [int]$tm[0] } else { $null }
    if ($null -eq $apps -or $apps -le 0) { continue }
    $v["${code}a"] = $apps
    $goals = if ($L.g -and $null -ne $row.($L.g)) { [int]$row.($L.g) } elseif ($played -and -not $oldTurkish) { [int]$tm[1] } else { $null }
    if ($null -ne $goals) { $v["${code}g"] = $goals }
    $assists = if ($L.s -and $null -ne $row.($L.s)) { [int]$row.($L.s) } elseif ($played -and $assistsOk) { [int]$tm[2] } else { $null }
    if ($null -ne $assists) { $v["${code}s"] = $assists }
  }

  if (-not $v.ca -and -not $v.pla -and -not $v.saa -and -not $v.sla) { continue }

  # Reference candidates: household names with solid (born 1968+) data. Caps
  # alone let in small-nation regulars, so they need CL games or a real fee
  # too; Turkish internationals get a lower bar (young stars like Arda Güler).
  $nc = [int]$v.nc; $ua = [int]$v.ua; $fe = [double]$v.fe; $sla = [int]$v.sla; $ca = [int]$v.ca
  $bigCareer = $ca -ge 300 -and (
    ($nc -ge 60 -and ($ua -ge 10 -or $fe -ge 20)) -or $ua -ge 40 -or [int]$v.tr -ge 12 -or $fe -ge 60 -or
    ($sla -ge 250 -and $nc -ge 20) -or ($nc -ge 40 -and ($sla -ge 100 -or [int]$v.ug -ge 5)) -or $nc -ge 90)
  $turkishStar = $null -ne $row.turkeyApps -and [int]$row.turkeyApps -ge 25 -and $ca -ge 120
  if ($year -ge 1968 -and ($bigCareer -or $turkishStar)) { $v.ref = 1 }

  [void]$out.Add(@($KEYS | ForEach-Object { if ($v.ContainsKey($_)) { $v[$_] } else { $null } }))
}

# Serialise by hand: PowerShell 5's ConvertTo-Json wraps nested arrays as
# {"Count":n,"value":[...]}.
$inv = [Globalization.CultureInfo]::InvariantCulture
function JsonValue($x) {
  if ($null -eq $x) { return 'null' }
  if ($x -is [string]) { return (ConvertTo-Json -InputObject $x -Compress) }
  return ([double]$x).ToString('R', $inv)
}
$lines = foreach ($r in $out) { '[' + (($r | ForEach-Object { JsonValue $_ }) -join ',') + ']' }
$json = '{"keys":[' + (($KEYS | ForEach-Object { JsonValue $_ }) -join ',') + '],"rows":[' + ($lines -join ',') + ']}'
[System.IO.File]::WriteAllText($outPath, $json, $utf8)
$refs = @($out | Where-Object { $_[1] -eq 1 }).Count
Write-Host "Wrote $outPath ($((Get-Item $outPath).Length) bytes): $($out.Count) players, $refs reference candidates"
