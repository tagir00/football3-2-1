import { getItem, setItem } from './storage.js';

// A persisted "shuffle bag": every id comes out once, in random order, before
// any id repeats. The bag survives reloads (localStorage), so over several
// games players get to see every criterion instead of the same few cycling.
//
// `familyOf(id)` groups ids that feel alike (En Ucuz / En Pahalı Kadro share
// a field); the next draw avoids the previous draw's family whenever the bag
// holds anything else. When the bag is refilled, the most recent draws go to
// the back so the end of one round of the bag doesn't repeat right away.
export function createShuffleBag(storageKey, ids, familyOf = (id) => id) {
  const valid = new Set(ids);
  const recentSize = Math.floor(ids.length / 2);

  function shuffle(list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Fresh ids not already waiting in `bag`, recently drawn ones last.
  function refill(bag, recent) {
    const waiting = new Set(bag);
    const fresh = ids.filter((id) => !waiting.has(id));
    return [
      ...shuffle(fresh.filter((id) => !recent.includes(id))),
      ...shuffle(fresh.filter((id) => recent.includes(id))),
    ];
  }

  function load() {
    const saved = getItem(storageKey, null);
    const keep = (list) => (Array.isArray(list) ? list.filter((id) => valid.has(id)) : []);
    return { bag: keep(saved?.bag), recent: keep(saved?.recent) };
  }

  function draw() {
    let { bag, recent } = load();
    const last = recent[recent.length - 1] ?? null;
    const lastFamily = last == null ? null : familyOf(last);
    const allowed = (id) => id !== last && familyOf(id) !== lastFamily;

    if (bag.length === 0) {
      bag = refill(bag, recent);
    }
    let index = bag.findIndex(allowed);
    if (index === -1) {
      // Only near-duplicates of the last draw are left: queue the next bag
      // behind them and take from it; the leftovers still come out later.
      bag = [...bag, ...refill(bag, recent)];
      index = bag.findIndex(allowed);
      if (index === -1) index = 0;
    }

    const [id] = bag.splice(index, 1);
    recent = [...recent.filter((r) => r !== id), id].slice(-recentSize);
    setItem(storageKey, { bag, recent });
    return id;
  }

  return { draw };
}
