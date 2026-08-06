import { clubs, countries } from './data.js';
import {
  playerPool,
  getEligiblePlayers,
  buildClubClubConnections,
  buildCountryClubConnections,
} from './playerData.js';

const modeGrid = document.querySelector('#modeGrid');
const homePanel = document.querySelector('#homePanel');
const modePanel = document.querySelector('#modePanel');
const gamePanel = document.querySelector('#gamePanel');
const modeLabel = document.querySelector('#modeLabel');
const roundTitle = document.querySelector('#roundTitle');
const roundBadge = document.querySelector('#roundBadge');
const orientationHint = document.querySelector('#orientationHint');
const statusStrip = document.querySelector('#statusStrip');
const leftCard = document.querySelector('#leftCard');
const rightCard = document.querySelector('#rightCard');
const countdownLayer = document.querySelector('#countdownLayer');
const countdownValue = document.querySelector('#countdownValue');
const startButton = document.querySelector('#startButton');
const retryButton = document.querySelector('#retryButton');
const backButton = document.querySelector('#backButton');
const openModesButton = document.querySelector('#openModesButton');
const modeBackButton = document.querySelector('#modeBackButton');
const infoButton = document.querySelector('#infoButton');
const closeInfoButton = document.querySelector('#closeInfoButton');
const infoModal = document.querySelector('#infoModal');

const modes = [
  {
    id: 'club-club',
    title: 'Kulup - Kulup',
    subtitle: 'Iki farkli kulup gelir. Oyuncular ortak ismi en hizli sekilde soyler.',
    accent: 'mode-club',
  },
  {
    id: 'country-club',
    title: 'Ulke - Kulup',
    subtitle: 'Bir tarafta ulke, bir tarafta kulup olur. Oyuncu bulunamazsa ayni taraflar korunur.',
    accent: 'mode-country',
  },
];

const state = {
  mode: null,
  round: 0,
  isCounting: false,
  nextCountryClubOrientation: 'country-left',
  lastCountryClubOrientation: 'country-left',
  currentPair: null,
};

const clubsByName = new Map(clubs.map((club) => [club.name, club]));
const countriesByName = new Map(countries.map((country) => [country.name, country]));
const eligiblePlayers = getEligiblePlayers(playerPool, 1970);
const clubClubConnections = buildClubClubConnections(
  eligiblePlayers,
  clubs.map((club) => club.name),
).filter((connection) => connection.clubs.every((clubName) => clubsByName.has(clubName)));
const countryClubConnections = buildCountryClubConnections(
  eligiblePlayers,
  countries.map((country) => country.name),
  clubs.map((club) => club.name),
).filter((connection) => countriesByName.has(connection.country) && clubsByName.has(connection.club));

const clubBadgeCache = new Map();
const localBadgeAvailability = new Map();
const sportsDbBadgeCache = new Map();
let remoteBadgeMap = {};
const LOCAL_BADGES_ONLY = true;

const wikiClubTitleOverrides = new Map([
  ['Athletic Club', 'Athletic Bilbao'],
  ['Brighton & Hove Albion', 'Brighton & Hove Albion F.C.'],
  ['Wolverhampton Wanderers', 'Wolverhampton Wanderers F.C.'],
  ['Paris Saint-Germain', 'Paris Saint-Germain F.C.'],
  ['Borussia Monchengladbach', 'Borussia Monchengladbach'],
  ['Basaksehir', 'Istanbul Basaksehir F.K.'],
  ['Besiktas', 'Besiktas J.K.'],
  ['Fenerbahce', 'Fenerbahce S.K. (football)'],
  ['Galatasaray', 'Galatasaray S.K. (football)'],
  ['Genclerbirligi', 'Genclerbirligi S.K.'],
  ['Gaziantep FK', 'Gaziantep F.K.'],
  ['Goztepe', 'Goztepe S.K.'],
  ['Kasimpasa', 'Kasimpasa S.K.'],
  ['Konyaspor', 'Konyaspor'],
  ['Rizespor', 'Caykur Rizespor'],
  ['Samsunspor', 'Samsunspor'],
  ['Sporting CP', 'Sporting CP'],
  ['PSV Eindhoven', 'PSV Eindhoven'],
]);

