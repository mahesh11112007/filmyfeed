require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Enable trust proxy for production
app.set('trust proxy', 1);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Serve static files from /public with caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API proxy with rate limiting simulation
let requestCount = 0;
app.get('/api/*', async (req, res) => {
    requestCount++;

    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    if (!TMDB_API_KEY) {
        return res.status(500).json({ 
            error: 'TMDB_API_KEY is missing in environment',
            code: 'MISSING_API_KEY'
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
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'FilmyFeed/1.0'
            }
        });

        // Add custom headers for frontend
        res.setHeader('X-Request-Count', requestCount);
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache

        res.json(response.data);
    } catch (error) {
        const code = error.response?.status || 500;
        const msg = error.response?.data || { 
            error: 'Failed to fetch from TMDb',
            code: 'TMDB_ERROR',
            details: error.message
        };

        console.error(`API Error [${code}]:`, error.message);
        res.status(code).json(msg);
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

// Start server (for local development)
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`ðŸš€ FilmyFeed server running on port ${PORT}`);
    console.log(`ðŸŽ¬ Open http://localhost:${PORT} to view the app`);
});

module.exports = app;