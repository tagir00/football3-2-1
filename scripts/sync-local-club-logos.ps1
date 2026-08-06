param(
  [switch]$UseSportsDbFallback = $true,
  [switch]$Overwrite = $false
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $repoRoot 'src/data.js'
$remoteMapPath = Join-Path $repoRoot 'assets/logos/remote-badges.json'
$logoDir = Join-Path $repoRoot 'assets/logos/clubs'

if (-not (Test-Path $logoDir)) {
  New-Item -ItemType Directory -Path $logoDir | Out-Null
}

function Normalize-Text {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ''
  }

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $text = $builder.ToString().ToLowerInvariant()
  $text = $text -replace '&', ' and '
  $text = $text -replace '[^a-z0-9]+', ' '
  $text = $text -replace '\b(fc|cf|sc|ac|sk|jk|fk|club|football|de|al)\b', ' '
  $text = $text -replace '\s+', ' '
  return $text.Trim()
}

function Slugify-ClubName {
  param([string]$Name)

  $normalized = $Name.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  $ascii = $builder.ToString()
  $ascii = $ascii -replace '&', 'and'
  $ascii = $ascii -replace '[^a-zA-Z0-9]+', '-'
  $ascii = $ascii -replace '^-+|-+$', ''
  return $ascii.ToLowerInvariant()
}

function Parse-ClubBlocks {
  param([string]$DataText)

  $blockToLeague = @{
    premierLeague = 'English Premier League'
    laLiga = 'Spanish La Liga'
    bundesliga = 'German Bundesliga'
    serieA = 'Italian Serie A'
    ligue1 = 'French Ligue 1'
    superLig = 'Turkish Super Lig'
    extraClubs = 'Extra'
  }

  $result = New-Object System.Collections.Generic.List[object]

  foreach ($blockName in $blockToLeague.Keys) {
    $pattern = "const $blockName = \[(.*?)\];"
    $match = [regex]::Match($DataText, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

    if (-not $match.Success) {
      continue
    }

    $clubs = [regex]::Matches($match.Groups[1].Value, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value }
    foreach ($club in $clubs) {
      $result.Add([PSCustomObject]@{
        Name = $club
        League = $blockToLeague[$blockName]
      })
    }
  }

  return $result
}

function Get-TeamBadgeUrl {
  param($Team)

  if ($Team.strBadge) {
    return [string]$Team.strBadge
  }

  if ($Team.strTeamBadge) {
    return [string]$Team.strTeamBadge
  }

  return $null
}

function Get-SportsDbLeagueTeams {
  param([string]$LeagueName)

  if ($LeagueName -eq 'Extra') {
    return @()
  }

  $url = 'https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=' + [uri]::EscapeDataString($LeagueName)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -ErrorAction Stop
    $payload = $response.Content | ConvertFrom-Json
    return @($payload.teams)
  } catch {
    return @()
  }
}

function Get-ClubAliases {
  param([string]$ClubName)

  $aliases = New-Object System.Collections.Generic.List[string]
  $aliases.Add($ClubName)

  $map = @{
    'Athletic Club' = @('Athletic Bilbao')
    'Inter Milan' = @('Internazionale', 'Inter')
    'AC Milan' = @('Milan')
    'Paris Saint-Germain' = @('PSG', 'Paris Saint Germain')
    'Borussia Monchengladbach' = @('Monchengladbach', 'Bor. Monchengladbach')
    'Basaksehir' = @('Istanbul Basaksehir')
    'Fenerbahce' = @('Fenerbahce')
    'Galatasaray' = @('Galatasaray')
    'Besiktas' = @('Besiktas')
    'Gaziantep FK' = @('Gaziantep')
    'Rizespor' = @('Caykur Rizespor')
    'Sporting CP' = @('Sporting Lisbon', 'Sporting Clube de Portugal')
  }

  if ($map.ContainsKey($ClubName)) {
    foreach ($alias in $map[$ClubName]) {
      if (-not $aliases.Contains($alias)) {
        $aliases.Add($alias)
      }
    }
  }

  return @($aliases)
}

