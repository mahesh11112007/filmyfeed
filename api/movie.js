export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Get TMDB API key
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    
    if (!TMDB_API_KEY) {
        return res.status(500).json({ 
            success: false,
            error: 'TMDB API key not configured' 
        });
    }
    
    // Get movie ID from query
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ 
            success: false,
            error: 'Movie ID is required' 
        });
    }
    
    try {
        // Fetch from TMDB
        const tmdbUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
        
        const response = await fetch(tmdbUrl);
        
        if (!response.ok) {
            throw new Error(`TMDB API returned ${response.status}`);
        }
        
        const movieData = await response.json();
        
        // Return the data
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            success: true,
            data: movieData
        });
        
    } catch (error) {
        console.error('Movie API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}