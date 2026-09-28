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

. (Join-Path $PSScriptRoot 'lib\tracked-clubs.ps1')

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

# 2b) Full-career club histories from Transfermarkt (data/tm-player-clubs.json,
#     { "<tm id>": { "n": [name, artistName], "c": { "<clubId>": apps } } }).
#     appearances.csv only starts in 2012, so pre-2012 stints (and retired
#     legends) are missing without this. When a player is in the cache, TM's
#     club list replaces the CSV-derived one.
$tmCareerPath = Join-Path $root 'data\tm-player-clubs.json'
if (Test-Path $tmCareerPath) {
  $tmCareers = Get-Content -LiteralPath $tmCareerPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $tmUsed = 0
  foreach ($prop in $tmCareers.PSObject.Properties) {
    $pid_ = [int]$prop.Name; $rec = $prop.Value
    $name = if ($rec.n[1]) { $rec.n[1] } else { $rec.n[0] }
    if (-not $name) { continue }
    $clubsSet = [System.Collections.Generic.HashSet[string]]::new()
    $totalApps = 0; $trackedApps = 0
    foreach ($c in $rec.c.PSObject.Properties) {
      $apps = [int]$c.Value; $totalApps += $apps
      $cid = [int]$c.Name
      if ($apps -gt 0 -and $clubIdToOur.ContainsKey($cid)) { [void]$clubsSet.Add($clubIdToOur[$cid]); $trackedApps += $apps }
    }
    if ($players.ContainsKey($pid_)) { $name = $players[$pid_].name }  # keep the CSV spelling the game already uses
    $players[$pid_] = @{ name = $name; clubs = $clubsSet; totalApps = $totalApps; trackedApps = $trackedApps }
    $tmUsed++
  }
  Write-Host "Applied Transfermarkt career histories to $tmUsed players"
}

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

# 4) Merge manual patches: `add` = extra clubs to merge in, `override` =
#    replace the whole clubs list. Only clubs in our tracked list survive.
if (Test-Path $augmentPath) {
  $augRaw = Get-Content -LiteralPath $augmentPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $addMap = @{}
  $overrideMap = @{}
  if ($augRaw.PSObject.Properties.Match('add').Count -gt 0) {
    foreach ($prop in $augRaw.add.PSObject.Properties) {
      $addMap[$prop.Name] = @($prop.Value)
    }
  }
  if ($augRaw.PSObject.Properties.Match('override').Count -gt 0) {
    foreach ($prop in $augRaw.override.PSObject.Properties) {
      $overrideMap[$prop.Name] = @($prop.Value)
    }
  }
  $trackedSet = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($c in $OUR_CLUBS) { [void]$trackedSet.Add($c) }
  $augmentedCount = 0
  $overriddenCount = 0
  $addedClubs = 0
  foreach ($p in $out) {
    if ($overrideMap.ContainsKey($p.name)) {
      $clean = $overrideMap[$p.name] | Where-Object { $trackedSet.Contains($_) } | Sort-Object -Unique
      $p.clubs = @($clean)
      $overriddenCount++
      continue
    }
    if ($addMap.ContainsKey($p.name)) {
      $extra = $addMap[$p.name] | Where-Object { $trackedSet.Contains($_) }
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
  Write-Host "Applied add to $augmentedCount players (+$addedClubs clubs), override to $overriddenCount players"
  # `remove` drops players from the pool entirely (user-requested exclusions)
  if ($augRaw.PSObject.Properties.Match('remove').Count -gt 0) {
    $removeSet = @($augRaw.remove)
    $before = @($out).Count
    $out = @($out | Where-Object { $removeSet -notcontains $_.name })
    Write-Host "Removed $($before - $out.Count) players listed in remove"
  }
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
foreach ($needle in @('Emre Can','Toni Kroos','Marcelo','Piqué','Casemiro','Mario Gotze','Reus','Bale','Harvey Barnes','Kai Havertz','Jamal Musiala','Greenwood','Zlatan','Cristiano')) {
  $found = $out | Where-Object { $_.name -like "*$needle*" } | Select-Object -First 3
  if ($found) { $hits[$needle] = ($found | ForEach-Object { "$($_.name) => [$($_.clubs -join ', ')] ($($_.apps) apps)" }) }
}
$hits | ConvertTo-Json -Depth 3
