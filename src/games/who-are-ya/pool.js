// Famous-player pool for Who Are Ya, sourced from the Draftinho team JSONs.
// Only players from the Big 5 leagues + Trendyol Super Lig, above a market
// value floor (~78 FIFA overall) so the mystery is always somebody the
// player has a reasonable chance of knowing.

const TEAM_IDS = [
  'ac-milan', 'inter-milan', 'juventus', 'napoli',
  'arsenal', 'aston-villa', 'chelsea', 'liverpool',
  'manchester-city', 'manchester-united', 'newcastle-united', 'tottenham-hotspur',
  'atletico-madrid', 'barcelona', 'real-madrid',
  'bayer-leverkusen', 'bayern-munich', 'borussia-dortmund',
  'paris-saint-germain',
  'basaksehir', 'besiktas', 'fenerbahce', 'galatasaray', 'trabzonspor',
];

const MIN_MARKET_VALUE = 15_000_000;

// Youth / reserve filter: for age ≤ 21, we require either "star" evidence
// (marketValue ≥ 30M€ or ≥ 5 senior international caps) OR a plausible
// first-team shirt (< 40) combined with a non-marginal profile. This lets
// Yamal, Endrick, Alajbegović, Rico Lewis etc. through, but drops academy
// squad-fillers wearing shirt 40+.
function passesYouthFilter(p) {
  if (p.age > 21) return true;
  const shirt = p.shirt ?? 99;
  const caps = p.intlAppearances ?? 0;
  const mv = p.marketValue ?? 0;
  const isStar = mv >= 30_000_000 || caps >= 5;
  if (isStar) return true;
  if (shirt >= 40) return false;
  const marginal = mv < 25_000_000 && caps < 3;
  return !marginal;
}

let poolPromise = null;

export function loadFamousPool() {
  if (poolPromise) return poolPromise;

  poolPromise = Promise.all(
    TEAM_IDS.map(async (id) => {
      const url = new URL(`../draftinho/teams/${id}.json`, import.meta.url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`team not loaded: ${id}`);
      return response.json();
    }),
  ).then((teams) => {
    const out = [];
    for (const team of teams) {
      const teamName = team.displayName || team.name;
      for (const p of team.players) {
        // Nationality field must be a real country name; the enrichment
        // script occasionally left a single-letter fragment behind for
        // players whose citizenship value contained a comma.
        if (!p.nationality || p.nationality.length <= 2) continue;
        if ((p.marketValue ?? 0) < MIN_MARKET_VALUE) continue;
        if (!passesYouthFilter(p)) continue;
        out.push({
          id: p.id,
          name: p.name,
          nationality: p.nationality,
          position: p.position,
          age: p.age,
          shirt: p.shirt ?? null,
          marketValue: p.marketValue,
          team: teamName,
          teamId: team.id,
          league: team.league,
        });
      }
    }
    return out;
  });

  return poolPromise;
}

export function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
