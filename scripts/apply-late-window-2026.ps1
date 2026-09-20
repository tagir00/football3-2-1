# Late-window (last two weeks of August + Sept 1 deadline day) summer 2026
# transfer patches on top of the mid-window pass. Handles:
#   - INTRA_MOVES: relocate an existing player entry between two pool teams
#   - REMOVALS:    drop a player from a team (transfer out of pool or clean up
#                  a duplicate the mid-window script left behind)
#   - NEW_SIGNINGS: insert a fresh player record into a team (id 9100xxx)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$utf8 = [System.Text.UTF8Encoding]::new($false)

# name; from; to
$intraMoves = @(
  @{ name = 'Tosin Adarabioyo';       from = 'chelsea';           to = 'tottenham-hotspur' }
  @{ name = 'Mykhaylo Mudryk';        from = 'chelsea';           to = 'tottenham-hotspur' }
  @{ name = 'Ibrahim Mbaye';          from = 'paris-saint-germain'; to = 'aston-villa' }
  @{ name = 'Ethan Nwaneri';          from = 'arsenal';           to = 'borussia-dortmund' }
)

# name; from; reason
$removals = @(
  @{ name = 'Nick Woltemade';         from = 'newcastle-united';  reason = 'moved to Juventus (loan); mid-window pass kept him at both' }
  @{ name = 'Pape Matar Sarr';        from = 'tottenham-hotspur'; reason = 'moved to Juventus (loan); mid-window pass kept him at both' }
  @{ name = 'Diego Carlos';           from = 'fenerbahce';        reason = 'moved to Parma on deadline day' }
  @{ name = 'Fábio Vieira';           from = 'arsenal';           reason = 'moved to Hamburg SV; not in tracked pool' }
  @{ name = 'Fabio Vieira';           from = 'arsenal';           reason = 'moved to Hamburg SV; not in tracked pool' }
)

# team; player object (id auto-assigned in 9_100_xxx range)
$newSignings = @(
  @{ team = 'newcastle-united'; player = [ordered]@{
      id=9100001; name='Matias Fernandez-Pardo'; slug='matias-fernandez-pardo'; position='FW';
      shirt=$null; age=20; birth='2005-04-01'; height=178; marketValue=51000000;
      intlGoals=0; intlAppearances=0; assists=6; yellowCards=4; redCards=0; nationality='Belgium'
    } }
  @{ team = 'aston-villa'; player = [ordered]@{
      id=9100002; name='Ibrahim Mbaye'; slug='ibrahim-mbaye-villa'; position='FW';
      shirt=$null; age=18; birth='2007-08-01'; height=175; marketValue=47000000;
      intlGoals=0; intlAppearances=0; assists=2; yellowCards=2; redCards=0; nationality='Senegal'
    } }
  @{ team = 'aston-villa'; player = [ordered]@{
      id=9100003; name='Taylor Harwood-Bellis'; slug='taylor-harwood-bellis'; position='DEF';
      shirt=$null; age=23; birth='2002-01-30'; height=189; marketValue=30000000;
      intlGoals=0; intlAppearances=1; assists=1; yellowCards=8; redCards=0; nationality='England'
    } }
)

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

$teamsCache = @{}
function Get-Team {
  param([string]$id)
  if (-not $teamsCache.ContainsKey($id)) {
    $p = Join-Path $teamsDir "$id.json"
    $raw = Get-Content -LiteralPath $p -Raw -Encoding UTF8
    $teamsCache[$id] = ConvertFrom-Json $raw
  }
  return $teamsCache[$id]
}
function Save-Team {
  param([string]$id, $data)
  $p = Join-Path $teamsDir "$id.json"
  $json = ConvertTo-Json -InputObject $data -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($p, $json, $utf8)
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

$summary = @{ moves = 0; removed = 0; added = 0; notFound = @() }

foreach ($m in $intraMoves) {
  $from = Get-Team $m.from
  $to   = Get-Team $m.to
  $idx = Find-Idx $from.players $m.name
  if ($idx -lt 0) {
    if ((Find-Idx $to.players $m.name) -ge 0) {
      Write-Host "  skip (already at $($m.to)): $($m.name)"
      continue
    }
    $summary.notFound += "move $($m.name) $($m.from)->$($m.to)"
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
  $from = Get-Team $r.from
  $idx = Find-Idx $from.players $r.name
  if ($idx -lt 0) {
    $summary.notFound += "remove $($r.name) from $($r.from)"
    continue
  }
  $entry = $from.players[$idx]
  $from.players = @($from.players | Where-Object { $_ -ne $entry })
  $summary.removed++
  Write-Host "removed: $($entry.name) from $($r.from) ($($r.reason))"
}

foreach ($s in $newSignings) {
  $to = Get-Team $s.team
  if ((Find-Idx $to.players $s.player.name) -ge 0) {
    Write-Host "  skip (already there): $($s.player.name) @ $($s.team)"
    continue
  }
  $to.players = @($to.players) + ([pscustomobject]$s.player)
  $summary.added++
  Write-Host "added: $($s.player.name) -> $($s.team)"
}

foreach ($id in $teamsCache.Keys) {
  Save-Team $id $teamsCache[$id]
}

Write-Host ""
Write-Host "Moves: $($summary.moves) | Removed: $($summary.removed) | Added: $($summary.added)"
if ($summary.notFound.Count -gt 0) {
  Write-Host "Not found:"
  $summary.notFound | ForEach-Object { Write-Host "  $_" }
}
