export const games = [
  {
    id: 'futbol321',
    title: 'Futbol 3-2-1',
    description: 'Iki kisilik kulup-kulup ve ulke-kulup futbol oyunu.',
    accent: 'game-futbol321',
    load: () => import('../games/futbol321/index.js'),
  },
  {
    id: 'draftinho',
    title: 'Draftinho',
    description: 'Kriter ve takim carki ile 6 kisilik kadro kurma duellosu.',
    accent: 'game-draftinho',
    load: () => import('../games/draftinho/index.js'),
  },
];

export function getGame(id) {
  return games.find((game) => game.id === id) ?? null;
}
