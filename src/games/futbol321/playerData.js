let cachedPlayerPool = null;

export async function loadPlayerPool() {
  if (!cachedPlayerPool) {
    const response = await fetch(new URL('./playerData.json', import.meta.url));
    cachedPlayerPool = await response.json();
  }

  return cachedPlayerPool;
}

const tierRank = {
  elite: 3,
  high: 2,
  solid: 1,
};

export function getEligiblePlayers(players, minimumBirthYear = 1970) {
  return players.filter((player) => player.birthYear >= minimumBirthYear);
}

export function buildClubClubConnections(players, allowedClubs) {
  const allowedClubSet = new Set(allowedClubs);
  const pairMap = new Map();

  for (const player of players) {
    const validClubs = player.clubs.filter((club) => allowedClubSet.has(club));

    for (let leftIndex = 0; leftIndex < validClubs.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < validClubs.length; rightIndex += 1) {
        const pair = [validClubs[leftIndex], validClubs[rightIndex]].sort();
        const key = pair.join('::');

        if (!pairMap.has(key)) {
          pairMap.set(key, {
            clubs: pair,
            players: [],
            strongestTier: player.tier,
          });
        }

        const entry = pairMap.get(key);
        entry.players.push(player.name);

        if (tierRank[player.tier] > tierRank[entry.strongestTier]) {
          entry.strongestTier = player.tier;
        }
      }
    }
  }

  return [...pairMap.values()].sort((left, right) => right.players.length - left.players.length);
}

export function buildCountryClubConnections(players, allowedCountries, allowedClubs) {
  const allowedCountrySet = new Set(allowedCountries);
  const allowedClubSet = new Set(allowedClubs);
  const pairMap = new Map();

  for (const player of players) {
    const validCountries = player.countries.filter((country) => allowedCountrySet.has(country));
    const validClubs = player.clubs.filter((club) => allowedClubSet.has(club));

    for (const country of validCountries) {
      for (const club of validClubs) {
        const key = `${country}::${club}`;

        if (!pairMap.has(key)) {
          pairMap.set(key, {
            country,
            club,
            players: [],
            strongestTier: player.tier,
          });
        }

        const entry = pairMap.get(key);
        entry.players.push(player.name);

        if (tierRank[player.tier] > tierRank[entry.strongestTier]) {
          entry.strongestTier = player.tier;
        }
      }
    }
  }

  return [...pairMap.values()].sort((left, right) => right.players.length - left.players.length);
}

export function summarizePlayerPool(players) {
  const summary = {
    totalPlayers: players.length,
    elite: 0,
    high: 0,
    solid: 0,
  };

  for (const player of players) {
    summary[player.tier] += 1;
  }

  return summary;
}

export function validatePlayerPool(players, allowedClubs, allowedCountries) {
  const allowedClubSet = new Set(allowedClubs);
  const allowedCountrySet = new Set(allowedCountries);

  return players.map((player) => ({
    name: player.name,
    unknownClubs: player.clubs.filter((club) => !allowedClubSet.has(club)),
    unknownCountries: player.countries.filter((country) => !allowedCountrySet.has(country)),
  }));
}
