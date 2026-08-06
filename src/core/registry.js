export const games = [
  {
    id: 'futbol321',
    title: 'Futbol 3-2-1',
    description: 'Iki kisilik kulup-kulup ve ulke-kulup futbol oyunu.',
    accent: 'game-futbol321',
    load: () => import('../games/futbol321/index.js'),
  },
];

export function getGame(id) {
  return games.find((game) => game.id === id) ?? null;
}