if (!LOCAL_BADGES_ONLY) {
  try {
    const response = await fetch('./assets/logos/remote-badges.json', { cache: 'no-store' });
    remoteBadgeMap = response.ok ? await response.json() : {};
  } catch {
    remoteBadgeMap = {};
  }
}

async function fetchWikipediaPageImage(title) {
  const pageImageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=512&titles=${encodeURIComponent(title)}`;

  try {
    const response = await fetch(pageImageUrl, { cache: 'force-cache' });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const pages = Object.values(payload?.query?.pages ?? {});
    const imageUrl = pages.find((page) => page?.thumbnail?.source)?.thumbnail?.source;

    return imageUrl ?? null;
  } catch {
    return null;
  }
}

async function fetchWikipediaSummaryImage(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(summaryUrl, { cache: 'force-cache' });

    if (!response.ok) {
      return null;
    }

    const summary = await response.json();
    return summary?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

function buildWikipediaTitleCandidates(name, searchTitles = []) {
  return [
    wikiClubTitleOverrides.get(name),
    name,
    `${name} F.C.`,
    `${name} FC`,
    `${name} S.K.`,
    ...searchTitles,
  ].filter(Boolean);
}

async function fetchWikipediaBadgeUrl(name) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&utf8=1&origin=*&srlimit=8&srsearch=${encodeURIComponent(`${name} football club`)}`;

  let searchTitles = [];

  try {
    const searchResponse = await fetch(searchUrl, { cache: 'force-cache' });

    if (searchResponse.ok) {
      const searchPayload = await searchResponse.json();
      searchTitles = (searchPayload?.query?.search ?? []).map((result) => result.title);
    }
  } catch {
    searchTitles = [];
  }

  const candidateTitles = [...new Set(buildWikipediaTitleCandidates(name, searchTitles))];

  for (const title of candidateTitles) {
    const pageImage = await fetchWikipediaPageImage(title);

    if (pageImage) {
      return pageImage;
    }

    const summaryImage = await fetchWikipediaSummaryImage(title);

    if (summaryImage) {
      return summaryImage;
    }
  }

  return null;
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function normalizeLookupValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreSportsDbTeamMatch(clubName, team) {
  const target = normalizeLookupValue(clubName);
  const candidates = [team?.strTeam, team?.strAlternate, team?.strTeamShort]
    .filter(Boolean)
    .map((item) => normalizeLookupValue(item));

  if (candidates.some((candidate) => candidate === target)) {
    return 3;
  }

  if (candidates.some((candidate) => candidate.includes(target) || target.includes(candidate))) {
    return 2;
  }

  return 0;
}

async function fetchSportsDbBadgeUrl(name) {
  if (sportsDbBadgeCache.has(name)) {
    return sportsDbBadgeCache.get(name);
  }

  const searchName = wikiClubTitleOverrides.get(name) ?? name;
  const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(searchName)}`;

  try {
    const response = await fetch(url, { cache: 'force-cache' });

    if (!response.ok) {
      sportsDbBadgeCache.set(name, null);
      return null;
    }

    const payload = await response.json();
    const teams = (payload?.teams ?? []).filter(
      (team) => String(team?.strSport ?? '').toLowerCase() === 'soccer',
    );

    let bestTeam = null;
    let bestScore = -1;

    for (const team of teams) {
      const score = scoreSportsDbTeamMatch(name, team);
      if (score > bestScore) {
        bestScore = score;
        bestTeam = team;
      }
    }

    const badgeUrl = bestTeam?.strBadge ?? bestTeam?.strTeamBadge ?? null;
    sportsDbBadgeCache.set(name, badgeUrl);
    return badgeUrl;
  } catch {
    sportsDbBadgeCache.set(name, null);
    return null;
  }
}

function pickRandomEntry(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickRandom(list, excludedNames = new Set()) {
  const filtered = list.filter((item) => !excludedNames.has(item.name));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function clubPalette(name) {
  const palettes = [
    ['#9a3412', '#fb923c'],
    ['#1d4ed8', '#60a5fa'],
    ['#166534', '#4ade80'],
    ['#7e22ce', '#c084fc'],
    ['#be123c', '#fb7185'],
    ['#0f766e', '#5eead4'],
  ];

  const hash = [...name].reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function createClubLogo(name) {
  const [start, end] = clubPalette(name);
  const initials = buildInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${name}">
      <defs>
        <linearGradient id="crestGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <path d="M60 6 104 20v34c0 27.3-17.8 51.8-44 60C33.8 105.8 16 81.3 16 54V20L60 6Z" fill="url(#crestGradient)" />
      <path d="M60 16 95 27v26c0 21.7-13.9 41.4-35 48.1C38.9 94.4 25 74.7 25 53V27l35-11Z" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.4)" stroke-width="2" />
      <text x="60" y="67" text-anchor="middle" font-size="30" font-family="Arial, sans-serif" font-weight="700" fill="#fff">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function fetchClubBadgeUrl(name) {
  if (clubBadgeCache.has(name)) {
    return clubBadgeCache.get(name);
  }

  if (LOCAL_BADGES_ONLY) {
    clubBadgeCache.set(name, null);
    return null;
  }

  const sportsDbBadgeUrl = await fetchSportsDbBadgeUrl(name);
  const wikipediaBadgeUrl = await fetchWikipediaBadgeUrl(name);
  const staticRemoteBadgeUrl = remoteBadgeMap[name] ?? null;
  const badgeUrl = sportsDbBadgeUrl ?? wikipediaBadgeUrl ?? staticRemoteBadgeUrl;
  clubBadgeCache.set(name, badgeUrl);
  return badgeUrl;
}

function createFallbackBadge(name) {
  return `
    <div class="badge-fallback" aria-hidden="true">
      <img class="badge-image" src="${createClubLogo(name)}" alt="" />
    </div>
  `;
}

async function resolveLocalClubBadge(entry) {
  if (!entry?.localLogoPath) {
    return null;
  }

  const explicitPath = entry.localLogoPath;

  if (/\.(svg|png|webp|jpg|jpeg)$/i.test(explicitPath)) {
    return [
      explicitPath,
      explicitPath.replace(/\.(svg|png|webp|jpg|jpeg)$/i, '.png'),
      explicitPath.replace(/\.(svg|png|webp|jpg|jpeg)$/i, '.svg'),
      explicitPath.replace(/\.(svg|png|webp|jpg|jpeg)$/i, '.webp'),
      explicitPath.replace(/\.(svg|png|webp|jpg|jpeg)$/i, '.jpg'),
      explicitPath.replace(/\.(svg|png|webp|jpg|jpeg)$/i, '.jpeg'),
    ];
  }

  return [
    `${explicitPath}.png`,
    `${explicitPath}.svg`,
    `${explicitPath}.webp`,
    `${explicitPath}.jpg`,
    `${explicitPath}.jpeg`,
  ];
}

function loadImageSource(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.className = 'badge-image badge-live';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';

    image.addEventListener(
      'load',
      () => {
        resolve(image.naturalWidth > 0 ? image : null);
      },
      { once: true },
    );

    image.addEventListener(
      'error',
      () => {
        resolve(null);
      },
      { once: true },
    );

    image.src = url;
  });
}

function countryFlagUrl(code) {
  return `https://flagcdn.com/w320/${code}.png`;
}

