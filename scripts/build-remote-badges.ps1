$dataPath = 'c:\Users\tahaa\Desktop\vscode\src\data.js'
$outputPath = 'c:\Users\tahaa\Desktop\vscode\assets\logos\remote-badges.json'

$text = Get-Content $dataPath -Raw
$blocks = @('premierLeague', 'laLiga', 'bundesliga', 'serieA', 'ligue1', 'superLig', 'extraClubs')
$names = New-Object System.Collections.Generic.List[string]

foreach ($block in $blocks) {
  $pattern = "const $block = \[(.*?)\];"
  $match = [regex]::Match($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

  if ($match.Success) {
    $items = [regex]::Matches($match.Groups[1].Value, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value }

    foreach ($item in $items) {
      if (-not $names.Contains($item)) {
        $names.Add($item)
      }
    }
  }
}

$overrides = @{
  'Athletic Club' = 'Athletic Bilbao'
  'Brighton & Hove Albion' = 'Brighton & Hove Albion F.C.'
  'Wolverhampton Wanderers' = 'Wolverhampton Wanderers F.C.'
  'Paris Saint-Germain' = 'Paris Saint-Germain F.C.'
  'Borussia Monchengladbach' = 'Borussia Monchengladbach'
  'Basaksehir' = 'Istanbul Basaksehir F.K.'
  'Besiktas' = 'Besiktas J.K.'
  'Fenerbahce' = 'Fenerbahce S.K. (football)'
  'Galatasaray' = 'Galatasaray S.K. (football)'
  'Genclerbirligi' = 'Genclerbirligi S.K.'
  'Gaziantep FK' = 'Gaziantep F.K.'
  'Goztepe' = 'Goztepe S.K.'
  'Kasimpasa' = 'Kasimpasa S.K.'
  'Rizespor' = 'Caykur Rizespor'
}

function Get-PageImageForTitle {
  param([string]$Title)

  $url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=512&titles=' + [uri]::EscapeDataString($Title)

  try {
    $payload = Invoke-RestMethod -Uri $url -Method Get -Headers @{ 'User-Agent' = 'CopilotBadgeBuilder/1.1' }
    $pages = $payload.query.pages.PSObject.Properties.Value

    foreach ($page in $pages) {
      if ($page.thumbnail.source) {
        return [string]$page.thumbnail.source
      }
    }
  } catch {
  }

  return $null
}

function Resolve-WikipediaImage {
  param([string]$ClubName)

  $query = if ($overrides.ContainsKey($ClubName)) { $overrides[$ClubName] } else { $ClubName }
  $searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&utf8=1&srlimit=10&srsearch=' + [uri]::EscapeDataString($query + ' football club')
  $titles = New-Object System.Collections.Generic.List[string]

  foreach ($seed in @($query, $ClubName, "$ClubName F.C.", "$ClubName FC", "$ClubName S.K.")) {
    if ($seed -and -not $titles.Contains($seed)) {
      $titles.Add($seed)
    }
  }

  try {
    $searchPayload = Invoke-RestMethod -Uri $searchUrl -Method Get -Headers @{ 'User-Agent' = 'CopilotBadgeBuilder/1.1' }

    if ($searchPayload.query.search) {
      foreach ($item in $searchPayload.query.search) {
        $title = [string]$item.title
        if ($title -and -not $titles.Contains($title)) {
          $titles.Add($title)
        }
      }
    }
  } catch {
  }

  foreach ($title in $titles) {
    $image = Get-PageImageForTitle -Title $title

    if ($image) {
      return $image
    }
  }

  return $null
}

$results = [ordered]@{}
$resolved = 0

foreach ($name in $names) {
  $badge = Resolve-WikipediaImage -ClubName $name

  if ($badge) {
    $results[$name] = $badge
    $resolved += 1
  }
}

$results | ConvertTo-Json -Depth 4 | Set-Content -Path $outputPath -Encoding UTF8
Write-Output ("Badge entries written: {0}/{1}" -f $resolved, $names.Count)