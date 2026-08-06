import { clubs, countries } from './data.js';
import {
  loadPlayerPool,
  getEligiblePlayers,
  buildClubClubConnections,
  buildCountryClubConnections,
} from './playerData.js';
import { template } from './template.js';

const STYLE_HREF = new URL('./game.css', import.meta.url).href;

function ensureStylesheet() {
  if (document.querySelector('link[data-game-style="futbol321"]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.gameStyle = 'futbol321';
  document.head.append(link);
}

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

const clubsByName = new Map(clubs.map((club) => [club.name, club]));
const countriesByName = new Map(countries.map((country) => [country.name, country]));

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

let connectionsPromise = null;

async function ensureConnections() {
  if (!connectionsPromise) {
    connectionsPromise = (async () => {
      const playerPool = await loadPlayerPool();
      const eligiblePlayers = getEligiblePlayers(playerPool, 1970);
      const clubClubConnections = buildClubClubConnections(
        eligiblePlayers,
        clubs.map((club) => club.name),
      ).filter((connection) => connection.clubs.every((clubName) => clubsByName.has(clubName)));
      const countryClubConnections = buildCountryClubConnections(
        eligiblePlayers,
        countries.map((country) => country.name),
        clubs.map((club) => club.name),
      ).filter(
        (connection) => countriesByName.has(connection.country) && clubsByName.has(connection.club),
      );

      return { clubClubConnections, countryClubConnections };
    })();
  }

  return connectionsPromise;
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

function createCardMarkup(entry) {
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
    <div class="entity-card ${isCountry ? 'country-card' : 'club-card'}">
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

let cleanup = null;

export async function mount(container) {
  ensureStylesheet();
  container.innerHTML = template();

  const els = {
    modeGrid: container.querySelector('#modeGrid'),
    homePanel: container.querySelector('#homePanel'),
    modePanel: container.querySelector('#modePanel'),
    gamePanel: container.querySelector('#gamePanel'),
    modeLabel: container.querySelector('#modeLabel'),
    roundTitle: container.querySelector('#roundTitle'),
    roundBadge: container.querySelector('#roundBadge'),
    orientationHint: container.querySelector('#orientationHint'),
    statusStrip: container.querySelector('#statusStrip'),
    leftCard: container.querySelector('#leftCard'),
    rightCard: container.querySelector('#rightCard'),
    countdownLayer: container.querySelector('#countdownLayer'),
    countdownValue: container.querySelector('#countdownValue'),
    startButton: container.querySelector('#startButton'),
    retryButton: container.querySelector('#retryButton'),
    backButton: container.querySelector('#backButton'),
    openModesButton: container.querySelector('#openModesButton'),
    modeBackButton: container.querySelector('#modeBackButton'),
    infoButton: container.querySelector('#infoButton'),
    closeInfoButton: container.querySelector('#closeInfoButton'),
    infoModal: container.querySelector('#infoModal'),
  };

  const state = {
    mode: null,
    round: 0,
    isCounting: false,
    nextCountryClubOrientation: 'country-left',
    lastCountryClubOrientation: 'country-left',
    currentPair: null,
  };

  const boundListeners = [];
  function bind(el, type, handler, options) {
    el.addEventListener(type, handler, options);
    boundListeners.push(() => el.removeEventListener(type, handler, options));
  }

  const pendingTimeouts = new Set();
  function scheduleTimeout(fn, delay) {
    const id = window.setTimeout(() => {
      pendingTimeouts.delete(id);
      fn();
    }, delay);
    pendingTimeouts.add(id);
    return id;
  }

  function sleep(ms) {
    return new Promise((resolve) => scheduleTimeout(resolve, ms));
  }

  function setStatus(message) {
    els.statusStrip.textContent = message;
  }

  function renderModeCards() {
    els.modeGrid.innerHTML = modes
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

    els.modeGrid.querySelectorAll('[data-mode]').forEach((button) => {
      bind(button, 'click', () => selectMode(button.dataset.mode));
    });
  }

  function showModeSelection() {
    els.homePanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
    els.modePanel.classList.remove('hidden');
    container.dataset.mode = 'modes';
  }

  function showHome() {
    state.mode = null;
    state.round = 0;
    state.currentPair = null;
    els.homePanel.classList.remove('hidden');
    els.modePanel.classList.add('hidden');
    els.gamePanel.classList.add('hidden');
    container.dataset.mode = 'home';
  }

  function toggleInfoModal(forceOpen) {
    const shouldOpen =
      typeof forceOpen === 'boolean' ? forceOpen : els.infoModal.classList.contains('hidden');
    els.infoModal.classList.toggle('hidden', !shouldOpen);
    els.infoModal.setAttribute('aria-hidden', String(!shouldOpen));
  }

  function updateOrientationHint() {
    if (!els.orientationHint) {
      return;
    }

    if (state.mode !== 'country-club') {
      els.orientationHint.textContent = 'Iki kulup gelecek';
      return;
    }

    if (state.round === 0) {
      els.orientationHint.textContent = 'Ilk tur: ulke solda';
      return;
    }

    els.orientationHint.textContent =
      state.lastCountryClubOrientation === 'country-left'
        ? 'Bu tur: ulke solda · sonraki Baslatta sagda'
        : 'Bu tur: ulke sagda · sonraki Baslatta solda';
  }

  function renderPair(pair) {
    window.__renderPairCalls = (window.__renderPairCalls ?? 0) + 1;
    els.leftCard.innerHTML = createCardMarkup(pair.left);
    els.rightCard.innerHTML = createCardMarkup(pair.right);
    hydrateClubBadges(els.leftCard);
    hydrateClubBadges(els.rightCard);
    els.leftCard.classList.add('reveal');
    els.rightCard.classList.add('reveal');
    scheduleTimeout(() => {
      els.leftCard.classList.remove('reveal');
      els.rightCard.classList.remove('reveal');
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
    els.modeLabel.textContent = activeMode.title;
    els.roundTitle.textContent = state.round === 0 ? 'Yeni Tur' : 'Eslesme Hazir';
    els.roundBadge.textContent = `Tur ${state.round}`;
    container.dataset.mode = activeMode.id;
    els.retryButton.classList.toggle('hidden', state.mode !== 'country-club');
    updateOrientationHint();
  }

  function selectMode(modeId) {
    state.mode = modeId;
    state.round = 0;
    state.currentPair = null;
    state.nextCountryClubOrientation = 'country-left';
    state.lastCountryClubOrientation = 'country-left';

    els.modePanel.classList.add('hidden');
    els.gamePanel.classList.remove('hidden');
    els.leftCard.innerHTML = `
      <div class="slot-placeholder">
        <span class="placeholder-icon">3</span>
        <p>Baslat'a bas ve eslesmeyi getir.</p>
      </div>
    `;
    els.rightCard.innerHTML = `
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
    els.countdownLayer.classList.remove('hidden');
    els.leftCard.classList.remove('reveal');
    els.rightCard.classList.remove('reveal');

    for (const value of [3, 2, 1]) {
      els.countdownValue.textContent = String(value);
      els.countdownLayer.classList.remove('pulse');
      void els.countdownLayer.offsetWidth;
      els.countdownLayer.classList.add('pulse');
      await sleep(820);
    }

    els.countdownLayer.classList.add('hidden');
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
    els.gamePanel.classList.add('hidden');
    els.modePanel.classList.remove('hidden');
    container.dataset.mode = 'modes';
  }

  const { clubClubConnections, countryClubConnections } = await ensureConnections();

  bind(els.startButton, 'click', startRound);
  bind(els.retryButton, 'click', rerollCountryClub);
  bind(els.backButton, 'click', goBack);
  bind(els.openModesButton, 'click', showModeSelection);
  bind(els.modeBackButton, 'click', showHome);
  bind(els.infoButton, 'click', () => toggleInfoModal(true));
  bind(els.closeInfoButton, 'click', () => toggleInfoModal(false));
  bind(els.infoModal, 'click', (event) => {
    if (event.target === els.infoModal) {
      toggleInfoModal(false);
    }
  });

  renderModeCards();

  if (!LOCAL_BADGES_ONLY) {
    try {
      const response = await fetch('./assets/logos/remote-badges.json', { cache: 'no-store' });
      remoteBadgeMap = response.ok ? await response.json() : {};
    } catch {
      remoteBadgeMap = {};
    }
  }

  cleanup = () => {
    boundListeners.forEach((off) => off());
    boundListeners.length = 0;
    pendingTimeouts.forEach((id) => window.clearTimeout(id));
    pendingTimeouts.clear();
  };
}

export function unmount() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