function setStatus(message) {
  statusStrip.textContent = message;
}

function renderModeCards() {
  modeGrid.innerHTML = modes
    .map(
      (mode) => `
        <button class="mode-card ${mode.accent}" data-mode="${mode.id}" type="button">
          <span class="mode-pill">Mod</span>
          <strong>${mode.title}</strong>
          <span>${mode.subtitle}</span>
        </button>
      `,
    )
    .join('');

  modeGrid.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => selectMode(button.dataset.mode));
  });
}

function showModeSelection() {
  homePanel.classList.add('hidden');
  gamePanel.classList.add('hidden');
  modePanel.classList.remove('hidden');
  document.body.dataset.mode = 'modes';
}

function showHome() {
  state.mode = null;
  state.round = 0;
  state.currentPair = null;
  homePanel.classList.remove('hidden');
  modePanel.classList.add('hidden');
  gamePanel.classList.add('hidden');
  document.body.dataset.mode = 'home';
}

function toggleInfoModal(forceOpen) {
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : infoModal.classList.contains('hidden');
  infoModal.classList.toggle('hidden', !shouldOpen);
  infoModal.setAttribute('aria-hidden', String(!shouldOpen));
}

function createCardMarkup(entry, side) {
  const isCountry = entry.type === 'country';
  const visibleName = entry.displayName ?? entry.name;
  const media = isCountry
    ? `<img class="badge-image" src="${countryFlagUrl(entry.code)}" alt="${visibleName} bayragi" loading="lazy" />`
    : `
      <div class="badge-stack" data-club-badge data-club-name="${entry.name}">
        ${createFallbackBadge(entry.name)}
      </div>
    `;

  const meta = isCountry ? 'Milli takim havuzu' : entry.leagueDisplayName ?? entry.league;

  return `
    <div class="entity-card entity-${side} ${isCountry ? 'country-card' : 'club-card'}">
      <div class="badge-shell">${media}</div>
      <p class="entity-type">${isCountry ? 'Ulke' : 'Kulup'}</p>
      <h3>${visibleName}</h3>
      <p class="entity-meta">${meta}</p>
    </div>
  `;
}

