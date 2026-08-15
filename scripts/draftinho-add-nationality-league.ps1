# Adds `league` to each team JSON header and `nationality` to each player.
# Nationality comes from Transfermarkt players.csv (country_of_citizenship),
# matched by normalized(name) + birth date.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$playersCsv    = Join-Path $root 'data\csv\archive\players.csv'
$teamsDir      = Join-Path $root 'src\games\draftinho\teams'
$nationalsDir  = Join-Path $root 'src\games\draftinho\national-teams'
$unmatchedPath = Join-Path $root 'data\draftinho-unmatched-nationality.json'

# Team id (basename) -> league label
$leagueMap = @{
    # Serie A
    'ac-milan'            = 'Serie A'
    'inter-milan'         = 'Serie A'
    'juventus'            = 'Serie A'
    'napoli'              = 'Serie A'
    # Premier League
    'arsenal'             = 'Premier League'
    'aston-villa'         = 'Premier League'
    'chelsea'             = 'Premier League'
    'liverpool'           = 'Premier League'
    'manchester-city'     = 'Premier League'
    'manchester-united'   = 'Premier League'
    'newcastle-united'    = 'Premier League'
    'tottenham-hotspur'   = 'Premier League'
    # LaLiga
    'atletico-madrid'     = 'LaLiga'
    'barcelona'           = 'LaLiga'
    'real-madrid'         = 'LaLiga'
    # Bundesliga
    'bayer-leverkusen'    = 'Bundesliga'
    'bayern-munich'       = 'Bundesliga'
    'borussia-dortmund'   = 'Bundesliga'
    # Ligue 1
    'paris-saint-germain' = 'Ligue 1'
    # Trendyol Super Lig
    'basaksehir'          = 'Super Lig'
    'besiktas'            = 'Super Lig'
    'fenerbahce'          = 'Super Lig'
    'galatasaray'         = 'Super Lig'
    'trabzonspor'         = 'Super Lig'
    # Others (still in the Draftinho pool but not in the Who Are Ya scope)
    'ajax'                = 'Eredivisie'
    'benfica'             = 'Primeira Liga'
    'porto'               = 'Primeira Liga'
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-NormalizedName {
    param([string]$Name)
    if ([string]::IsNullOrWhiteSpace($Name)) { return '' }
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

Write-Output "Loading players.csv..."
$byNameBirth = @{}
$byName = @{}
$byBirth = @{}
Import-Csv -Path $playersCsv -Encoding UTF8 | ForEach-Object {
    $nk = Get-NormalizedName $_.name
    $country = $_.country_of_citizenship
    if (-not $nk -or -not $country) { return }
    $birth = ''
    if ($_.date_of_birth) { $birth = ($_.date_of_birth -split ' ')[0] }
    if ($birth) {
        $key = "$nk|$birth"
        if (-not $byNameBirth.ContainsKey($key)) { $byNameBirth[$key] = $country }
        if (-not $byBirth.ContainsKey($birth)) {
            $byBirth[$birth] = New-Object System.Collections.Generic.List[object]
        }
        $tokens = ($nk -split '\s+') | Where-Object { $_.Length -ge 3 }
        $byBirth[$birth].Add([pscustomobject]@{ country = $country; tokens = $tokens })
    }
    if (-not $byName.ContainsKey($nk)) {
        $byName[$nk] = New-Object System.Collections.Generic.List[string]
    }
    $byName[$nk].Add($country)
}
Write-Output ("  {0} name+birth keys, {1} name keys" -f $byNameBirth.Count, $byName.Count)

$allMissing = New-Object System.Collections.Generic.List[object]
$grandMatched = 0
$grandTotal = 0

$files = @(Get-ChildItem -Path $teamsDir -Filter *.json) + @(Get-ChildItem -Path $nationalsDir -Filter *.json)
foreach ($file in $files) {
    $data = Get-Content -Raw -Path $file.FullName -Encoding UTF8 | ConvertFrom-Json
    $teamId = [IO.Path]::GetFileNameWithoutExtension($file.Name)

    # Only club teams get a league label; national teams stay leagueless.
    if ($file.Directory.Name -eq 'teams') {
        $league = $leagueMap[$teamId]
        if (-not $league) { $league = 'Other' }
        $data | Add-Member -NotePropertyName league -NotePropertyValue $league -Force
    }

    $matched = 0
    foreach ($p in $data.players) {
        $nk = Get-NormalizedName $p.name
        $birth = $p.birth
        $country = $null

        if ($birth -and $byNameBirth.ContainsKey("$nk|$birth")) {
            $country = $byNameBirth["$nk|$birth"]
        } elseif ($byName.ContainsKey($nk) -and ($byName[$nk] | Select-Object -Unique).Count -eq 1) {
            $country = $byName[$nk][0]
        } elseif ($birth -and $byBirth.ContainsKey($birth)) {
            $draftTokens = ($nk -split '\s+') | Where-Object { $_.Length -ge 3 }
            $cands = @()
            foreach ($cand in $byBirth[$birth]) {
                foreach ($t in $cand.tokens) {
                    if ($draftTokens -contains $t) { $cands += $cand.country; break }
                }
            }
            $unique = $cands | Select-Object -Unique
            if ($unique.Count -eq 1) { $country = $unique[0] }
        }

        if ($country) {
            $p | Add-Member -NotePropertyName nationality -NotePropertyValue $country -Force
            $matched++
        } else {
            $p | Add-Member -NotePropertyName nationality -NotePropertyValue '' -Force
            $allMissing.Add([pscustomobject]@{
                team  = $file.Name
                id    = $p.id
                name  = $p.name
                birth = $p.birth
            })
        }
    }
    $grandMatched += $matched
    $grandTotal   += $data.players.Count
    Write-Output ("  {0,-30} {1}/{2} nationality matched" -f $file.Name, $matched, $data.players.Count)

    $json = $data | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($file.FullName, $json, $Utf8NoBom)
}

Write-Output ""
Write-Output ("Grand total: {0}/{1} players nationality matched" -f $grandMatched, $grandTotal)
if ($allMissing.Count -gt 0) {
    $unmatchedJson = $allMissing | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($unmatchedPath, $unmatchedJson, $Utf8NoBom)
    Write-Output ("  wrote unmatched list to {0}" -f $unmatchedPath)
}
