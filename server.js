require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString() 
    });
});

// API proxy to TMDb - Fixed syntax
app.get('/api/*', async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    if (!TMDB_API_KEY) {
        return res.status(500).json({ 
            error: 'TMDB_API_KEY is missing in environment' 
        });
    }

    const endpoint = req.params[0];
    const url = `${TMDB_BASE_URL}/${endpoint}`;

    try {
        const response = await axios.get(url, {
            params: {
                ...req.query,
                api_key: TMDB_API_KEY,
            },
            timeout: 15000,
        });

        // Add cache headers
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.json(response.data);
    } catch (error) {
        const code = error.response?.status || 500;
        const msg = error.response?.data || { 
            error: 'Failed to fetch from TMDb' 
        };
        console.error('API Error:', error.message);
        res.status(code).json(msg);
    }
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local development server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`ðŸš€ FilmyFeed server running on port ${PORT}`);
        console.log(`ðŸŽ¬ Open http://localhost:${PORT} to view the app`);
    });
}

module.exports = app;