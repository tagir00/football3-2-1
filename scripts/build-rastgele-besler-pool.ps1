# Builds an expanded career-club-history pool for Rastgele Beşler from the
# Transfermarkt appearances.csv + clubs.csv.
#
# Output: src/games/rastgele-besler/playerPool.json
#   [{ "name": "Emre Can", "clubs": ["Liverpool", "Borussia Dortmund", ...],
#      "apps": 412 }, ...]
#
# Filters:
#   - Only clubs that map to one of our 79 tracked clubs (data.js `clubs`)
#   - Only players with >= 2 tracked clubs (so they're useful for crossings)
#   - Only players with >= 50 total appearances (avoid one-cap wonders)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$appsCsv = Join-Path $root 'data\csv\archive\appearances.csv'
$clubsCsv = Join-Path $root 'data\csv\archive\clubs.csv'
$outPath = Join-Path $root 'src\games\rastgele-besler\playerPool.json'
$augmentPath = Join-Path $root 'src\games\rastgele-besler\careerAugmentations.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

# The 79 clubs from src/games/futbol321/data.js (kept in sync manually — small
# list, changes rarely). Case- and diacritic-insensitive matching handles most
# variant TM spellings; entries here use our canonical (display) form.
$OUR_CLUBS = @(
  # Premier League
  'Arsenal','Aston Villa','Bournemouth','Brentford','Brighton & Hove Albion',
  'Burnley','Chelsea','Crystal Palace','Everton','Fulham','Leeds United',
  'Liverpool','Manchester City','Manchester United','Newcastle United',
  'Nottingham Forest','Sunderland','Tottenham Hotspur','West Ham United',
  'Wolverhampton Wanderers',
  # LaLiga
  'Athletic Club','Atletico Madrid','Barcelona','Girona','Rayo Vallecano',
  'Real Betis','Real Madrid','Real Sociedad','Sevilla','Valencia','Villarreal',
  # Bundesliga
  'Bayer Leverkusen','Bayern Munich','Borussia Dortmund',
  'Borussia Monchengladbach','Eintracht Frankfurt','Hamburger SV','RB Leipzig',
  'Werder Bremen','Wolfsburg','Stuttgart',
  # Serie A
  'Atalanta','Como','Fiorentina','Inter Milan','Juventus','Lazio','AC Milan',
  'Napoli','Roma','Sassuolo','Torino','Udinese',
  # Ligue 1
  'Lille','Lyon','Marseille','Monaco','Nice','Paris Saint-Germain','Rennes',
  'Toulouse',
  # Süper Lig
  'Alanyaspor','Antalyaspor','Basaksehir','Besiktas','Eyupspor','Fatih Karagumruk',
  'Fenerbahce','Galatasaray','Gaziantep FK','Genclerbirligi','Goztepe',
  'Kasimpasa','Kayserispor','Kocaelispor','Konyaspor','Rizespor','Samsunspor',
  'Trabzonspor',
  # Extras
  'Ajax','Benfica','Sporting CP','PSV Eindhoven','Flamengo','Santos'
)