function Resolve-FromLeagueTeams {
  param(
    [string]$ClubName,
    [object[]]$Teams
  )

  if ($null -eq $Teams -or $Teams.Count -eq 0) {
    return $null
  }

  $targets = Get-ClubAliases -ClubName $ClubName
  $normalizedTargets = $targets | ForEach-Object { Normalize-Text $_ } | Where-Object { $_ }

  foreach ($team in $Teams) {
    $badgeUrl = Get-TeamBadgeUrl -Team $team
    if (-not $badgeUrl) {
      continue
    }

    $names = @($team.strTeam, $team.strAlternate, $team.strTeamShort) | Where-Object { $_ }
    $normalizedNames = $names | ForEach-Object { Normalize-Text $_ }

    foreach ($target in $normalizedTargets) {
      if ($normalizedNames -contains $target) {
        return $badgeUrl
      }
    }
  }

  foreach ($team in $Teams) {
    $badgeUrl = Get-TeamBadgeUrl -Team $team
    if (-not $badgeUrl) {
      continue
    }

    $names = @($team.strTeam, $team.strAlternate, $team.strTeamShort) | Where-Object { $_ }
    $normalizedNames = $names | ForEach-Object { Normalize-Text $_ }

    foreach ($target in $normalizedTargets) {
      foreach ($candidate in $normalizedNames) {
        if ($candidate -and ($candidate.Contains($target) -or $target.Contains($candidate))) {
          return $badgeUrl
        }
      }
    }
  }

  return $null
}

function Resolve-FromSearchTeams {
  param([string]$ClubName)

  $targets = Get-ClubAliases -ClubName $ClubName
  foreach ($term in $targets) {
    $url = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=' + [uri]::EscapeDataString($term)

    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -ErrorAction Stop
      $payload = $response.Content | ConvertFrom-Json
      $teams = @($payload.teams)
    } catch {
      $teams = @()
    }

    if ($teams.Count -eq 0) {
      continue
    }

    $targetNorm = Normalize-Text $ClubName
    foreach ($team in $teams) {
      $badgeUrl = Get-TeamBadgeUrl -Team $team
      if (-not $badgeUrl) {
        continue
      }

      $candidateNorm = Normalize-Text([string]$team.strTeam)
      if ($candidateNorm -eq $targetNorm) {
        return $badgeUrl
      }
    }
  }

  return $null
}

function Resolve-FromWikipedia {
  param([string]$ClubName)

  $targets = Get-ClubAliases -ClubName $ClubName
  $titles = New-Object System.Collections.Generic.List[string]

  foreach ($target in $targets) {
    if (-not [string]::IsNullOrWhiteSpace($target) -and -not $titles.Contains($target)) {
      $titles.Add($target)
    }
    foreach ($suffix in @(' F.C.', ' FC', ' S.K.')) {
      $candidate = $target + $suffix
      if (-not $titles.Contains($candidate)) {
        $titles.Add($candidate)
      }
    }
  }

  foreach ($target in $targets) {
    $searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&utf8=1&srlimit=8&srsearch=' + [uri]::EscapeDataString($target + ' football club')
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $searchUrl -Method Get -ErrorAction Stop
      $payload = $response.Content | ConvertFrom-Json
      foreach ($item in @($payload.query.search)) {
        $title = [string]$item.title
        if (-not [string]::IsNullOrWhiteSpace($title) -and -not $titles.Contains($title)) {
          $titles.Add($title)
        }
      }
    } catch {
    }
  }

  foreach ($title in $titles) {
    $pageImageUrl = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=512&titles=' + [uri]::EscapeDataString($title)

    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $pageImageUrl -Method Get -ErrorAction Stop
      $payload = $response.Content | ConvertFrom-Json
      $pages = $payload.query.pages.PSObject.Properties.Value
      foreach ($page in $pages) {
        if ($page.thumbnail.source) {
          return [string]$page.thumbnail.source
        }
      }
    } catch {
    }
  }

  return $null
}