async function hydrateClubBadges(scope) {
  const clubBadgeNodes = scope.querySelectorAll('[data-club-badge]');

  await Promise.all(
    [...clubBadgeNodes].map(async (node) => {
      const clubName = node.dataset.clubName;
      const clubEntry = clubs.find((club) => club.name === clubName);
      const localCandidates = await resolveLocalClubBadge(clubEntry);
      const candidateList = [...new Set(localCandidates ?? [])];

      if (!LOCAL_BADGES_ONLY) {
        const remoteBadgeUrl = await fetchClubBadgeUrl(clubName);
        if (remoteBadgeUrl) {
          candidateList.push(remoteBadgeUrl);
        }
      }

      let resolvedImage = null;
      let resolvedSource = 'fallback';

      for (const candidate of candidateList) {
        if (!candidate) {
          continue;
        }

        const cacheKey = `${clubName}::${candidate}`;
        const knownAvailability = localBadgeAvailability.get(cacheKey);

        if (knownAvailability === false) {
          continue;
        }

        const loadedImage = await loadImageSource(candidate);

        if (loadedImage) {
          loadedImage.alt = `${clubName} logosu`;
          resolvedImage = loadedImage;
          resolvedSource = candidate.startsWith('./assets/logos/') ? 'local' : 'remote';
          localBadgeAvailability.set(cacheKey, true);
          break;
        }

        localBadgeAvailability.set(cacheKey, false);
      }

      if (resolvedImage) {
        node.prepend(resolvedImage);
      }

      node.dataset.badgeSource = resolvedSource;
      node.classList.add('badge-ready');
    }),
  );
}

function updateOrientationHint() {
  if (!orientationHint) {
    return;
  }

  if (state.mode !== 'country-club') {
    orientationHint.textContent = 'Iki kulup gelecek';
    return;
  }

  if (state.round === 0) {
    orientationHint.textContent = 'Ilk tur: ulke solda';
    return;
  }

  orientationHint.textContent =
    state.lastCountryClubOrientation === 'country-left'
      ? 'Bu tur: ulke solda · sonraki Baslatta sagda'
      : 'Bu tur: ulke sagda · sonraki Baslatta solda';
}

function renderPair(pair) {
  leftCard.innerHTML = createCardMarkup(pair.left, 'left');
  rightCard.innerHTML = createCardMarkup(pair.right, 'right');
  hydrateClubBadges(leftCard);
  hydrateClubBadges(rightCard);
  leftCard.classList.add('reveal');
  rightCard.classList.add('reveal');
  window.setTimeout(() => {
    leftCard.classList.remove('reveal');
    rightCard.classList.remove('reveal');
  }, 520);
}

function generateClubClubPair() {
  if (clubClubConnections.length > 0) {
    const connection = pickRandomEntry(clubClubConnections);
    return {
      left: clubsByName.get(connection.clubs[0]),
      right: clubsByName.get(connection.clubs[1]),
      connection,
    };
  }

  return null;
}

function generateCountryClubPair(orientation) {
  if (countryClubConnections.length > 0) {
    const connection = pickRandomEntry(countryClubConnections);
    const country = countriesByName.get(connection.country);
    const club = clubsByName.get(connection.club);

    if (orientation === 'country-left') {
      return { left: country, right: club, connection };
    }

    return { left: club, right: country, connection };
  }

  return null;
}