function Get-NormClub {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant()
  # strip common noise words / prefixes / suffixes
  $s = $s -replace '\bfc\b|\bcf\b|\bfk\b|\bfs\b|\bafc\b|\bssc\b|\bac\b|\basc\b|\bsc\b|\ba\.c\.\b|\br\.c\.d\.\b|\bs\.c\.\b|\brcd\b|\brc\b|\bcd\b|\bud\b|\bdeportivo\b',''
  $s = $s -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

$ourNormMap = @{}   # normalized -> canonical name
foreach ($c in $OUR_CLUBS) {
  $ourNormMap[(Get-NormClub $c)] = $c
}

# Also register common TM variants explicitly (some TM names strip differently)
$manualAliases = @{
  'Bayern Munich'      = @('bayern munchen','fc bayern munich','fc bayern munchen')
  'Borussia Monchengladbach' = @('borussia moenchengladbach','borussia mgladbach','moenchengladbach','monchengladbach')
  'Sporting CP'        = @('sporting lisbon','sporting clube de portugal','sporting')
  'Nottingham Forest'  = @('nottingham forest fc','notts forest')
  'Real Sociedad'      = @('real sociedad de futbol')
  'Barcelona'          = @('fc barcelona')
  'Atletico Madrid'    = @('atletico de madrid','club atletico de madrid')
  'AC Milan'           = @('milan','ac milan')
  'Inter Milan'        = @('internazionale','fc internazionale')
  'Napoli'             = @('ssc napoli')
  'Roma'               = @('as roma','associazione sportiva roma')
  'Lazio'              = @('ss lazio','societa sportiva lazio')
  'Juventus'           = @('juventus fc','juventus turin')
  'Fenerbahce'         = @('fenerbahce sk','fenerbahce spor kulubu')
  'Galatasaray'        = @('galatasaray sk','galatasaray spor kulubu')
  'Besiktas'           = @('besiktas jk','besiktas spor kulubu')
  'PSV Eindhoven'      = @('psv','philips sport vereniging')
  'Ajax'               = @('ajax amsterdam','afc ajax')
  'Fatih Karagumruk'   = @('karagumruk','fatih karagumruk sk')
  'Girona'             = @('girona fc')
  'Real Betis'         = @('real betis balompie')
  'Werder Bremen'      = @('sv werder bremen')
  'Bayer Leverkusen'   = @('bayer 04 leverkusen','bayer 04')
  'Borussia Dortmund'  = @('bvb','bvb borussia dortmund')
  'RB Leipzig'         = @('rasenballsport leipzig')
  'Eintracht Frankfurt'= @('eintracht frankfurt fussball ag')
  'Manchester United'  = @('man utd','man united','manchester utd')
  'Manchester City'    = @('man city','manchester city fc')
  'Tottenham Hotspur'  = @('tottenham','spurs')
  'Newcastle United'   = @('newcastle','newcastle utd')
  'West Ham United'    = @('west ham','west ham utd')
  'Aston Villa'        = @('aston villa fc')
  'Brighton & Hove Albion' = @('brighton','brighton hove albion','brighton and hove albion','albion brighton')
  'Wolverhampton Wanderers' = @('wolves','wolverhampton','wolverhampton fc')
  'Paris Saint-Germain'= @('paris sg','paris saintgermain','psg','paris s g')
}
foreach ($canon in $manualAliases.Keys) {
  foreach ($alias in $manualAliases[$canon]) {
    $n = Get-NormClub $alias
    if ($n) { $ourNormMap[$n] = $canon }
  }
}

Write-Host "Built our-club norm map: $($ourNormMap.Count) entries covering $($OUR_CLUBS.Count) clubs"

# 1) Load clubs.csv → clubId → canonicalOurClub (or $null)
Write-Host 'Loading clubs.csv ...'
$clubIdToOur = @{}
$sr = [System.IO.File]::OpenText($clubsCsv)
try {
  $null = $sr.ReadLine()
  while (($line = $sr.ReadLine()) -ne $null) {
    $parts = $line.Split(',', 4)
    if ($parts.Length -lt 3) { continue }
    $cid = 0; if (-not [int]::TryParse($parts[0], [ref]$cid)) { continue }
    $name = $parts[2]
    $n = Get-NormClub $name
    if ($ourNormMap.ContainsKey($n)) {
      $clubIdToOur[$cid] = $ourNormMap[$n]
    }
  }
} finally { $sr.Dispose() }
Write-Host "Matched $($clubIdToOur.Count) club_ids to our 79 canonical clubs"

# 2) Stream appearances.csv → per player_id: name, tracked clubs set, and BOTH
#    tracked-apps and totalApps so we can still tell if a player is famous
#    even when only one of their clubs is in our 79 (e.g., Harvey Barnes at
#    Newcastle only; his Leicester years boost his career total).
Write-Host 'Streaming appearances.csv ...'
$players = @{}  # player_id -> @{ name; clubs Set; totalApps; trackedApps }
$sr = [System.IO.File]::OpenText($appsCsv)
$total = 0
try {
  $null = $sr.ReadLine()
  while (($line = $sr.ReadLine()) -ne $null) {
    $total++
    $parts = $line.Split(',', 8)
    if ($parts.Length -lt 7) { continue }
    $pid_ = 0
    if (-not [int]::TryParse($parts[2], [ref]$pid_)) { continue }
    $cid = 0
    if (-not [int]::TryParse($parts[3], [ref]$cid)) { continue }
    $name = $parts[6]

    if (-not $players.ContainsKey($pid_)) {
      $players[$pid_] = @{
        name = $name
        clubs = [System.Collections.Generic.HashSet[string]]::new()
        totalApps = 0
        trackedApps = 0
      }
    }
    $players[$pid_].totalApps += 1
    if ($clubIdToOur.ContainsKey($cid)) {
      [void]$players[$pid_].clubs.Add($clubIdToOur[$cid])
      $players[$pid_].trackedApps += 1
    }
    if ($total % 300000 -eq 0) { Write-Host "  ...scanned $total rows, $($players.Count) players so far" }
  }
} finally { $sr.Dispose() }
Write-Host "Scanned $total rows. Distinct players: $($players.Count)"

# 3) Filter — keep any player who touched >=1 of our clubs AND has a career
#    footprint big enough to be recognizable:
#      - >=2 tracked clubs: >=50 tracked apps OR >=100 total apps
#      - Exactly 1 tracked : >=100 tracked apps OR >=200 total apps
$out = @()
foreach ($p in $players.Values) {
  $numTracked = $p.clubs.Count
  if ($numTracked -lt 1) { continue }
  if ($numTracked -ge 2) {
    if ($p.trackedApps -lt 50 -and $p.totalApps -lt 100) { continue }
  } else {
    if ($p.trackedApps -lt 100 -and $p.totalApps -lt 200) { continue }
  }
  $sortedClubs = @($p.clubs) | Sort-Object
  $out += [ordered]@{ name = $p.name; clubs = $sortedClubs; apps = $p.totalApps }
}
Write-Host "Pool after filter: $($out.Count)"

# 4) Merge career augmentations (pre-2012 clubs added by hand for legends whose
#    early career is missing from the TM CSV). We only ADD clubs — never
#    remove — and only if the augmented club is in our tracked list.
if (Test-Path $augmentPath) {
  $augRaw = Get-Content -LiteralPath $augmentPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $augMap = @{}
  foreach ($prop in $augRaw.PSObject.Properties) {
    if ($prop.Name.StartsWith('_')) { continue }
    $augMap[$prop.Name] = @($prop.Value)
  }
  $trackedSet = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($c in $OUR_CLUBS) { [void]$trackedSet.Add($c) }
  $augmentedCount = 0
  $addedClubs = 0
  foreach ($p in $out) {
    if ($augMap.ContainsKey($p.name)) {
      $extra = $augMap[$p.name] | Where-Object { $trackedSet.Contains($_) }
      if (-not $extra) { continue }
      $current = [System.Collections.Generic.HashSet[string]]::new()
      foreach ($c in $p.clubs) { [void]$current.Add($c) }
      $before = $current.Count
      foreach ($c in $extra) { [void]$current.Add($c) }
      if ($current.Count -gt $before) {
        $p.clubs = @($current) | Sort-Object
        $augmentedCount++
        $addedClubs += ($current.Count - $before)
      }
    }
  }
  Write-Host "Applied augmentations to $augmentedCount players (+$addedClubs club entries)"
} else {
  Write-Host "No augmentation file at $augmentPath — skipping."
}

# Sort by apps descending so the frontend keeps the strongest names on top
$out = $out | Sort-Object -Property { -$_.apps }

# 5) Emit compact JSON
[System.IO.File]::WriteAllText($outPath, (ConvertTo-Json $out -Depth 4 -Compress), $utf8)
Write-Host "Wrote $outPath ($((Get-Item $outPath).Length) bytes)"

# Quick sanity checks
$hits = @{}
foreach ($needle in @('Emre Can','Toni Kroos','Marcelo','Piqué','Casemiro','Mario Gotze','Reus','Bale','Harvey Barnes','Kai Havertz','Jamal Musiala')) {
  $found = $out | Where-Object { $_.name -like "*$needle*" } | Select-Object -First 3
  if ($found) { $hits[$needle] = ($found | ForEach-Object { "$($_.name) => [$($_.clubs -join ', ')] ($($_.apps) apps)" }) }
}
$hits | ConvertTo-Json -Depth 3
