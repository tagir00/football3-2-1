# Post-window refresh delta from the AF /players/squads pass on the first 10
# teams. Only the confirmed non-reserve additions the user approved.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$utf8 = [System.Text.UTF8Encoding]::new($false)

# Removals (moves out): { name; from }
$removals = @(
  @{ name = 'Dominik Livaković'; from = 'fenerbahce'; reason = 'moved to Barcelona (AF squad confirms Livaković at BAR)' }
)

# team; player object
$newSignings = @(
  # João Cancelo → Barcelona
  @{ team = 'barcelona'; player = [ordered]@{
      id=9300001; name='João Cancelo'; slug='joao-cancelo'; position='DEF';
      shirt=2; age=32; birth='1994-05-27'; height=182; marketValue=15000000;
      intlGoals=1; intlAppearances=61; assists=39; yellowCards=40; redCards=2; nationality='Portugal'
    } }
  # Dominik Livaković → Barcelona (GK)
  @{ team = 'barcelona'; player = [ordered]@{
      id=9300002; name='Dominik Livaković'; slug='dominik-livakovic'; position='GK';
      shirt=25; age=31; birth='1995-01-09'; height=186; marketValue=6000000;
      intlGoals=0; intlAppearances=79; assists=1; yellowCards=3; redCards=0; nationality='Croatia'
    } }
  # Fabinho → Trabzonspor
  @{ team = 'trabzonspor'; player = [ordered]@{
      id=9300003; name='Fabinho'; slug='fabinho-trabzon'; position='MID';
      shirt=6; age=32; birth='1993-10-23'; height=188; marketValue=8000000;
      intlGoals=1; intlAppearances=32; assists=17; yellowCards=57; redCards=2; nationality='Brazil'
    } }
  # Franculino Djú → Trabzonspor
  @{ team = 'trabzonspor'; player = [ordered]@{
      id=9300004; name='Franculino Djú'; slug='franculino-dju'; position='FW';
      shirt=9; age=21; birth='2004-06-15'; height=185; marketValue=18000000;
      intlGoals=1; intlAppearances=10; assists=5; yellowCards=7; redCards=0; nationality='Guinea-Bissau'
    } }
  # Fabio Miretti → Beşiktaş (loan from Juve)
  @{ team = 'besiktas'; player = [ordered]@{
      id=9300005; name='Fabio Miretti'; slug='fabio-miretti'; position='MID';
      shirt=21; age=22; birth='2003-08-03'; height=185; marketValue=12000000;
      intlGoals=0; intlAppearances=1; assists=5; yellowCards=15; redCards=0; nationality='Italy'
    } }
  # Emmanuel Poku → Beşiktaş
  @{ team = 'besiktas'; player = [ordered]@{
      id=9300006; name='Emmanuel Poku'; slug='emmanuel-poku'; position='FW';
      shirt=17; age=21; birth='2004-05-01'; height=180; marketValue=6000000;
      intlGoals=0; intlAppearances=0; assists=3; yellowCards=3; redCards=0; nationality='Ghana'
    } }
  # El Chadaille Bitshiabu → Galatasaray (loan from RB Leipzig)
  @{ team = 'galatasaray'; player = [ordered]@{
      id=9300007; name='El Chadaille Bitshiabu'; slug='el-chadaille-bitshiabu'; position='DEF';
      shirt=3; age=20; birth='2005-05-16'; height=196; marketValue=25000000;
      intlGoals=0; intlAppearances=0; assists=1; yellowCards=6; redCards=0; nationality='France'
    } }
)

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}
function Find-Idx {
  param($players, [string]$name)
  $t = Get-NormName $name
  for ($i=0; $i -lt $players.Count; $i++) {
    if ((Get-NormName $players[$i].name) -eq $t) { return $i }
  }
  $lastTok = ($t -split ' ')[-1]
  for ($i=0; $i -lt $players.Count; $i++) {
    $pn = Get-NormName $players[$i].name
    if ((($pn -split ' ')[-1]) -eq $lastTok) { return $i }
  }
  return -1
}

$teamsCache = @{}
function Get-Team { param([string]$id)
  if (-not $teamsCache.ContainsKey($id)) {
    $p = Join-Path $teamsDir "$id.json"
    $raw = Get-Content -LiteralPath $p -Raw -Encoding UTF8
    $teamsCache[$id] = ConvertFrom-Json $raw
  }
  return $teamsCache[$id]
}

foreach ($r in $removals) {
  $t = Get-Team $r.from
  $idx = Find-Idx $t.players $r.name
  if ($idx -ge 0) {
    $entry = $t.players[$idx]
    $t.players = @($t.players | Where-Object { $_ -ne $entry })
    Write-Host "removed: $($entry.name) from $($r.from)"
  }
}

foreach ($s in $newSignings) {
  $t = Get-Team $s.team
  if ((Find-Idx $t.players $s.player.name) -ge 0) {
    Write-Host "skip (already there): $($s.player.name) @ $($s.team)"
    continue
  }
  $t.players = @($t.players) + ([pscustomobject]$s.player)
  Write-Host "added: $($s.player.name) -> $($s.team)"
}

foreach ($id in $teamsCache.Keys) {
  $p = Join-Path $teamsDir "$id.json"
  $json = ConvertTo-Json $teamsCache[$id] -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($p, $json, $utf8)
}
