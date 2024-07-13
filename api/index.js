import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';
import Stripe from 'stripe';
dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

app.use(
  cors({
    origin: [
      'https://gamebazaar.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
  })
);

app.use(express.json());

app.get('/', (_, res) => {
  res.send('API is working perfectly fine!');
});

app.get('/games/:category', async (req, res) => {
  const page = req.query.page ?? 1;
  const search = req.query.search ?? '';
  const category = req.params.category;
  let url = 'https://api.rawg.io/api/games';

  if (category === 'featured')
    url += `?dates=2020-01-01,2022-12-31&page=${page}&page_size=40&key=${process.env.RAWG_KEY}`;
  else if (category === 'popular')
    url += `?page=${page}&page_size=40&key=${process.env.RAWG_KEY}`;
  else if (category === 'BOAT')
    url += `/lists/popular?page_size=40&page=${page}&key=${process.env.RAWG_KEY}`;
  else if (category === 'BOTY')
    url += `/lists/greatest?ordering=-added&page=${page}&page_size=40&key=${process.env.RAWG_KEY}`;
  else if (category === 'new')
    url += `/lists/recent-games-past?ordering=-added&page_size=40&page=${page}&key=${process.env.RAWG_KEY}`;
  else if (category === 'all')
    url += `/lists/main?ordering=-released&page_size=40&page=${page}&key=${process.env.RAWG_KEY}`;
  else if (category === 'search')
    url += `?page_size=40&page=${page}&search=${search}&search_exact=true&key=${process.env.RAWG_KEY}`;

  const response = await fetch(url);

  const data = await response.json();
  /* To Remove Duplicate Games Data Sent from the Server */
  const gamesData = [
    ...new Map(data.results.map((game) => [game.id, game])).values(),
  ];

  const gamesArr = gamesData.map((game) => ({
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

  res.json({ count: data.count, games: gamesArr });
});

app.get('/prices', async (req, res) => {
  const { plains } = req.query;

  const response = await fetch(
    `https://api.isthereanydeal.com/v01/game/prices/?key=${process.env.ITAD_KEY}&plains=${plains}`
  );
  const prices = await response.json();

  res.json(Object.values(prices.data));
});

app.post('/create-checkout-session', async (req, res) => {
  const items = req.body.map((game) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: game.name },
      unit_amount: Math.round((+game.price).toFixed(2) * 100),
    },
    quantity: 1,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: items,
      mode: 'payment',
      success_url: 'https://gamebazaar.netlify.app',
      cancel_url: 'https://gamebazaar.netlify.app',
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000);

export default app;
