const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'your_tmdb_api_key_here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.filmyfeed.com';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// CORS headers for all requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// ==========================================
// VIDEO STREAMING ENDPOINTS
// ==========================================

// HLS Master Manifest
app.get('/api/stream/:movieId/manifest.m3u8', async (req, res) => {
    try {
        const { movieId } = req.params;
        console.log(`ðŸŽ¬ HLS manifest request for movie ${movieId}`);

        const manifest = generateHLSMasterPlaylist(movieId);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(manifest);

    } catch (error) {
        console.error('Manifest error:', error);
        res.status(500).json({ error: 'Failed to generate manifest' });
    }
});

// Quality-specific playlist
app.get('/api/stream/:movieId/:quality/index.m3u8', async (req, res) => {
    try {
        const { movieId, quality } = req.params;
        console.log(`ðŸŽ¬ Quality playlist: ${quality} for movie ${movieId}`);

        const playlist = generateQualityPlaylist(movieId, quality);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(playlist);

    } catch (error) {
        console.error('Playlist error:', error);
        res.status(500).json({ error: 'Failed to generate playlist' });
    }
});

// Video segment proxy
app.get('/api/stream/:movieId/:quality/segment:segmentId.ts', async (req, res) => {
    try {
        const { movieId, quality, segmentId } = req.params;
        console.log(`ðŸŽ¬ Streaming segment: ${movieId}/${quality}/segment${segmentId}.ts`);

        // Mock segment for demo - in production, proxy to your CDN
        res.setHeader('Content-Type', 'video/MP2T');
        res.setHeader('Content-Length', '1048576');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const mockSegment = Buffer.alloc(1048576, 0x47);
        res.send(mockSegment);

    } catch (error) {
        console.error('Segment streaming error:', error);
        res.status(500).json({ error: 'Failed to stream segment' });
    }
});

// Download endpoint
app.get('/api/download/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const quality = req.query.quality || '720p';

        console.log(`â¬‡ï¸ Download request: movie ${movieId}, quality ${quality}`);

        // Generate download URL
        const downloadUrl = `${CDN_BASE_URL}/downloads/${movieId}_${quality}.mp4?expires=${Date.now() + 600000}`;

        // Get movie title for filename
        let filename = `Movie_${quality}.mp4`;
        try {
            const movieData = await fetchMovieData(movieId);
            if (movieData?.title) {
                filename = `${movieData.title.replace(/[^a-zA-Z0-9_.-]/g, '_')}_${quality}.mp4`;
            }
        } catch (e) {
            console.error('Error getting movie title:', e);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.redirect(302, downloadUrl);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Video info endpoint
app.get('/api/stream/:movieId/info', async (req, res) => {
    try {
        const { movieId } = req.params;

        const videoInfo = {
            movieId,
            available: true,
            qualities: ['480p', '720p', '1080p', '4K'],
            duration: 7200,
            formats: ['HLS', 'MP4'],
            subtitles: ['en'],
            audio_tracks: [{ language: 'en', codec: 'aac' }]
        };

        res.json(videoInfo);

    } catch (error) {
        console.error('Video info error:', error);
        res.status(500).json({ error: 'Failed to get video info' });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateHLSMasterPlaylist(movieId) {
    const qualities = ['480p', '720p', '1080p', '4K'];

    let playlist = `#EXTM3U\n#EXT-X-VERSION:6\n\n`;

    qualities.forEach(quality => {
        const bandwidth = getBandwidthForQuality(quality);
        const resolution = getResolutionForQuality(quality);

        playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
        playlist += `/api/stream/${movieId}/${quality}/index.m3u8\n\n`;
    });

    return playlist;
}

function generateQualityPlaylist(movieId, quality) {
    const segmentCount = 720; // 2 hours @ 10s segments
    const segmentDuration = 10;

    let playlist = `#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-TARGETDURATION:${segmentDuration}\n#EXT-X-MEDIA-SEQUENCE:0\n\n`;

    for (let i = 0; i < segmentCount; i++) {
        playlist += `#EXTINF:${segmentDuration}.0,\n`;
        playlist += `/api/stream/${movieId}/${quality}/segment${i.toString().padStart(6, '0')}.ts\n`;
    }

    playlist += '#EXT-X-ENDLIST\n';
    return playlist;
}

function getBandwidthForQuality(quality) {
    const bandwidths = {
        '480p': 1500000,
        '720p': 3000000,
        '1080p': 6000000,
        '4K': 15000000
    };
    return bandwidths[quality] || 3000000;
}

function getResolutionForQuality(quality) {
    const resolutions = {
        '480p': '854x480',
        '720p': '1280x720',
        '1080p': '1920x1080',
        '4K': '3840x2160'
    };
    return resolutions[quality] || '1280x720';
}

async function fetchMovieData(movieId) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching movie data:', error);
        return null;
    }
}

// ==========================================
// TMDB API PROXY
// ==========================================

app.get('/api/*', async (req, res) => {
    try {
        const apiPath = req.path.replace('/api/', '');
        const queryParams = { ...req.query, api_key: TMDB_API_KEY };
        const queryString = new URLSearchParams(queryParams).toString();
        const tmdbUrl = `${TMDB_BASE_URL}/${apiPath}?${queryString}`;

        console.log(`ðŸ“¡ TMDb API: ${apiPath}`);

        const response = await axios.get(tmdbUrl);

        res.setHeader('Cache-Control', 'public, max-age=300');
        res.json(response.data);

    } catch (error) {
        console.error('TMDb API Error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: error.response?.data || 'TMDb API request failed' 
        });
    }
});

// Serve static files and SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ðŸš€ FilmyFeed server running on port ${PORT}`);
    console.log(`ðŸŽ¬ Streaming: http://localhost:${PORT}/api/stream`);
    console.log(`ðŸ“± Web App: http://localhost:${PORT}`);
});

module.exports = app;