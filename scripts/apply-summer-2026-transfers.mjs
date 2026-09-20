// Applies summer 2026 transfer deltas to draftinho team JSONs.
// - Intra-pool moves: relocate the existing player entry (preserves stats).
// - Departures out of pool: remove the entry from the source team.
// - New signings into pool: insert a fresh entry with best-effort fields.
//
// Run: node scripts/apply-summer-2026-transfers.mjs
// Reads/writes src/games/draftinho/teams/*.json in place.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const teamsDir = path.join(__dirname, '..', 'src', 'games', 'draftinho', 'teams');

// Intra-pool moves — the player already exists in `from` team JSON, we relocate
// the entry to `to` and update shirt if provided.
const intraPoolMoves = [
  // Premier League
  { name: 'Bruno Guimarães',  from: 'newcastle-united',   to: 'arsenal' },
  { name: 'Ezri Konsa',       from: 'aston-villa',        to: 'arsenal' },
  { name: 'Piero Hincapié',   from: 'bayer-leverkusen',   to: 'arsenal' },
  { name: 'Leandro Trossard', from: 'arsenal',            to: 'besiktas' },
  { name: 'Gabriel Jesus',    from: 'arsenal',            to: 'barcelona' },
  { name: 'Enzo Fernández',   from: 'chelsea',            to: 'manchester-city' },
  { name: 'Marc Cucurella',   from: 'chelsea',            to: 'real-madrid' },
  { name: 'Bernardo Silva',   from: 'manchester-city',    to: 'real-madrid' },
  { name: 'Rodri',            from: 'manchester-city',    to: 'barcelona' },
  { name: 'Nico González',    from: 'manchester-city',    to: 'newcastle-united' },
  { name: 'John Stones',      from: 'manchester-city',    to: 'inter-milan' },
  { name: 'Manuel Akanji',    from: 'manchester-city',    to: 'inter-milan' },
  { name: 'Denzel Dumfries',  from: 'inter-milan',        to: 'real-madrid' },
  { name: 'Curtis Jones',     from: 'liverpool',          to: 'inter-milan' },
  { name: 'Djed Spence',      from: 'tottenham-hotspur',  to: 'inter-milan' },
  { name: 'Cristian Romero',  from: 'tottenham-hotspur',  to: 'atletico-madrid' },
  { name: 'Alejandro Grimaldo', from: 'bayer-leverkusen', to: 'atletico-madrid' },
  { name: 'Andrey Santos',    from: 'chelsea',            to: 'manchester-united' },
  { name: 'Youri Tielemans',  from: 'aston-villa',        to: 'manchester-united' },
  { name: 'Bradley Barcola',  from: 'paris-saint-germain', to: 'liverpool' },
  { name: 'Kolo Muani',       from: 'paris-saint-germain', to: 'juventus' },
  { name: 'Gonçalo Ramos',    from: 'paris-saint-germain', to: 'ac-milan' },
  { name: 'Sandro Tonali',    from: 'newcastle-united',   to: 'tottenham-hotspur' },
  { name: 'Salih Özcan',      from: 'borussia-dortmund',  to: 'besiktas' },
  { name: 'Rasmus Højlund',   from: 'manchester-united',  to: 'napoli' },
  { name: 'Rafael Leão',      from: 'ac-milan',           to: 'galatasaray' },
  { name: 'Karim Adeyemi',    from: 'borussia-dortmund',  to: 'barcelona' },
  { name: 'Ronald Araújo',    from: 'barcelona',          to: 'liverpool' },
  { name: 'Nicolas Jackson',  from: 'chelsea',            to: 'aston-villa' },
  { name: 'Morgan Rogers',    from: 'aston-villa',        to: 'chelsea' },
  { name: 'Emiliano Martínez', from: 'aston-villa',       to: 'chelsea' },
  { name: 'Dušan Vlahović',   from: 'juventus',           to: 'besiktas' },
  { name: 'Romelu Lukaku',    from: 'napoli',             to: 'fenerbahce' },
  { name: 'Mohamed Salah',    from: 'liverpool',          to: 'trabzonspor' },
  { name: 'André Onana',      from: 'manchester-united',  to: 'trabzonspor' },
  { name: 'Andrew Robertson', from: 'liverpool',          to: 'tottenham-hotspur' },
  { name: 'Leon Goretzka',    from: 'bayern-munich',      to: 'aston-villa' },
  { name: 'Lucas Digne',      from: 'aston-villa',        to: 'paris-saint-germain' },
  { name: 'Nathan Aké',       from: 'manchester-city',    to: 'fenerbahce' },
  { name: 'Guglielmo Vicario', from: 'tottenham-hotspur', to: 'juventus' },
  { name: 'Jonathan David',   from: 'juventus',           to: 'atletico-madrid' },
  { name: 'Alexander Nübel',  from: 'bayern-munich',      to: 'besiktas' },
];

