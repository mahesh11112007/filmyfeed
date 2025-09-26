

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// TMDb API Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'your_tmdb_api_key_here';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// CDN & Storage Configuration
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.filmyfeed.com';
const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL || 'https://storage.filmyfeed.com';
const VIDEO_QUALITY_LEVELS = ['480p', '720p', '1080p', '4K'];

// Middleware
app.use(express.static('public'));
app.use(express.json());

// CORS for video streaming
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

// Get video manifest/playlist for a movie
app.get('/api/stream/:movieId/manifest.m3u8', async (req, res) => {
    try {
        const { movieId } = req.params;
        const quality = req.query.quality || 'auto';

        console.log(`ðŸŽ¬ Requesting video manifest for movie ${movieId}`);

        // Generate HLS master playlist
        const manifest = generateHLSMasterPlaylist(movieId, quality);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'max-age=300'); // 5 minutes cache
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(manifest);

    } catch (error) {
        console.error('Manifest error:', error);
        res.status(500).json({ error: 'Failed to generate manifest' });
    }
});

// Get specific quality playlist
app.get('/api/stream/:movieId/:quality/index.m3u8', async (req, res) => {
    try {
        const { movieId, quality } = req.params;

        console.log(`ðŸŽ¬ Requesting ${quality} playlist for movie ${movieId}`);

        // Generate quality-specific playlist
        const playlist = generateQualityPlaylist(movieId, quality);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'max-age=300');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(playlist);

    } catch (error) {
        console.error('Playlist error:', error);
        res.status(500).json({ error: 'Failed to generate playlist' });
    }
});

// Stream video segments (proxy to CDN)
app.get('/api/stream/:movieId/:quality/segment:segmentId.ts', async (req, res) => {
    try {
        const { movieId, quality, segmentId } = req.params;

        // Construct CDN URL for the segment
        const cdnUrl = `${CDN_BASE_URL}/videos/${movieId}/${quality}/segment${segmentId}.ts`;

        console.log(`ðŸŽ¬ Streaming segment: ${cdnUrl}`);

        // Proxy request to CDN with range support
        const response = await fetch(cdnUrl, {
            headers: {
                'Range': req.headers.range || '',
                'User-Agent': 'FilmyFeed-Server/1.0'
            }
        });

        if (!response.ok) {
            return res.status(404).json({ error: 'Video segment not found' });
        }

        // Forward CDN headers
        res.setHeader('Content-Type', 'video/MP2T');
        res.setHeader('Content-Length', response.headers.get('content-length'));
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'max-age=86400'); // 24 hours cache
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (response.headers.get('content-range')) {
            res.setHeader('Content-Range', response.headers.get('content-range'));
            res.status(206); // Partial Content
        }

        // Stream the video segment
        response.body.pipe(res);

    } catch (error) {
        console.error('Segment streaming error:', error);
        res.status(500).json({ error: 'Failed to stream video segment' });
    }
});

// Direct video file streaming (for downloads/offline)
app.get('/api/download/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const quality = req.query.quality || '720p';

        console.log(`â¬‡ï¸ Download request for movie ${movieId} in ${quality}`);

        // Generate signed download URL
        const downloadUrl = generateSignedDownloadUrl(movieId, quality);

        if (!downloadUrl) {
            return res.status(404).json({ error: 'Download not available' });
        }

        // Get movie metadata for filename
        const movieData = await fetchMovieData(movieId);
        const filename = `${movieData?.title || 'Movie'}_${quality}.mp4`.replace(/[^a-zA-Z0-9_.-]/g, '_');

        // Redirect to signed CDN URL with download headers
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.redirect(302, downloadUrl);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Get video metadata and available qualities
app.get('/api/stream/:movieId/info', async (req, res) => {
    try {
        const { movieId } = req.params;

        // Simulate video metadata (replace with actual storage lookup)
        const videoInfo = {
            movieId,
            available: true,
            qualities: VIDEO_QUALITY_LEVELS,
            duration: 7200, // 2 hours in seconds
            formats: ['HLS', 'MP4'],
            subtitles: ['en', 'es', 'fr', 'de', 'hi'],
            audio_tracks: [
                { language: 'en', codec: 'aac' },
                { language: 'es', codec: 'aac' }
            ]
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

function generateHLSMasterPlaylist(movieId, requestedQuality) {
    const qualities = requestedQuality === 'auto' ? VIDEO_QUALITY_LEVELS : [requestedQuality];

    let playlist = `#EXTM3U
#EXT-X-VERSION:6

`;

    // Add quality variants
    qualities.forEach(quality => {
        const bandwidth = getBandwidthForQuality(quality);
        const resolution = getResolutionForQuality(quality);

        playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},CODECS="avc1.64001f,mp4a.40.2"
/api/stream/${movieId}/${quality}/index.m3u8

`;
    });

    return playlist;
}

function generateQualityPlaylist(movieId, quality) {
    // Simulate 10-second segments for a 2-hour movie (720 segments)
    const segmentCount = 720;
    const segmentDuration = 10;

    let playlist = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:${segmentDuration}
#EXT-X-MEDIA-SEQUENCE:0

`;

    for (let i = 0; i < segmentCount; i++) {
        playlist += `#EXTINF:${segmentDuration}.0,
/api/stream/${movieId}/${quality}/segment${i.toString().padStart(6, '0')}.ts
`;
    }

    playlist += '#EXT-X-ENDLIST\n';

    return playlist;
}

function getBandwidthForQuality(quality) {
    const bandwidths = {
        '480p': 1500000,  // 1.5 Mbps
        '720p': 3000000,  // 3 Mbps
        '1080p': 6000000, // 6 Mbps
        '4K': 15000000    // 15 Mbps
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

function generateSignedDownloadUrl(movieId, quality) {
    // Generate signed URL with expiration (replace with actual implementation)
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    const signature = Buffer.from(`${movieId}-${quality}-${expiresAt}`).toString('base64');

    return `${CDN_BASE_URL}/downloads/${movieId}_${quality}.mp4?expires=${expiresAt}&signature=${signature}`;
}

// ==========================================
// EXISTING TMDB API PROXY ENDPOINTS
// ==========================================

// Proxy TMDb API requests
app.get('/api/*', async (req, res) => {
    try {
        const apiPath = req.path.replace('/api/', '');
        const queryString = new URLSearchParams(req.query).toString();
        const tmdbUrl = `${TMDB_BASE_URL}/${apiPath}?api_key=${TMDB_API_KEY}&${queryString}`;

        console.log(`ðŸ“¡ TMDb API: ${tmdbUrl}`);

        const response = await fetch(tmdbUrl);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('TMDb API Error:', error);
        res.status(500).json({ error: 'Failed to fetch from TMDb API' });
    }
});

async function fetchMovieData(movieId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie data:', error);
        return null;
    }
}

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ðŸš€ FilmyFeed streaming server running on port ${PORT}`);
    console.log(`ðŸŽ¬ CDN Base URL: ${CDN_BASE_URL}`);
    console.log(`ðŸ“¦ Storage Base URL: ${STORAGE_BASE_URL}`);
    console.log(`ðŸŽµ Open http://localhost:${PORT} to view the app`);
});