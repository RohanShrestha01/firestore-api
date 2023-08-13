import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

import { getGames, getPrices } from './utils.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

app.use(
  cors({
    origin: [
      'https://firestore-react-1aabd.web.app',
      'https://firestore-react-1aabd.firebaseapp.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
  })
);

app.use(express.json());

app.get('/games/:category', async (req, res) => {
  const { page, search } = req.query;
  const category = req.params.category;
  let url;
  if (category === 'featured')
    url = `https://api.rawg.io/api/games?dates=2020-01-01,2022-12-31&page=${page}&page_size=40&key=${process.env.RAWG_KEY}`;
  else if (category === 'popular')
    url = `https://api.rawg.io/api/games?page=${page}&page_size=40&key=${process.env.RAWG_KEY}`;
  else if (category === 'BOAT')
    url = `https://api.rawg.io/api/games/lists/popular?page_size=40&page=${page}&key=${process.env.RAWG_KEY}`;
  else if (category === 'BOTY')
    url = `https://api.rawg.io/api/games/lists/greatest?ordering=-added&page=${page}&page_size=40&key=${process.env.RAWG_KEY}`;
  else if (category === 'new')
    url = `https://api.rawg.io/api/games/lists/recent-games-past?ordering=-added&page_size=40&page=${page}&key=${process.env.RAWG_KEY}`;
  else if (category === 'all')
    url = `https://api.rawg.io/api/games/lists/main?ordering=-released&page_size=40&page=${page}&key=${process.env.RAWG_KEY}`;
  else if (category === 'search')
    url = `https://api.rawg.io/api/games?page_size=40&page=${page}&search=${search}&search_exact=true&key=${process.env.RAWG_KEY}`;

  const games = await getGames(url);
  res.json(games);
});

app.get('/prices', async (req, res) => {
  const { plains } = req.query;
  const prices = await getPrices(plains);
  res.json(prices);
});

app.post('/create-checkout-session', async (req, res) => {
  const items = req.body.map(game => ({
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
      success_url: 'https://firestore-react-1aabd.web.app',
      cancel_url: 'https://firestore-react-1aabd.web.app',
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000);