// Departures out of pool: player leaves a pool team for a non-pool team.
// Remove from source. (If the player was already sold last season, this is a no-op.)
const outOfPoolDepartures = [
  { name: 'Jadon Sancho',    from: 'manchester-united',  to: 'released' },
  { name: 'Casemiro',        from: 'manchester-united',  to: 'inter-miami' },
  { name: 'Tyrell Malacia',  from: 'manchester-united',  to: 'released' },
  { name: 'Dani Carvajal',   from: 'real-madrid',        to: 'released' },
  { name: 'David Alaba',     from: 'real-madrid',        to: 'released' },
  { name: 'Dani Ceballos',   from: 'real-madrid',        to: 'real-betis' },
  { name: 'Robert Lewandowski', from: 'barcelona',       to: 'chicago-fire' },
  { name: 'Antoine Griezmann', from: 'atletico-madrid',  to: 'orlando-city' },
  { name: 'Clément Lenglet', from: 'atletico-madrid',    to: 'benfica' },
  { name: 'Raphaël Guerreiro', from: 'bayern-munich',    to: 'released' },
  { name: 'João Palhinha',   from: 'bayern-munich',      to: 'benfica' },
  { name: 'Julian Brandt',   from: 'borussia-dortmund',  to: 'ajax' },
  { name: 'Niklas Süle',     from: 'borussia-dortmund',  to: 'sv-tiefenbach' },
  { name: 'Moussa Diaby',    from: 'aston-villa',        to: 'bayer-leverkusen-return' },
  { name: 'Cristian Norgaard', from: 'arsenal',          to: 'everton' },
  { name: 'Karl Hein',       from: 'arsenal',            to: 'werder-bremen' },
  { name: 'Jakub Kiwior',    from: 'arsenal',            to: 'fc-porto' },
  { name: 'Trevoh Chalobah', from: 'chelsea',            to: 'como' },
  { name: 'Liam Delap',      from: 'chelsea',            to: 'nottingham-forest' },
  { name: 'Kieran Trippier', from: 'newcastle-united',   to: 'wolves' },
  { name: 'Anthony Gordon',  from: 'newcastle-united',   to: 'barcelona' }, // in pool but handled as new signing below
  { name: 'Yves Bissouma',   from: 'tottenham-hotspur',  to: 'released' },
  { name: 'Álvaro Morata',   from: 'ac-milan',           to: 'como' },
  { name: 'Santiago Giménez', from: 'ac-milan',          to: 'fc-porto' },
  { name: 'Ismaël Bennacer', from: 'ac-milan',           to: 'released' },
  { name: 'Stefan de Vrij',  from: 'inter-milan',        to: 'panathinaikos' },
  { name: 'Matteo Darmian',  from: 'inter-milan',        to: 'released' },
  { name: 'Kristjan Asllani', from: 'inter-milan',       to: 'al-jazira' },
  { name: 'Filip Kostić',    from: 'juventus',           to: 'psv-eindhoven' },
];

