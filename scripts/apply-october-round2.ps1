# Round 2 post-window squad refresh delta (14 teams pulled from
# /players/squads on 2026-09-22). Only the confirmed, non-reserve moves.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$utf8 = [System.Text.UTF8Encoding]::new($false)

# Intra-pool moves (both from & to are tracked teams)
$intraMoves = @(
  @{ name = 'Omar Marmoush';    from = 'manchester-city';    to = 'tottenham-hotspur' }
  @{ name = 'Sávio';            from = 'manchester-city';    to = 'tottenham-hotspur' }
  @{ name = 'Savinho';          from = 'manchester-city';    to = 'tottenham-hotspur' }
  @{ name = 'Aaron Wan-Bissaka'; from = 'manchester-united'; to = 'aston-villa' }
  @{ name = 'Matteo Ruggeri';   from = 'atletico-madrid';    to = 'aston-villa' }
  @{ name = 'Ferran Torres';    from = 'barcelona';          to = 'paris-saint-germain' }
  # Renato Sanches: initially routed PSG → Galatasaray on the Round 2 diff,
  # but the user confirmed he's actually a free agent right now. Left out of
  # the moves list so re-running this script doesn't re-add him at Gala; his
  # PSG entry has already been removed by the first run.
)

# Removals — players AF confirmed are no longer at the club we had them at
$removals = @(
  @{ name = 'Fabio Miretti';    from = 'juventus';         reason = 'now on loan at Beşiktaş' }
  @{ name = 'Ernest Poku';      from = 'bayer-leverkusen'; reason = 'joined Beşiktaş, not on AF Leverkusen roster' }
  @{ name = 'Youssouf Fofana';  from = 'ac-milan';         reason = 'loan to Sevilla' }
)

# New signings from outside the pool
$newSignings = @(
  # Zion Suzuki → Aston Villa (from Parma)
  @{ team = 'aston-villa'; player = [ordered]@{
      id=9400001; name='Zion Suzuki'; slug='zion-suzuki'; position='GK';
      shirt=1; age=23; birth='2002-08-21'; height=196; marketValue=22000000;
      intlGoals=0; intlAppearances=5; assists=0; yellowCards=2; redCards=0; nationality='Japan'
    } }
  # Diego Moreira → AC Milan (from Chelsea via Strasbourg)
  @{ team = 'ac-milan'; player = [ordered]@{
      id=9400002; name='Diego Moreira'; slug='diego-moreira'; position='FW';
      shirt=22; age=22; birth='2004-08-06'; height=180; marketValue=15000000;
      intlGoals=0; intlAppearances=0; assists=6; yellowCards=6; redCards=0; nationality='Portugal'
    } }
  # Jhon Lucumí → Juventus (from Bologna)
  @{ team = 'juventus'; player = [ordered]@{
      id=9400003; name='Jhon Lucumí'; slug='jhon-lucumi'; position='DEF';
      shirt=26; age=27; birth='1998-06-24'; height=185; marketValue=28000000;
      intlGoals=0; intlAppearances=27; assists=2; yellowCards=18; redCards=0; nationality='Colombia'
    } }
  # Kamil Grabara → Juventus (from Wolfsburg)
  @{ team = 'juventus'; player = [ordered]@{
      id=9400004; name='Kamil Grabara'; slug='kamil-grabara'; position='GK';
      shirt=1; age=26; birth='1999-01-08'; height=195; marketValue=10000000;
      intlGoals=0; intlAppearances=2; assists=0; yellowCards=5; redCards=0; nationality='Poland'
    } }
  # Moussa Diaby → Bayer Leverkusen (from Al-Ittihad)
  @{ team = 'bayer-leverkusen'; player = [ordered]@{
      id=9400005; name='Moussa Diaby'; slug='moussa-diaby-return'; position='FW';
      shirt=19; age=26; birth='1999-07-07'; height=170; marketValue=30000000;
      intlGoals=2; intlAppearances=15; assists=41; yellowCards=15; redCards=0; nationality='France'
    } }
  # Aaron Wan-Bissaka → Aston Villa (from West Ham; Man Utd tenure earlier)
  @{ team = 'aston-villa'; player = [ordered]@{
      id=9400006; name='Aaron Wan-Bissaka'; slug='aaron-wan-bissaka'; position='DEF';
      shirt=29; age=28; birth='1997-11-26'; height=183; marketValue=25000000;
      intlGoals=0; intlAppearances=0; assists=17; yellowCards=25; redCards=1; nationality='England'
    } }
)

function Get-NormName { param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}
function Find-Idx { param($players, [string]$name)
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

$cache = @{}
function Get-Team { param([string]$id)
  if (-not $cache.ContainsKey($id)) {
    $p = Join-Path $teamsDir "$id.json"
    $cache[$id] = ConvertFrom-Json (Get-Content -LiteralPath $p -Raw -Encoding UTF8)
  }
  return $cache[$id]
}

$summary = @{ moves = 0; removed = 0; added = 0 }

foreach ($m in $intraMoves) {
  $from = Get-Team $m.from
  $to   = Get-Team $m.to
  $idx = Find-Idx $from.players $m.name
  if ($idx -lt 0) {
    if ((Find-Idx $to.players $m.name) -ge 0) {
      Write-Host "  skip (already at $($m.to)): $($m.name)"
    } else {
      Write-Host "  not found: $($m.name) in $($m.from)"
    }
    continue
  }
  $entry = $from.players[$idx]
  $from.players = @($from.players | Where-Object { $_ -ne $entry })
  if ((Find-Idx $to.players $entry.name) -lt 0) {
    $to.players = @($to.players) + $entry
  }
  $summary.moves++
  Write-Host "moved: $($entry.name) $($m.from) -> $($m.to)"
}

foreach ($r in $removals) {
  $t = Get-Team $r.from
  $idx = Find-Idx $t.players $r.name
  if ($idx -lt 0) {
    Write-Host "  not found: $($r.name) in $($r.from)"
    continue
  }
  $entry = $t.players[$idx]
  $t.players = @($t.players | Where-Object { $_ -ne $entry })
  $summary.removed++
  Write-Host "removed: $($entry.name) from $($r.from) ($($r.reason))"
}

foreach ($s in $newSignings) {
  $t = Get-Team $s.team
  if ((Find-Idx $t.players $s.player.name) -ge 0) {
    Write-Host "  skip (already there): $($s.player.name)"
    continue
  }
  $t.players = @($t.players) + ([pscustomobject]$s.player)
  $summary.added++
  Write-Host "added: $($s.player.name) -> $($s.team)"
}

foreach ($id in $cache.Keys) {
  $p = Join-Path $teamsDir "$id.json"
  $json = ConvertTo-Json $cache[$id] -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($p, $json, $utf8)
}

Write-Host ""
Write-Host "Moves: $($summary.moves) | Removed: $($summary.removed) | Added: $($summary.added)"
