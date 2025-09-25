require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error('❌ TMDB_API_KEY is missing in .env');
  process.exit(1);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy API to avoid CORS and hide API key
app.get('/api/*', async (req, res) => {
  const endpoint = req.params[0];
  const url = `${TMDB_BASE_URL}/${endpoint}`;
  try {
    const response = await axios.get(url, {
      params: { ...req.query, api_key: TMDB_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from TMDb' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
