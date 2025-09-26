// /api/index.js - Main API handler for Vercel
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    if (!TMDB_API_KEY) {
        return res.status(500).json({
            error: 'TMDB_API_KEY is missing in environment variables'
        });
    }

    // Extract the endpoint from the URL
    const { url } = req;
    const endpoint = url.replace('/api/', '');

    if (endpoint === 'health') {
        return res.json({ ok: true });
    }

    const tmdbUrl = `${TMDB_BASE_URL}/${endpoint}`;

    try {
        const params = new URLSearchParams({
            ...req.query,
            api_key: TMDB_API_KEY,
        });

        const response = await fetch(`${tmdbUrl}?${params}`);

        if (!response.ok) {
            throw new Error(`TMDb API error: ${response.status}`);
        }

        const data = await response.json();

        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('Content-Type', 'application/json');

        res.json(data);
    } catch (error) {
        console.error('API Error:', {
            endpoint,
            error: error.message,
            url: tmdbUrl
        });
        res.status(500).json({
            error: 'Failed to fetch from TMDb',
            message: error.message
        });
    }
}