// New signings from outside our pool. Provide best-effort fields.
// id is a synthetic large number to avoid clashing with real TM ids.
const newSignings = [
  // Arsenal
  { team: 'arsenal', player: {
    id: 9000001, name: 'Christos Tzolis', slug: 'christos-tzolis', position: 'FW', shirt: null,
    age: 24, birth: '2002-01-30', height: 179, marketValue: 34000000,
    intlGoals: 3, intlAppearances: 24, assists: 12, yellowCards: 8, redCards: 0, nationality: 'Greece' } },
  { team: 'arsenal', player: {
    id: 9000002, name: 'Illan Meslier', slug: 'illan-meslier', position: 'GK', shirt: null,
    age: 26, birth: '2000-03-02', height: 197, marketValue: 12000000,
    intlGoals: 0, intlAppearances: 0, assists: 0, yellowCards: 4, redCards: 0, nationality: 'France' } },

  // Aston Villa
  { team: 'aston-villa', player: {
    id: 9000010, name: 'João Gomes', slug: 'joao-gomes', position: 'MID', shirt: null,
    age: 25, birth: '2001-02-12', height: 176, marketValue: 40000000,
    intlGoals: 1, intlAppearances: 8, assists: 4, yellowCards: 22, redCards: 1, nationality: 'Brazil' } },
  { team: 'aston-villa', player: {
    id: 9000011, name: 'Johan Manzambi', slug: 'johan-manzambi', position: 'MID', shirt: null,
    age: 20, birth: '2005-10-30', height: 178, marketValue: 60000000,
    intlGoals: 0, intlAppearances: 0, assists: 2, yellowCards: 3, redCards: 0, nationality: 'Switzerland' } },
  { team: 'aston-villa', player: {
    id: 9000012, name: 'Alejandro Garnacho', slug: 'alejandro-garnacho', position: 'FW', shirt: null,
    age: 22, birth: '2004-07-01', height: 180, marketValue: 55000000,
    intlGoals: 2, intlAppearances: 18, assists: 8, yellowCards: 10, redCards: 0, nationality: 'Argentina' } },

  // Chelsea
  { team: 'chelsea', player: {
    id: 9000020, name: 'Marco Palestra', slug: 'marco-palestra', position: 'DEF', shirt: null,
    age: 20, birth: '2005-08-08', height: 183, marketValue: 45000000,
    intlGoals: 0, intlAppearances: 0, assists: 2, yellowCards: 5, redCards: 0, nationality: 'Italy' } },
  { team: 'chelsea', player: {
    id: 9000021, name: 'Danny Welbeck', slug: 'danny-welbeck', position: 'FW', shirt: null,
    age: 35, birth: '1990-11-26', height: 185, marketValue: 3000000,
    intlGoals: 16, intlAppearances: 42, assists: 39, yellowCards: 21, redCards: 0, nationality: 'England' } },
  { team: 'chelsea', player: {
    id: 9000022, name: 'Jordan Henderson', slug: 'jordan-henderson', position: 'MID', shirt: null,
    age: 36, birth: '1990-06-17', height: 187, marketValue: 2500000,
    intlGoals: 3, intlAppearances: 82, assists: 78, yellowCards: 82, redCards: 3, nationality: 'England' } },

  // Liverpool
  { team: 'liverpool', player: {
    id: 9000030, name: 'Víctor Muñoz', slug: 'victor-munoz', position: 'MID', shirt: null,
    age: 21, birth: '2005-01-15', height: 179, marketValue: 35000000,
    intlGoals: 0, intlAppearances: 0, assists: 3, yellowCards: 4, redCards: 0, nationality: 'Spain' } },
  { team: 'liverpool', player: {
    id: 9000031, name: 'Lucca Brughmans', slug: 'lucca-brughmans', position: 'MID', shirt: null,
    age: 21, birth: '2005-04-12', height: 182, marketValue: 30000000,
    intlGoals: 0, intlAppearances: 0, assists: 2, yellowCards: 3, redCards: 0, nationality: 'Belgium' } },

  // Manchester City
  { team: 'manchester-city', player: {
    id: 9000040, name: 'Elliot Anderson', slug: 'elliot-anderson', position: 'MID', shirt: null,
    age: 23, birth: '2002-11-06', height: 182, marketValue: 100000000,
    intlGoals: 1, intlAppearances: 6, assists: 12, yellowCards: 10, redCards: 0, nationality: 'England' } },
  { team: 'manchester-city', player: {
    id: 9000041, name: 'Gerónimo Rulli', slug: 'geronimo-rulli', position: 'GK', shirt: null,
    age: 34, birth: '1992-05-20', height: 189, marketValue: 8000000,
    intlGoals: 0, intlAppearances: 6, assists: 0, yellowCards: 5, redCards: 1, nationality: 'Argentina' } },
  { team: 'manchester-city', player: {
    id: 9000042, name: 'Ayyoub Bouaddi', slug: 'ayyoub-bouaddi', position: 'MID', shirt: null,
    age: 18, birth: '2007-10-02', height: 175, marketValue: 90000000,
    intlGoals: 0, intlAppearances: 0, assists: 1, yellowCards: 2, redCards: 0, nationality: 'France' } },
  { team: 'manchester-city', player: {
    id: 9000043, name: 'Iliman Ndiaye', slug: 'iliman-ndiaye', position: 'FW', shirt: null,
    age: 26, birth: '2000-03-06', height: 178, marketValue: 60000000,
    intlGoals: 6, intlAppearances: 22, assists: 14, yellowCards: 6, redCards: 0, nationality: 'Senegal' } },

  // Manchester United
  { team: 'manchester-united', player: {
    id: 9000050, name: 'Carlos Baleba', slug: 'carlos-baleba', position: 'MID', shirt: null,
    age: 22, birth: '2004-01-03', height: 178, marketValue: 70000000,
    intlGoals: 0, intlAppearances: 4, assists: 4, yellowCards: 12, redCards: 0, nationality: 'Cameroon' } },
  { team: 'manchester-united', player: {
    id: 9000051, name: 'Karl Darlow', slug: 'karl-darlow', position: 'GK', shirt: null,
    age: 35, birth: '1990-10-08', height: 188, marketValue: 1500000,
    intlGoals: 0, intlAppearances: 0, assists: 0, yellowCards: 4, redCards: 0, nationality: 'England' } },

  // Newcastle
  { team: 'newcastle-united', player: {
    id: 9000060, name: 'Bazoumana Touré', slug: 'bazoumana-toure', position: 'FW', shirt: null,
    age: 22, birth: '2004-03-15', height: 180, marketValue: 40000000,
    intlGoals: 1, intlAppearances: 3, assists: 3, yellowCards: 4, redCards: 0, nationality: 'Ivory Coast' } },
  { team: 'newcastle-united', player: {
    id: 9000061, name: 'Sean Steur', slug: 'sean-steur', position: 'MID', shirt: null,
    age: 20, birth: '2006-01-15', height: 180, marketValue: 22000000,
    intlGoals: 0, intlAppearances: 0, assists: 2, yellowCards: 2, redCards: 0, nationality: 'Netherlands' } },

  // Tottenham
  { team: 'tottenham-hotspur', player: {
    id: 9000070, name: 'Marcos Senesi', slug: 'marcos-senesi', position: 'DEF', shirt: null,
    age: 29, birth: '1997-05-10', height: 185, marketValue: 30000000,
    intlGoals: 0, intlAppearances: 3, assists: 3, yellowCards: 20, redCards: 1, nationality: 'Argentina' } },
  { team: 'tottenham-hotspur', player: {
    id: 9000071, name: 'Jan Paul van Hecke', slug: 'jan-paul-van-hecke', position: 'DEF', shirt: null,
    age: 25, birth: '2000-06-08', height: 185, marketValue: 45000000,
    intlGoals: 0, intlAppearances: 2, assists: 3, yellowCards: 12, redCards: 0, nationality: 'Netherlands' } },
  { team: 'tottenham-hotspur', player: {
    id: 9000072, name: 'Martin Dúbravka', slug: 'martin-dubravka', position: 'GK', shirt: null,
    age: 37, birth: '1989-01-15', height: 191, marketValue: 2000000,
    intlGoals: 0, intlAppearances: 51, assists: 0, yellowCards: 5, redCards: 0, nationality: 'Slovakia' } },

  // Serie A - AC Milan
  { team: 'ac-milan', player: {
    id: 9000100, name: 'Mario Gila', slug: 'mario-gila', position: 'DEF', shirt: null,
    age: 25, birth: '2000-08-29', height: 187, marketValue: 20000000,
    intlGoals: 0, intlAppearances: 0, assists: 1, yellowCards: 12, redCards: 0, nationality: 'Spain' } },
  { team: 'ac-milan', player: {
    id: 9000101, name: 'Filip Kostić', slug: 'filip-kostic-partizan', position: 'MID', shirt: null,
    age: 33, birth: '1992-11-01', height: 184, marketValue: 4000000,
    intlGoals: 8, intlAppearances: 63, assists: 92, yellowCards: 55, redCards: 2, nationality: 'Serbia' } },

  // Inter
  { team: 'inter-milan', player: {
    id: 9000110, name: 'Ivan Provedel', slug: 'ivan-provedel', position: 'GK', shirt: null,
    age: 32, birth: '1994-03-17', height: 194, marketValue: 8000000,
    intlGoals: 0, intlAppearances: 3, assists: 0, yellowCards: 5, redCards: 0, nationality: 'Italy' } },
  { team: 'inter-milan', player: {
    id: 9000111, name: 'Aleksandar Stanković', slug: 'aleksandar-stankovic', position: 'MID', shirt: null,
    age: 20, birth: '2005-08-04', height: 181, marketValue: 20000000,
    intlGoals: 0, intlAppearances: 2, assists: 1, yellowCards: 3, redCards: 0, nationality: 'Serbia' } },

  // Juventus
  { team: 'juventus', player: {
    id: 9000120, name: 'Nick Woltemade', slug: 'nick-woltemade', position: 'FW', shirt: null,
    age: 24, birth: '2002-02-14', height: 198, marketValue: 50000000,
    intlGoals: 3, intlAppearances: 11, assists: 4, yellowCards: 6, redCards: 0, nationality: 'Germany' } },
  { team: 'juventus', player: {
    id: 9000121, name: 'Pape Matar Sarr', slug: 'pape-matar-sarr', position: 'MID', shirt: null,
    age: 23, birth: '2002-09-14', height: 184, marketValue: 45000000,
    intlGoals: 1, intlAppearances: 22, assists: 8, yellowCards: 14, redCards: 0, nationality: 'Senegal' } },

  // Napoli
  { team: 'napoli', player: {
    id: 9000130, name: 'Benoît Badiashile', slug: 'benoit-badiashile', position: 'DEF', shirt: null,
    age: 25, birth: '2001-03-26', height: 194, marketValue: 30000000,
    intlGoals: 0, intlAppearances: 4, assists: 2, yellowCards: 12, redCards: 0, nationality: 'France' } },

  // Bayern
  { team: 'bayern-munich', player: {
    id: 9000140, name: 'Ismael Saibari', slug: 'ismael-saibari', position: 'MID', shirt: null,
    age: 25, birth: '2001-01-08', height: 178, marketValue: 45000000,
    intlGoals: 2, intlAppearances: 12, assists: 22, yellowCards: 12, redCards: 0, nationality: 'Morocco' } },
  { team: 'bayern-munich', player: {
    id: 9000141, name: 'Nathaniel Brown', slug: 'nathaniel-brown', position: 'DEF', shirt: null,
    age: 23, birth: '2003-05-04', height: 178, marketValue: 35000000,
    intlGoals: 0, intlAppearances: 2, assists: 3, yellowCards: 7, redCards: 0, nationality: 'Germany' } },

  // Dortmund
  { team: 'borussia-dortmund', player: {
    id: 9000150, name: 'Joey Veerman', slug: 'joey-veerman', position: 'MID', shirt: null,
    age: 27, birth: '1998-11-19', height: 181, marketValue: 25000000,
    intlGoals: 0, intlAppearances: 5, assists: 44, yellowCards: 24, redCards: 0, nationality: 'Netherlands' } },
  { team: 'borussia-dortmund', player: {
    id: 9000151, name: 'Konstantinos Karetsas', slug: 'konstantinos-karetsas', position: 'MID', shirt: null,
    age: 18, birth: '2007-11-06', height: 176, marketValue: 20000000,
    intlGoals: 1, intlAppearances: 4, assists: 1, yellowCards: 2, redCards: 0, nationality: 'Greece' } },
  { team: 'borussia-dortmund', player: {
    id: 9000152, name: 'Giannis Konstantelias', slug: 'giannis-konstantelias', position: 'MID', shirt: null,
    age: 22, birth: '2003-05-08', height: 180, marketValue: 20000000,
    intlGoals: 1, intlAppearances: 12, assists: 6, yellowCards: 6, redCards: 0, nationality: 'Greece' } },

  // Bayer Leverkusen
  { team: 'bayer-leverkusen', player: {
    id: 9000160, name: 'Facundo Medina', slug: 'facundo-medina', position: 'DEF', shirt: null,
    age: 26, birth: '1999-05-28', height: 185, marketValue: 30000000,
    intlGoals: 0, intlAppearances: 4, assists: 3, yellowCards: 32, redCards: 3, nationality: 'Argentina' } },
  { team: 'bayer-leverkusen', player: {
    id: 9000161, name: 'Miguel Gutiérrez', slug: 'miguel-gutierrez-napoli', position: 'DEF', shirt: null,
    age: 24, birth: '2001-07-27', height: 179, marketValue: 22000000,
    intlGoals: 0, intlAppearances: 0, assists: 8, yellowCards: 10, redCards: 0, nationality: 'Spain' } },
  { team: 'bayer-leverkusen', player: {
    id: 9000162, name: 'Guéla Doué', slug: 'guela-doue', position: 'DEF', shirt: null,
    age: 23, birth: '2002-11-17', height: 179, marketValue: 20000000,
    intlGoals: 0, intlAppearances: 4, assists: 4, yellowCards: 8, redCards: 0, nationality: 'Ivory Coast' } },

  // Süper Lig - Besiktas
  { team: 'besiktas', player: {
    id: 9000200, name: 'İlhan Fakılı', slug: 'ilhan-fakili', position: 'DEF', shirt: null,
    age: 25, birth: '2000-12-01', height: 178, marketValue: 4000000,
    intlGoals: 0, intlAppearances: 0, assists: 2, yellowCards: 8, redCards: 0, nationality: 'Türkiye' } },
  { team: 'besiktas', player: {
    id: 9000201, name: 'Kassoum Ouattara', slug: 'kassoum-ouattara', position: 'DEF', shirt: null,
    age: 22, birth: '2003-08-29', height: 180, marketValue: 6000000,
    intlGoals: 0, intlAppearances: 0, assists: 2, yellowCards: 4, redCards: 0, nationality: 'France' } },

  // Süper Lig - Başakşehir
  { team: 'basaksehir', player: {
    id: 9000210, name: 'Emin Bayram', slug: 'emin-bayram', position: 'DEF', shirt: null,
    age: 23, birth: '2003-01-01', height: 189, marketValue: 3500000,
    intlGoals: 0, intlAppearances: 4, assists: 1, yellowCards: 8, redCards: 0, nationality: 'Türkiye' } },
];

