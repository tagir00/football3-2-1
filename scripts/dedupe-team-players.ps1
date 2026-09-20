# Removes duplicate player entries in draftinho team JSONs. When a player
# appears twice (same normalized name), we keep the entry with the real TM
# id (usually < 8_000_000) and drop the fabricated new-signing id (9_000_xxx)
# I created earlier when the real entry was hidden behind a mojibake name.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

$removed = @()
foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $j = ConvertFrom-Json $raw
  # Group by normalized name
  $seen = @{}
  $keep = @()
  foreach ($p in $j.players) {
    $n = Get-NormName $p.name
    if (-not $seen.ContainsKey($n)) {
      $seen[$n] = @($p)
    } else {
      $seen[$n] += $p
    }
  }
  $anyDup = $false
  foreach ($n in $seen.Keys) {
    $group = @($seen[$n])
    if ($group.Count -eq 1) {
      $keep += $group[0]
    } else {
      $anyDup = $true
      # Prefer the entry with a real TM id (< 8_000_000). If none, keep the
      # richest one (has clubApps / weight populated).
      $real = $group | Where-Object { [long]$_.id -lt 8000000 }
      if ($real) {
        $chosen = $real | Select-Object -First 1
        foreach ($drop in $group | Where-Object { $_ -ne $chosen }) {
          $removed += "$($f.Name): dropped id $($drop.id) '$($drop.name)'"
        }
        $keep += $chosen
      } else {
        # No real id; keep the first
        $keep += $group[0]
        foreach ($drop in ($group | Select-Object -Skip 1)) {
          $removed += "$($f.Name): dropped id $($drop.id) '$($drop.name)' (no real id available)"
        }
      }
    }
  }
  if ($anyDup) {
    $j.players = $keep
    $json = ConvertTo-Json $j -Depth 20
    $json = ($json -replace "`r`n","`n")
    if (-not $json.EndsWith("`n")) { $json += "`n" }
    [System.IO.File]::WriteAllText($f.FullName, $json, $utf8)
  }
}
$removed | ForEach-Object { Write-Host $_ }
Write-Host "Removed $($removed.Count) duplicate rows"
