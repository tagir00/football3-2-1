// Aggregate yellow_cards, red_cards, assists per player from Transfermarkt
// appearances.csv, then patch every Draftinho team JSON with those totals.
//
// Usage: node scripts/draftinho-add-cards-assists.mjs

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\//, ''));
const APPEARANCES = path.join(ROOT, 'data', 'csv', 'archive', 'appearances.csv');
const TEAMS_DIR = path.join(ROOT, 'src', 'games', 'draftinho', 'teams');
const NATIONALS_DIR = path.join(ROOT, 'src', 'games', 'draftinho', 'national-teams');

function listJson(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
}

function readTeam(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return { file, data: JSON.parse(raw) };
}

function collectWantedIds() {
  const files = [...listJson(TEAMS_DIR), ...listJson(NATIONALS_DIR)];
  const ids = new Set();
  const teams = files.map(readTeam);
  for (const { data } of teams) {
    for (const p of data.players) {
      if (typeof p.id === 'number') ids.add(p.id);
    }
  }
  return { teams, wantedIds: ids };
}

async function aggregate(wantedIds) {
  const totals = new Map(); // playerId -> { yellow, red, assists }
  const stream = fs.createReadStream(APPEARANCES, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = null;
  let idxPlayerId, idxYellow, idxRed, idxAssists;
  let lineNo = 0;

  for await (const line of rl) {
    lineNo++;
    if (!line) continue;
    if (!header) {
      header = line.split(',');
      idxPlayerId = header.indexOf('player_id');
      idxYellow = header.indexOf('yellow_cards');
      idxRed = header.indexOf('red_cards');
      idxAssists = header.indexOf('assists');
      if ([idxPlayerId, idxYellow, idxRed, idxAssists].some((i) => i < 0)) {
        throw new Error('appearances.csv header not as expected');
      }
      continue;
    }
    // Simple CSV split — none of the numeric/id fields contain commas or quotes.
    const cols = line.split(',');
    const pid = Number(cols[idxPlayerId]);
    if (!wantedIds.has(pid)) continue;
    const y = Number(cols[idxYellow]) || 0;
    const r = Number(cols[idxRed]) || 0;
    const a = Number(cols[idxAssists]) || 0;
    let t = totals.get(pid);
    if (!t) { t = { yellow: 0, red: 0, assists: 0 }; totals.set(pid, t); }
    t.yellow += y;
    t.red += r;
    t.assists += a;

    if (lineNo % 250000 === 0) {
      process.stdout.write(`  ...${lineNo} rows scanned, matched ${totals.size}/${wantedIds.size} players\n`);
    }
  }
  return totals;
}

function patchTeam({ file, data }, totals) {
  let matched = 0;
  const missing = [];
  for (const p of data.players) {
    const t = totals.get(p.id);
    if (t) {
      p.assists = t.assists;
      p.yellowCards = t.yellow;
      p.redCards = t.red;
      matched++;
    } else {
      p.assists = 0;
      p.yellowCards = 0;
      p.redCards = 0;
      missing.push({ id: p.id, name: p.name });
    }
  }
  // Preserve the original PowerShell-style formatting? The existing files use
  // 4-space indent with a space after the colon. JSON.stringify with 4-space
  // indent is close enough and stable across future edits.
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + '\n', 'utf8');
  return { matched, missing, total: data.players.length };
}

async function main() {
  console.log('Collecting player IDs from Draftinho JSONs...');
  const { teams, wantedIds } = collectWantedIds();
  console.log(`  ${wantedIds.size} unique player IDs across ${teams.length} teams\n`);

  console.log('Aggregating appearances.csv (this takes a moment)...');
  const totals = await aggregate(wantedIds);
  console.log(`  matched ${totals.size}/${wantedIds.size} players in appearances data\n`);

  console.log('Patching team JSONs...');
  const allMissing = [];
  for (const t of teams) {
    const { matched, missing, total } = patchTeam(t, totals);
    const teamName = path.basename(t.file);
    console.log(`  ${teamName.padEnd(28)} ${matched}/${total} matched`);
    for (const m of missing) allMissing.push({ team: teamName, ...m });
  }

  console.log(`\nTotal unmatched players: ${allMissing.length}`);
  if (allMissing.length) {
    const outPath = path.join(ROOT, 'data', 'draftinho-unmatched-players.json');
    fs.writeFileSync(outPath, JSON.stringify(allMissing, null, 2), 'utf8');
    console.log(`  wrote list to ${outPath}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
