# User-flagged corrections after reviewing the October squad refresh report:
#   - add Pep Chavarría to Chelsea (from Rayo Vallecano, €19m)
#   - remove Toni Fernández from Barcelona (plays in the Barça B reserves)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$utf8 = [System.Text.UTF8Encoding]::new($false)

$removals = @(
  @{ name = 'Toni Fernández'; from = 'barcelona'; reason = 'Barça B reserve, not senior' }
)

$newSignings = @(
  @{ team = 'chelsea'; player = [ordered]@{
      id=9300010; name='Pep Chavarría'; slug='pep-chavarria'; position='DEF';
      shirt=29; age=27; birth='1998-04-29'; height=181; marketValue=19000000;
      intlGoals=0; intlAppearances=0; assists=17; yellowCards=18; redCards=0; nationality='Spain'
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

foreach ($r in $removals) {
  $t = Get-Team $r.from
  $idx = Find-Idx $t.players $r.name
  if ($idx -ge 0) {
    $entry = $t.players[$idx]
    $t.players = @($t.players | Where-Object { $_ -ne $entry })
    Write-Host "removed: $($entry.name) from $($r.from) ($($r.reason))"
  } else {
    Write-Host "not found: $($r.name) in $($r.from)"
  }
}
foreach ($s in $newSignings) {
  $t = Get-Team $s.team
  if ((Find-Idx $t.players $s.player.name) -ge 0) {
    Write-Host "skip (already there): $($s.player.name)"
    continue
  }
  $t.players = @($t.players) + ([pscustomobject]$s.player)
  Write-Host "added: $($s.player.name) -> $($s.team)"
}
foreach ($id in $cache.Keys) {
  $p = Join-Path $teamsDir "$id.json"
  $json = ConvertTo-Json $cache[$id] -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($p, $json, $utf8)
}