function updateRoundUI() {
  const activeMode = modes.find((mode) => mode.id === state.mode);
  modeLabel.textContent = activeMode.title;
  roundTitle.textContent = state.round === 0 ? 'Yeni Tur' : 'Eslesme Hazir';
  roundBadge.textContent = `Tur ${state.round}`;
  document.body.dataset.mode = activeMode.id;
  retryButton.classList.toggle('hidden', state.mode !== 'country-club');
  updateOrientationHint();
}

function selectMode(modeId) {
  state.mode = modeId;
  state.round = 0;
  state.currentPair = null;
  state.nextCountryClubOrientation = 'country-left';
  state.lastCountryClubOrientation = 'country-left';

  modePanel.classList.add('hidden');
  gamePanel.classList.remove('hidden');
  leftCard.innerHTML = `
    <div class="slot-placeholder">
      <span class="placeholder-icon">3</span>
      <p>Baslat'a bas ve eslesmeyi getir.</p>
    </div>
  `;
  rightCard.innerHTML = `
    <div class="slot-placeholder">
      <span class="placeholder-icon">2</span>
      <p>${modeId === 'country-club' ? 'Ulke ve kulup sirayla gelecek.' : 'Ikinci kulup burada gorunecek.'}</p>
    </div>
  `;

  updateRoundUI();
  setStatus(
    modeId === 'country-club'
      ? 'Baslat yeni turu acsin. Oyuncu Bulamadik ayni taraf dizilimini koruyarak yeni eslesme getirir.'
      : 'Baslat her seferinde yeni iki kulup getirir.',
  );
}

async function runCountdown() {
  state.isCounting = true;
  countdownLayer.classList.remove('hidden');
  leftCard.classList.remove('reveal');
  rightCard.classList.remove('reveal');

  for (const value of [3, 2, 1]) {
    countdownValue.textContent = String(value);
    countdownLayer.classList.remove('pulse');
    void countdownLayer.offsetWidth;
    countdownLayer.classList.add('pulse');
    await sleep(820);
  }

  countdownLayer.classList.add('hidden');
  state.isCounting = false;
}

async function startRound() {
  if (!state.mode || state.isCounting) {
    return;
  }

  setStatus('3-2-1 basladi. Hazir olun.');
  await runCountdown();

  let pair;

  if (state.mode === 'club-club') {
    pair = generateClubClubPair();
  } else {
    const orientation = state.nextCountryClubOrientation;
    pair = generateCountryClubPair(orientation);
    state.lastCountryClubOrientation = orientation;
    state.nextCountryClubOrientation = orientation === 'country-left' ? 'country-right' : 'country-left';
  }

  if (!pair) {
    setStatus('Gecerli oyuncu baglantisi bulunamadi. Veri havuzunu genisletmek gerekiyor.');
    return;
  }

  state.round += 1;
  state.currentPair = pair;
  renderPair(pair);
  updateRoundUI();
  setStatus('Eslesme geldi. Oyuncular ismi soyler, yeni tur icin tekrar Baslat kullanilir.');
}

async function rerollCountryClub() {
  if (state.mode !== 'country-club' || !state.currentPair || state.isCounting) {
    return;
  }

  setStatus('Oyuncu bulunamadi. Yeni eslesme icin 3-2-1 basliyor.');
  await runCountdown();
  state.currentPair = generateCountryClubPair(state.lastCountryClubOrientation);

  if (!state.currentPair) {
    setStatus('Gecerli oyuncu baglantisi bulunamadi. Veri havuzunu genisletmek gerekiyor.');
    return;
  }

  renderPair(state.currentPair);
  setStatus('Ayni taraf diziliminde yeni ulke-kulup geldi.');
}

function goBack() {
  state.mode = null;
  state.round = 0;
  state.currentPair = null;
  gamePanel.classList.add('hidden');
  modePanel.classList.remove('hidden');
  document.body.dataset.mode = 'modes';
}

startButton.addEventListener('click', startRound);
retryButton.addEventListener('click', rerollCountryClub);
backButton.addEventListener('click', goBack);
openModesButton.addEventListener('click', showModeSelection);
modeBackButton.addEventListener('click', showHome);
infoButton.addEventListener('click', () => toggleInfoModal(true));
closeInfoButton.addEventListener('click', () => toggleInfoModal(false));
infoModal.addEventListener('click', (event) => {
  if (event.target === infoModal) {
    toggleInfoModal(false);
  }
});

renderModeCards();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}