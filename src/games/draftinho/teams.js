const TEAM_IDS = [
  'ac-milan',
  'ajax',
  'arsenal',
  'aston-villa',
  'atletico-madrid',
  'barcelona',
  'basaksehir',
  'bayer-leverkusen',
  'bayern-munich',
  'benfica',
  'besiktas',
  'borussia-dortmund',
  'chelsea',
  'fenerbahce',
  'galatasaray',
  'inter-milan',
  'juventus',
  'liverpool',
  'manchester-city',
  'manchester-united',
  'napoli',
  'newcastle-united',
  'paris-saint-germain',
  'porto',
  'real-madrid',
  'tottenham-hotspur',
  'trabzonspor',
];

let teamsPromise = null;

export function loadTeams() {
  if (!teamsPromise) {
    teamsPromise = Promise.all(
      TEAM_IDS.map(async (id) => {
        const url = new URL(`./teams/${id}.json`, import.meta.url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Team veri yuklenemedi: ${id}`);
        }
        return response.json();
      }),
    );
  }
  return teamsPromise;
}

export function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function findPlayerInTeam(team, positionFilter, query) {
  if (!query) {
    return null;
  }
  const normalizedQuery = normalizeName(query);
  const candidates = team.players.filter((player) => {
    if (positionFilter && player.position !== positionFilter) {
      return false;
    }
    return true;
  });

  const exact = candidates.find((player) => normalizeName(player.name) === normalizedQuery);
  if (exact) {
    return exact;
  }

  const startsWith = candidates.find((player) => normalizeName(player.name).startsWith(normalizedQuery));
  if (startsWith) {
    return startsWith;
  }

  const contains = candidates.find((player) => normalizeName(player.name).includes(normalizedQuery));
  return contains ?? null;
}

export function suggestPlayers(team, positionFilter, query, limit = 12) {
  const normalizedQuery = normalizeName(query);
  const candidates = team.players.filter((player) => {
    if (positionFilter && player.position !== positionFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return normalizeName(player.name).includes(normalizedQuery);
  });

  // Sort by market value descending so notable players show first
  candidates.sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));

  return candidates.slice(0, limit);
}
