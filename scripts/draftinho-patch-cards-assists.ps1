# Patch Draftinho team JSONs with per-player yellow/red card and assist totals.
# Draftinho's `id` field is NOT the Transfermarkt player_id, so we match by
# (normalized name + date of birth) against players.csv, then join to the
# aggregated totals from appearances.csv.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$playersCsv = Join-Path $root 'data\csv\archive\players.csv'
$totalsCsv  = Join-Path $root 'data\csv\player_totals_events.csv'
$teamsDir      = Join-Path $root 'src\games\draftinho\teams'
$nationalsDir  = Join-Path $root 'src\games\draftinho\national-teams'
$unmatchedPath = Join-Path $root 'data\draftinho-unmatched-players.json'

function Get-NormalizedName {
    param([string]$Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return '' }
    # Strip accents/diacritics via Unicode normalization
    $normalized = $Name.Normalize([Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($ch in $normalized.ToCharArray()) {
        $cat = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
        if ($cat -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($ch)
        }
    }
    $s = $sb.ToString().ToLowerInvariant()
    $s = ($s -replace '[^a-z0-9]+', ' ').Trim()
    return $s
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Output "Loading totals..."
$totals = @{}
Import-Csv -Path $totalsCsv -Encoding UTF8 | ForEach-Object {
    $totals[[int]$_.player_id] = [pscustomobject]@{
        yellow  = [int]$_.yellow_club
        red     = [int]$_.red_club
        assists = [int]$_.assists_club
    }
}
Write-Output ("  {0} players in totals" -f $totals.Count)

Write-Output "Loading players.csv and building match index..."
# Indexes:
#  byNameBirth : normalizedName + '|' + birth -> player_id  (strict)
#  byName      : normalizedName                -> [player_id, ...]
#  byBirth     : birth date                    -> [ {id, tokens} ]  for fuzzy fallback
$byNameBirth = @{}
$byName = @{}
$byBirth = @{}
Import-Csv -Path $playersCsv -Encoding UTF8 | ForEach-Object {
    $tmPid = [int]$_.player_id
    $nk = Get-NormalizedName $_.name
    if (-not $nk) { return }
    $birth = ''
    if ($_.date_of_birth) { $birth = ($_.date_of_birth -split ' ')[0] }
    if ($birth) {
        $key = "$nk|$birth"
        if (-not $byNameBirth.ContainsKey($key)) {
            $byNameBirth[$key] = $tmPid
        }
        if (-not $byBirth.ContainsKey($birth)) {
            $byBirth[$birth] = New-Object System.Collections.Generic.List[object]
        }
        $tokens = ($nk -split '\s+') | Where-Object { $_.Length -ge 3 }
        $byBirth[$birth].Add([pscustomobject]@{ id = $tmPid; tokens = $tokens })
    }
    if (-not $byName.ContainsKey($nk)) { $byName[$nk] = New-Object System.Collections.Generic.List[int] }
    $byName[$nk].Add($tmPid)
}
Write-Output ("  {0} name+birth keys, {1} name keys, {2} birth dates" -f $byNameBirth.Count, $byName.Count, $byBirth.Count)

$allMissing = New-Object System.Collections.Generic.List[object]
$grandMatched = 0
$grandTotal = 0

$files = @(Get-ChildItem -Path $teamsDir -Filter *.json) + @(Get-ChildItem -Path $nationalsDir -Filter *.json)
foreach ($file in $files) {
    $data = Get-Content -Raw -Path $file.FullName -Encoding UTF8 | ConvertFrom-Json
    $matched = 0
    foreach ($p in $data.players) {
        $nk = Get-NormalizedName $p.name
        $birth = $p.birth
        $tmId = $null

        if ($birth -and $byNameBirth.ContainsKey("$nk|$birth")) {
            $tmId = $byNameBirth["$nk|$birth"]
        } elseif ($byName.ContainsKey($nk) -and $byName[$nk].Count -eq 1) {
            # Fall back to name-only if there is exactly one candidate
            $tmId = $byName[$nk][0]
        } elseif ($birth -and $byBirth.ContainsKey($birth)) {
            # Fuzzy: same birth date + at least one shared name token (>=3 chars)
            $draftTokens = ($nk -split '\s+') | Where-Object { $_.Length -ge 3 }
            $candidates = @()
            foreach ($cand in $byBirth[$birth]) {
                foreach ($t in $cand.tokens) {
                    if ($draftTokens -contains $t) { $candidates += $cand.id; break }
                }
            }
            $unique = $candidates | Select-Object -Unique
            if ($unique.Count -eq 1) { $tmId = $unique[0] }
        }

        if ($null -ne $tmId -and $totals.ContainsKey($tmId)) {
            $t = $totals[$tmId]
            $p | Add-Member -NotePropertyName assists     -NotePropertyValue $t.assists -Force
            $p | Add-Member -NotePropertyName yellowCards -NotePropertyValue $t.yellow  -Force
            $p | Add-Member -NotePropertyName redCards    -NotePropertyValue $t.red     -Force
            $matched++
        } else {
            $p | Add-Member -NotePropertyName assists     -NotePropertyValue 0 -Force
            $p | Add-Member -NotePropertyName yellowCards -NotePropertyValue 0 -Force
            $p | Add-Member -NotePropertyName redCards    -NotePropertyValue 0 -Force
            $allMissing.Add([pscustomobject]@{
                team  = $file.Name
                id    = $p.id
                name  = $p.name
                birth = $p.birth
            })
        }
    }
    $total = $data.players.Count
    $grandMatched += $matched
    $grandTotal   += $total
    Write-Output ("  {0,-30} {1}/{2} matched" -f $file.Name, $matched, $total)

    $json = $data | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($file.FullName, $json, $Utf8NoBom)
}

Write-Output ""
Write-Output ("Grand total: {0}/{1} players matched" -f $grandMatched, $grandTotal)
Write-Output ("Unmatched: {0}" -f $allMissing.Count)

if ($allMissing.Count -gt 0) {
    $unmatchedJson = $allMissing | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($unmatchedPath, $unmatchedJson, $Utf8NoBom)
    Write-Output ("  wrote unmatched list to {0}" -f $unmatchedPath)
}
