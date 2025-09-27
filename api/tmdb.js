// api/tmdb.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Missing TMDb movie ID" });
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TMDB_API_KEY is not set in Vercel" });
    }

    // Fetch full movie details with credits & videos (for trailers)
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,videos`
    );

    if (!tmdbRes.ok) {
      const errorText = await tmdbRes.text();
      return res.status(tmdbRes.status).json({ error: errorText });
    }

    const data = await tmdbRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}