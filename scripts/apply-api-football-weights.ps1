# Reads data/api-football-name-index.json and patches every draftinho team JSON
# with `weight` (kg or null) and `apiFootballId` per player.
# Independent from the fetch script so we can iterate on matching without
# re-consuming API quota.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'
$nameIdxPath = Join-Path $root 'data\api-football-name-index.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Get-NormName {
  param([string]$s)
  if (-not $s) { return '' }
  $s = $s.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}',''
  $s = $s.ToLowerInvariant() -replace '[^a-z0-9]+',' '
  return $s.Trim()
}

if (-not (Test-Path $nameIdxPath)) { throw "Missing $nameIdxPath — run fetch script first." }
$rawIdx = Get-Content -LiteralPath $nameIdxPath -Raw -Encoding UTF8 | ConvertFrom-Json
$byName = @{}
foreach ($prop in $rawIdx.PSObject.Properties) {
  $byName[$prop.Name] = $prop.Value
}
Write-Host "Loaded name index: $($byName.Count) entries"

$patched = 0; $withWeight = 0; $withoutWeight = 0
$missedList = @()
foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $j = ConvertFrom-Json $raw
  foreach ($p in $j.players) {
    $n = Get-NormName $p.name
    $entry = $null
    if ($byName.ContainsKey($n)) { $entry = $byName[$n] }
    if (-not $entry) {
      $lastTok = ($n -split ' ')[-1]
      $cands = @()
      foreach ($k in $byName.Keys) {
        if ((($k -split ' ')[-1]) -eq $lastTok) { $cands += $byName[$k] }
      }
      if ($cands.Count -eq 1) { $entry = $cands[0] }
      elseif ($cands.Count -gt 1) {
        $withW = $cands | Where-Object { $_.weight }
        if ($withW) { $entry = @($withW)[0] } else { $entry = $cands[0] }
      }
    }
    $weight = $null
    $afId = $null
    if ($entry) {
      if ($entry.PSObject.Properties.Match('weight').Count -gt 0) { $weight = $entry.weight }
      if ($entry.PSObject.Properties.Match('af_id').Count -gt 0)  { $afId   = $entry.af_id }
    }
    if ($weight) { $withWeight++ } else {
      $withoutWeight++
      if ($missedList.Count -lt 30) { $missedList += "$($p.name) [$($j.displayName)]" }
    }
    if ($p.PSObject.Properties.Match('weight').Count -gt 0) { $p.weight = $weight } else { $p | Add-Member -MemberType NoteProperty -Name weight -Value $weight }
    if ($p.PSObject.Properties.Match('apiFootballId').Count -gt 0) { $p.apiFootballId = $afId } else { $p | Add-Member -MemberType NoteProperty -Name apiFootballId -Value $afId }
    if ($p.PSObject.Properties.Match('trophies').Count -eq 0) { $p | Add-Member -MemberType NoteProperty -Name trophies -Value 0 }
  }
  $json = ConvertTo-Json $j -Depth 20
  $json = ($json -replace "`r`n","`n")
  if (-not $json.EndsWith("`n")) { $json += "`n" }
  [System.IO.File]::WriteAllText($f.FullName, $json, $utf8)
  $patched++
}

Write-Host "Patched $patched team JSONs. With weight: $withWeight | Missing weight: $withoutWeight"
if ($missedList.Count -gt 0) {
  Write-Host "Sample of missing-weight names:"
  $missedList | ForEach-Object { Write-Host "  $_" }
}
