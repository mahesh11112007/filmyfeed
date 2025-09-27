const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// TMDb API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// TMDb API proxy endpoints
app.get('/api/tmdb/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
            return res.status(500).json({ 
                error: 'TMDb API key not configured',
                message: 'Please add your TMDb API key to environment variables'
            });
        }

        const fetch = (await import('node-fetch')).default;
        const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`;

        console.log(`Fetching movie details for ID: ${id}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ 
            error: 'Failed to fetch movie details',
            message: error.message 
        });
    }
});

app.get('/api/tmdb/movie/:id/credits', async (req, res) => {
    try {
        const { id } = req.params;

        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
            return res.status(500).json({ 
                error: 'TMDb API key not configured',
                message: 'Please add your TMDb API key to environment variables'
            });
        }

        const fetch = (await import('node-fetch')).default;
        const url = `${TMDB_BASE_URL}/movie/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`;

        console.log(`Fetching credits for movie ID: ${id}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error fetching movie credits:', error);
        res.status(500).json({ 
            error: 'Failed to fetch movie credits',
            message: error.message 
        });
    }
});

// Search movies endpoint (optional - for future use)
app.get('/api/tmdb/search/movie', async (req, res) => {
    try {
        const { query, page = 1 } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
            return res.status(500).json({ 
                error: 'TMDb API key not configured',
                message: 'Please add your TMDb API key to environment variables'
            });
        }

        const fetch = (await import('node-fetch')).default;
        const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;

        console.log(`Searching movies: ${query}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ 
            error: 'Failed to search movies',
            message: error.message 
        });
    }
});

// Popular movies endpoint (optional - for future use)
app.get('/api/tmdb/movie/popular', async (req, res) => {
    try {
        const { page = 1 } = req.query;

        if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
            return res.status(500).json({ 
                error: 'TMDb API key not configured',
                message: 'Please add your TMDb API key to environment variables'
            });
        }

        const fetch = (await import('node-fetch')).default;
        const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;

        console.log('Fetching popular movies');
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ 
            error: 'Failed to fetch popular movies',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        tmdb_configured: TMDB_API_KEY && TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE'
    });
});

// Serve static files (fallback for SPA routing)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Serve the requested file or index.html for SPA routes
    const filePath = path.join(__dirname, 'public', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`TMDb API configured: ${TMDB_API_KEY && TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE'}`);
});

module.exports = app;