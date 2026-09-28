# Shared by build-rastgele-besler-pool.ps1 and build-futbol321-pool.ps1.
# Expects $clubsCsv; defines $OUR_CLUBS, Get-NormClub and $clubIdToOur (TM club id -> our canonical club).

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
  'Lazio'              = @('ss lazio','societa sportiva lazio','societa sportiva lazio s p a')
  'Juventus'           = @('juventus fc','juventus turin')
  'Fenerbahce'         = @('fenerbahce sk','fenerbahce spor kulubu')
  'Galatasaray'        = @('galatasaray sk','galatasaray spor kulubu')
  'Besiktas'           = @('besiktas jk','besiktas spor kulubu','besiktas jimnastik kulubu')
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
  'Marseille'          = @('olympique marseille','olympique de marseille','om marseille')
  'Lyon'               = @('olympique lyonnais','olympique lyon','ol lyon')
  'Nice'               = @('ogc nice','ogc nice cote azur','ogcn')
  'Monaco'             = @('as monaco','associazione sportiva monaco','asm monaco')
  'Rennes'             = @('stade rennais','stade rennais fc','rennes fc')
  'Lille'              = @('losc lille','lille losc','lille olympique')
  'Toulouse'           = @('toulouse fc','tfc toulouse')
  # TM clubs.csv uses official/long names for these (kept ASCII so the script
  # parses the same with or without a UTF-8 BOM)
  'Benfica'            = @('sl benfica')
  'Genclerbirligi'     = @('genclerbirligi spor kulubu')
  'Rizespor'           = @('caykur rizespor')
  'Fiorentina'         = @('acf fiorentina')
  'Udinese'            = @('udinese calcio')
  'Como'               = @('como 1907')
  'Atalanta'           = @('atalanta bc')
  'Sassuolo'           = @('us sassuolo')
  'Stuttgart'          = @('vfb stuttgart')
  'Wolfsburg'          = @('vfl wolfsburg')
  'Athletic Club'      = @('athletic bilbao')
  'Flamengo'           = @('clube de regatas do flamengo')
  'Santos'             = @('santos futebol clube')
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
