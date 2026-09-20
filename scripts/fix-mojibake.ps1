# Fixes UTF-8 strings that were misinterpreted as CP1252 and re-written
# (mojibake), e.g. "Guimarães" -> "GuimarÃ£es". Reads each team JSON, tries
# to reverse the encoding damage on any string containing a suspicious byte
# pattern, then saves back as UTF-8 (no BOM).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$teamsDir = Join-Path $root 'src\games\draftinho\teams'

$latin1 = [System.Text.Encoding]::GetEncoding(1252)
$utf8   = [System.Text.UTF8Encoding]::new($false)

function Fix-Mojibake {
  param([string]$s)
  if (-not $s) { return $s }
  # Trigger only if the string contains typical mojibake markers:
  # a Latin-1 wrapper byte (Â/Ã/Ä/Å) immediately followed by a non-ASCII
  # character. The second byte may live in the U+0080..U+00FF range OR
  # in CP1252 punctuation slots that map to U+2000+ (†/‡/€/'/"/…).
  if ($s -notmatch '[ÂÃÄÅ][-ÿ–-™]') { return $s }
  try {
    $bytes = $latin1.GetBytes($s)
    $fixed = $utf8.GetString($bytes)
    if ($fixed -match '[ÂÃÄÅ][-ÿ–-™]') { return $s }
    return $fixed
  } catch {
    return $s
  }
}

$total = 0; $changed = 0
foreach ($f in Get-ChildItem $teamsDir -Filter '*.json') {
  $raw = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $j = ConvertFrom-Json $raw
  $touched = $false
  foreach ($p in $j.players) {
    $total++
    foreach ($prop in @('name','slug','nationality')) {
      if ($p.PSObject.Properties.Match($prop).Count -eq 0) { continue }
      $orig = [string]$p.$prop
      $new = Fix-Mojibake $orig
      if ($new -ne $orig) {
        Write-Host "  fix: '$orig' -> '$new'"
        $p.$prop = $new
        $changed++
        $touched = $true
      }
    }
  }
  if ($touched) {
    $json = ConvertTo-Json $j -Depth 20
    $json = ($json -replace "`r`n","`n")
    if (-not $json.EndsWith("`n")) { $json += "`n" }
    [System.IO.File]::WriteAllText($f.FullName, $json, $utf8)
    Write-Host "wrote: $($f.Name)"
  }
}
Write-Host "Scanned $total player entries. Fixed $changed strings."
