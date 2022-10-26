import fetch from 'node-fetch';

export const getGames = async url => {
  const response = await fetch(url);

  const data = await response.json();
  /* To Remove Duplicate Games Data Sent from the Server */
  const gamesData = [
    ...new Map(data.results.map(game => [game.id, game])).values(),
  ];

  const gamesArr = gamesData.map(game => ({
    id: game.id,
    name: game.name,
    slug: game.slug,
    bgImage: game.background_image,
    genres: game.genres,
    clips: game.clip?.clips,
    metacriticScore: game.metacritic,
    rating: game.rating,
    released: game.released,
    platforms: game.parent_platforms,
    screenshots: game.short_screenshots,
  }));

  return { count: data.count, games: gamesArr };
};

export const getPrices = async plains => {
  const response = await fetch(
    `https://api.isthereanydeal.com/v01/game/prices/?key=${process.env.ITAD_KEY}&plains=${plains}`
  );
  const prices = await response.json();
  return Object.values(prices.data);
};