function Download-ImageToTemp {
  param([string]$Url)

  try {
    $tempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), ([System.Guid]::NewGuid().ToString() + '.img'))
    Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $tempPath -ErrorAction Stop | Out-Null
    return $tempPath
  } catch {
    return $null
  }
}

$dataText = Get-Content $dataPath -Raw
$clubEntries = Parse-ClubBlocks -DataText $dataText

$remoteMap = @{}
if (Test-Path $remoteMapPath) {
  try {
    $remoteJson = Get-Content $remoteMapPath -Raw | ConvertFrom-Json
    foreach ($property in $remoteJson.PSObject.Properties) {
      $remoteMap[$property.Name] = [string]$property.Value
    }
  } catch {
    $remoteMap = @{}
  }
}

$leagueCache = @{}
if ($UseSportsDbFallback) {
  foreach ($league in ($clubEntries | Select-Object -ExpandProperty League -Unique)) {
    $leagueCache[$league] = Get-SportsDbLeagueTeams -LeagueName $league
  }
}

$downloaded = 0
$skipped = 0
$failed = 0
$duplicateRejected = 0
$hashToClub = @{}

foreach ($entry in $clubEntries) {
  $club = [string]$entry.Name
  $league = [string]$entry.League
  $slug = Slugify-ClubName -Name $club
  $targetPath = Join-Path $logoDir ($slug + '.png')

  if ((Test-Path $targetPath) -and -not $Overwrite) {
    $skipped += 1
    continue
  }

  $candidates = New-Object System.Collections.Generic.List[string]

  if ($remoteMap.ContainsKey($club) -and -not [string]::IsNullOrWhiteSpace($remoteMap[$club])) {
    $candidates.Add($remoteMap[$club])
  }

  if ($UseSportsDbFallback) {
    $leagueBadge = Resolve-FromLeagueTeams -ClubName $club -Teams $leagueCache[$league]
    if ($leagueBadge -and -not $candidates.Contains($leagueBadge)) {
      $candidates.Add($leagueBadge)
    }

    $searchBadge = Resolve-FromSearchTeams -ClubName $club
    if ($searchBadge -and -not $candidates.Contains($searchBadge)) {
      $candidates.Add($searchBadge)
    }
  }

  $wikiBadge = Resolve-FromWikipedia -ClubName $club
  if ($wikiBadge -and -not $candidates.Contains($wikiBadge)) {
    $candidates.Add($wikiBadge)
  }

  $saved = $false

  foreach ($url in $candidates) {
    if ([string]::IsNullOrWhiteSpace($url)) {
      continue
    }

    $tempPath = Download-ImageToTemp -Url $url
    if (-not $tempPath -or -not (Test-Path $tempPath)) {
      continue
    }

    $fileInfo = Get-Item $tempPath
    if ($fileInfo.Length -lt 1024) {
      Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
      continue
    }

    $hash = (Get-FileHash $tempPath -Algorithm SHA256).Hash
    if ($hashToClub.ContainsKey($hash) -and $hashToClub[$hash] -ne $club) {
      $duplicateRejected += 1
      Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
      continue
    }

    Move-Item $tempPath $targetPath -Force
    $hashToClub[$hash] = $club
    $downloaded += 1
    $saved = $true
    break
  }

  if (-not $saved) {
    $failed += 1
  }
}

Write-Output ("Downloaded: {0}" -f $downloaded)
Write-Output ("Skipped (exists): {0}" -f $skipped)
Write-Output ("Failed (no source or download error): {0}" -f $failed)
Write-Output ("Rejected (duplicate hash): {0}" -f $duplicateRejected)