// Load one team JSON
function loadTeam(id) {
  const p = path.join(teamsDir, `${id}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveTeam(id, data) {
  const p = path.join(teamsDir, `${id}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 4) + '\n');
}

// Case- and diacritic-insensitive name compare.
function norm(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findPlayerIndex(players, name) {
  const target = norm(name);
  // Exact
  let idx = players.findIndex((p) => norm(p.name) === target);
  if (idx >= 0) return idx;
  // Last name loose match: try last token match
  const lastToken = target.split(' ').slice(-1)[0];
  const candidates = players
    .map((p, i) => ({ i, n: norm(p.name) }))
    .filter((x) => x.n.split(' ').slice(-1)[0] === lastToken);
  if (candidates.length === 1) return candidates[0].i;
  // Substring
  idx = players.findIndex((p) => norm(p.name).includes(target) || target.includes(norm(p.name)));
  return idx;
}

const teamsCache = new Map();
function getTeam(id) {
  if (!teamsCache.has(id)) teamsCache.set(id, loadTeam(id));
  return teamsCache.get(id);
}

const summary = { intraMoves: [], notFound: [], departures: [], newSignings: [], dupSkipped: [] };

// Apply intra-pool moves
for (const move of intraPoolMoves) {
  const from = getTeam(move.from);
  const to = getTeam(move.to);

  const idx = findPlayerIndex(from.players, move.name);
  if (idx < 0) {
    // Maybe already at target — skip if there.
    const tgtIdx = findPlayerIndex(to.players, move.name);
    if (tgtIdx >= 0) {
      summary.dupSkipped.push({ name: move.name, from: move.from, to: move.to, reason: 'already at target' });
    } else {
      summary.notFound.push({ ...move });
    }
    continue;
  }

  const [entry] = from.players.splice(idx, 1);
  // Ensure not already at target (safety)
  if (findPlayerIndex(to.players, entry.name) < 0) {
    to.players.push(entry);
  }
  summary.intraMoves.push({ name: entry.name, from: move.from, to: move.to });
}

// Apply out-of-pool departures
for (const dep of outOfPoolDepartures) {
  const from = getTeam(dep.from);
  const idx = findPlayerIndex(from.players, dep.name);
  if (idx < 0) {
    summary.notFound.push({ ...dep, kind: 'departure' });
    continue;
  }
  from.players.splice(idx, 1);
  summary.departures.push({ name: dep.name, from: dep.from, to: dep.to });
}

// Add new signings
for (const s of newSignings) {
  const to = getTeam(s.team);
  const existingIdx = findPlayerIndex(to.players, s.player.name);
  if (existingIdx >= 0) {
    summary.dupSkipped.push({ name: s.player.name, to: s.team, reason: 'already present' });
    continue;
  }
  to.players.push(s.player);
  summary.newSignings.push({ name: s.player.name, to: s.team });
}

// Save all touched teams
for (const [id, data] of teamsCache) {
  saveTeam(id, data);
}

console.log(JSON.stringify(summary, null, 2));
console.log('\nDone. Touched teams:', teamsCache.size);
