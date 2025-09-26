export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    
    if (!TMDB_API_KEY) {
        return res.status(500).json({ 
            success: false,
            error: 'TMDB API key not configured' 
        });
    }
    
    const { query } = req;
    const movieId = query.id;
    
    if (!movieId) {
        return res.status(400).json({ 
            success: false,
            error: 'Movie ID is required' 
        });
    }
    
    try {
        const tmdbUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`;
        
        const response = await fetch(tmdbUrl);
        
        if (!response.ok) {
            throw new Error(`TMDB API returned ${response.status}`);
        }
        
        const creditsData = await response.json();
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            success: true,
            data: creditsData
        });
        
    } catch (error) {
        console.error('Credits API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}