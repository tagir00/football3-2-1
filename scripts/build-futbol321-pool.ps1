# Builds the 3-2-1 GO career pool from full Transfermarkt careers.
#
# Output: src/games/futbol321/playerData.json
#   [{ "name": "Edinson Cavani", "birthYear": 1987, "tier": "elite",
#      "countries": ["Uruguay"], "clubs": ["Napoli", "Paris Saint-Germain", ...] }, ...]
#
# Sources (gitignored caches in data/):
#   - data/tm-player-clubs.json  { tmId: { n: [name, artist], c: { clubId: apps } } }
#     (same cache build-rastgele-besler-pool.ps1 uses; national teams are in `c` too)
#   - data/tm-player-dob.json    { tmId: "YYYY-MM-DD" } for players missing from players.csv
#   - data/csv/archive/players.csv (birth dates, citizenship, national team ids)
#
# Rules:
#   - A club only counts for a player with >= $MIN_CLUB_APPS apps there, so a
#     pairing never hinges on a loan cameo.
#   - Players need >= $MIN_CAREER_APPS senior club apps and >= 1 counted club.
#   - Nationality = the senior national team they played most for (falls back
#     to citizenship), mapped onto the countries in data.js.
#   - The `remove` list of rastgele-besler/careerAugmentations.json is honoured.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$clubsCsv = Join-Path $root 'data\csv\archive\clubs.csv'
$playersCsv = Join-Path $root 'data\csv\archive\players.csv'
$outPath = Join-Path $root 'src\games\futbol321\playerData.json'
$augmentPath = Join-Path $root 'src\games\rastgele-besler\careerAugmentations.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$MIN_CLUB_APPS = 20
$MIN_CAREER_APPS = 150

. (Join-Path $PSScriptRoot 'lib\tracked-clubs.ps1')

# players.csv spelling -> data.js country name (only the ones that differ)
$countryAlias = @{
  'Türkiye' = 'Turkey'; "Cote d'Ivoire" = 'Ivory Coast'; 'Czech Republic' = 'Czechia'
  'Bosnia-Herzegovina' = 'Bosnia and Herzegovina'
}
$dataJs = Get-Content -LiteralPath (Join-Path $root 'src\games\futbol321\data.js') -Raw -Encoding UTF8
$ourCountries = [System.Collections.Generic.HashSet[string]]::new()
foreach ($m in [regex]::Matches($dataJs, "\[\s*'([^']+)',\s*'[a-z-]+'\s*\]")) { [void]$ourCountries.Add($m.Groups[1].Value) }
function To-OurCountry([string]$c) { if ($countryAlias.ContainsKey($c)) { $c = $countryAlias[$c] }; if ($ourCountries.Contains($c)) { return $c }; return $null }

# national team club id -> country (majority vote over players.csv), birth years
$votes = @{}; $csvById = @{}
foreach ($r in Import-Csv -LiteralPath $playersCsv) {
  $csvById[$r.player_id] = $r
  if ($r.current_national_team_id -and $r.country_of_citizenship) { $k = "$($r.current_national_team_id)|$($r.country_of_citizenship)"; $votes[$k] = [int]$votes[$k] + 1 }
}
$ntCountry = @{}; $ntBest = @{}
foreach ($k in $votes.Keys) { $a = $k.Split('|'); if ($votes[$k] -gt [int]$ntBest[$a[0]]) { $ntBest[$a[0]] = $votes[$k]; $ntCountry[$a[0]] = $a[1] } }
$dob = @{}
$dobPath = Join-Path $root 'data\tm-player-dob.json'
if (Test-Path $dobPath) { (Get-Content -LiteralPath $dobPath -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $dob[$_.Name] = $_.Value } }

$remove = @()
if (Test-Path $augmentPath) { $aug = Get-Content -LiteralPath $augmentPath -Raw -Encoding UTF8 | ConvertFrom-Json; if ($aug.remove) { $remove = @($aug.remove) } }

$tm = Get-Content -LiteralPath (Join-Path $root 'data\tm-player-clubs.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$out = New-Object System.Collections.ArrayList
$noYear = 0
foreach ($prop in $tm.PSObject.Properties) {
  $id = $prop.Name; $rec = $prop.Value
  $name = if ($rec.n[1]) { $rec.n[1] } else { $rec.n[0] }
  if (-not $name -or $remove -contains $name) { continue }
  $clubApps = @{}; $career = 0; $nat = $null; $natApps = 0
  foreach ($c in $rec.c.PSObject.Properties) {
    $apps = [int]$c.Value
    if ($ntCountry.ContainsKey($c.Name)) { if ($apps -gt $natApps) { $natApps = $apps; $nat = $ntCountry[$c.Name] }; continue }
    $career += $apps
    $cid = [int]$c.Name
    if ($clubIdToOur.ContainsKey($cid)) { $o = $clubIdToOur[$cid]; $clubApps[$o] = [int]$clubApps[$o] + $apps }
  }
  $clubs = @($clubApps.Keys | Where-Object { $clubApps[$_] -ge $MIN_CLUB_APPS } | Sort-Object)
  if ($clubs.Count -eq 0 -or $career -lt $MIN_CAREER_APPS) { continue }
  $csv = $csvById[$id]
  if (-not $nat -and $csv) { $nat = $csv.country_of_citizenship }
  $birth = if ($csv -and $csv.date_of_birth) { $csv.date_of_birth } elseif ($dob[$id]) { $dob[$id] } else { $null }
  if (-not $birth) { $noYear++; continue }
  $country = To-OurCountry $nat
  $tier = if ($career -ge 500) { 'elite' } elseif ($career -ge 300) { 'high' } else { 'solid' }
  [void]$out.Add([ordered]@{ name = $name; birthYear = [int]$birth.Substring(0, 4); tier = $tier; countries = @(if ($country) { $country }); clubs = $clubs; _apps = $career })
}
Write-Host "Pool: $($out.Count) players (skipped $noYear without a birth date)"

$sorted = $out | Sort-Object -Property { -$_._apps }
foreach ($p in $sorted) { $p.Remove('_apps') }
# one player per line keeps diffs readable
$lines = $sorted | ForEach-Object { '  ' + (ConvertTo-Json $_ -Depth 3 -Compress) }
[System.IO.File]::WriteAllText($outPath, "[`n" + ($lines -join ",`n") + "`n]`n", $utf8)
Write-Host "Wrote $outPath ($((Get-Item $outPath).Length) bytes)"
