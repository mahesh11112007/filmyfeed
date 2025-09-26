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
    
    const { query, page = 1 } = req.query;
    
    if (!query) {
        return res.status(400).json({ 
            success: false,
            error: 'Search query is required' 
        });
    }
    
    try {
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;
        
        const response = await fetch(tmdbUrl);
        
        if (!response.ok) {
            throw new Error(`TMDB API returned ${response.status}`);
        }
        
        const searchData = await response.json();
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            success: true,
            data: searchData
        });
        
    } catch (error) {
        console.error('Search API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}