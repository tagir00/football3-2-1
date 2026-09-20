# Aggregates career club appearances from Transfermarkt appearances.csv
# by NAME match (our JSON ids don't align with the CSV's TM ids).
# Then patches team JSONs with a `clubApps` field.
#
# Strategy:
#   1. CSV pass builds a map: tm_player_id -> { name, count }
#   2. Second pass builds normName -> [{tm_id, count}, ...]
#   3. For each JSON player, look up by normalized name. Pick highest-count match
#      (assumes the star player has more career apps than a namesake).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$appsCsv = Join-Path $root 'data\csv\archive\appearances.csv'
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$outMap = Join-Path $root 'data\club-apps-by-name.json'

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

Write-Host 'Building tm_id -> {name, count} from appearances.csv ...'
$idInfo = @{}
$sr = [System.IO.File]::OpenText($appsCsv)
$total = 0
try {
  $null = $sr.ReadLine()  # header
  while (($line = $sr.ReadLine()) -ne $null) {
    $total++
    # columns: appearance_id, game_id, player_id, club_id, current_club_id, date, player_name, competition, yellow, red, goals, assists, minutes
    $parts = $line.Split(',', 8)  # split into at most 8 pieces
    if ($parts.Length -lt 7) { continue }
    $pid_ = 0
    if (-not [int]::TryParse($parts[2], [ref]$pid_)) { continue }
    $name = $parts[6]
    if ($idInfo.ContainsKey($pid_)) {
      $idInfo[$pid_].count = $idInfo[$pid_].count + 1
    } else {
      $idInfo[$pid_] = @{ name = $name; count = 1 }
    }
    if ($total % 300000 -eq 0) { Write-Host "  ...scanned $total rows" }
  }
} finally { $sr.Dispose() }
Write-Host "Scanned $total rows. Distinct TM ids: $($idInfo.Count)"

Write-Host 'Building normalized-name lookup ...'
$byName = @{}
foreach ($kv in $idInfo.GetEnumerator()) {
  $n = Get-NormName $kv.Value.name
  if (-not $n) { continue }
  if (-not $byName.ContainsKey($n)) { $byName[$n] = @() }
  $byName[$n] += ,@{ tmId = $kv.Key; count = $kv.Value.count; rawName = $kv.Value.name }
}
Write-Host "Distinct normalized names: $($byName.Count)"

# Patch JSONs
$matched = 0; $missed = 0; $missList = @()
$sampleTop = @()

foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $j = ConvertFrom-Json $raw
  foreach ($p in $j.players) {
    $n = Get-NormName $p.name
    $apps = 0
    $tmId = $null
    if ($byName.ContainsKey($n)) {
      # NOTE: hashtable has a built-in .Count (# of keys) that shadows our
      # 'count' key when Sort-Object -Property count is used. Use a script
      # block so PowerShell reads the dictionary entry instead.
      $best = $byName[$n] | Sort-Object -Property {[int]$_.count} -Descending | Select-Object -First 1
      $apps = [int]$best.count
      $tmId = $best.tmId
      $matched++
    } else {
      # fall back: last-token match (surname)
      $lastTok = ($n -split ' ')[-1]
      $candidates = @()
      foreach ($k in $byName.Keys) {
        if ((($k -split ' ')[-1]) -eq $lastTok) {
          $candidates += $byName[$k]
        }
      }
      if ($candidates.Count -gt 0) {
        $best = $candidates | Sort-Object -Property {[int]$_.count} -Descending | Select-Object -First 1
        $apps = [int]$best.count
        $tmId = $best.tmId
        $matched++
      } else {
        $missed++
        if ($missList.Count -lt 40) { $missList += "$($p.name) [$($j.displayName)]" }
      }
    }
    if ($p.PSObject.Properties.Match('clubApps').Count -gt 0) {
      $p.clubApps = $apps
    } else {
      $p | Add-Member -MemberType NoteProperty -Name clubApps -Value $apps
    }
  }
  $json = ConvertTo-Json $j -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($f.FullName, $json, [System.Text.UTF8Encoding]::new($false))
  $topN = $j.players | Sort-Object -Property clubApps -Descending | Select-Object -First 3
  foreach ($tp in $topN) { $sampleTop += "$($j.displayName) - $($tp.name): $($tp.clubApps)" }
}

Write-Host ""
Write-Host "Matched: $matched | Missed: $missed"
Write-Host ""
Write-Host "Sample top-3 per team:"
$sampleTop | Select-Object -First 15 | ForEach-Object { Write-Host "  $_" }
Write-Host ""
if ($missList.Count -gt 0) {
  Write-Host "Sample of missed names (need manual patch or alt source):"
  $missList | ForEach-Object { Write-Host "  $_" }
}
