export const games = [
  {
    id: 'futbol321',
    title: '3-2-1 GO!',
    cover: './assets/covers/321-go.svg',
    accent: 'game-futbol321',
    load: () => import('../games/futbol321/index.js'),
  },
  {
    id: 'draftinho',
    title: 'Draft6',
    cover: './assets/covers/draft6.svg',
    accent: 'game-draftinho',
    load: () => import('../games/draftinho/index.js'),
  },
  {
    id: 'who-are-ya',
    title: 'Ben Kimim?',
    cover: './assets/covers/ben-kimim.svg',
    accent: 'game-who-are-ya',
    load: () => import('../games/who-are-ya/index.js'),
  },
];

export function getGame(id) {
  return games.find((game) => game.id === id) ?? null;
}
