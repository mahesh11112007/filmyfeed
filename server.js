require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ ok: true });
});

// Proxy API to avoid CORS and hide API key
app.get('/api/*', async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    if (!TMDB_API_KEY) {
        return res.status(500).json({ 
            error: 'TMDB_API_KEY is missing in environment variables' 
        });
    }

    // Extract endpoint from URL (everything after /api/)
    const endpoint = req.params[0];
    const url = `${TMDB_BASE_URL}/${endpoint}`;

    try {
        const response = await axios.get(url, {
            params: {
                ...req.query,
                api_key: TMDB_API_KEY,
            },
            timeout: 10000,
        });

        // Set cache headers for better performance
        res.set({
            'Cache-Control': 'public, max-age=300', // 5 minutes
            'Content-Type': 'application/json'
        });

        res.json(response.data);
    } catch (error) {
        const code = error.response?.status || 500;
        const msg = error.response?.data || { 
            error: 'Failed to fetch from TMDb',
            message: error.message 
        };
        
        console.error('API Error:', {
            endpoint,
            status: code,
            message: error.message,
            url: url
        });

        res.status(code).json(msg);
    }
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve movie.html for movie details
app.get('/movie.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'movie.html'));
});

// Serve watch.html for watch page
app.get('/watch.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

// Catch-all handler for SPA behavior
app.get('*', (req, res) => {
    // For any other routes, serve the appropriate HTML file or 404
    const requestedFile = req.path.substring(1); // Remove leading slash
    
    if (requestedFile.endsWith('.html') || requestedFile.endsWith('.css') || 
        requestedFile.endsWith('.js') || requestedFile.endsWith('.png') || 
        requestedFile.endsWith('.jpg') || requestedFile.endsWith('.svg')) {
        // Try to serve static file, if it doesn't exist, 404 will be handled by express.static
        res.status(404).json({ error: 'File not found' });
    } else {
        // For other routes, redirect to home
        res.redirect('/');
    }
});

app.listen(PORT, () => {
    console.log(`ðŸš€ FilmyFeed server running on port ${PORT}`);
    console.log(`ðŸŒ Local: http://localhost:${PORT}`);
    console.log(`ðŸ“Š Health check: http://localhost:${PORT}/health`);
    
    if (process.env.TMDB_API_KEY) {
        console.log('âœ… TMDb API key configured');
    } else {
        console.error('âŒ TMDb API key not found! Set TMDB_API_KEY in your environment variables.');
    }
});