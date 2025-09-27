class MovieDetails {
  constructor() {
    this.apiBase = "/api";
    this.imgBase = "https://image.tmdb.org/t/p/w500";
    this.backdropBase = "https://image.tmdb.org/t/p/w1280";

    this.movieId = this.getLocalId();
    this.movieData = null;
    this.creditsData = null;

    this.init();
  }

  getLocalId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("localId");
  }

  async init() {
    if (!this.movieId) {
      console.error("No movieId provided");
      return;
    }

    try {
      // 1. Try local movies.json
      const localRes = await fetch("/movies.json");
      const localMovies = await localRes.json();
      const localMovie = localMovies.find((m) => m.localId === this.movieId);

      if (localMovie) {
        console.log("Loaded from movies.json:", localMovie);
        this.renderMovie(localMovie);
      } else {
        // 2. Fallback → TMDb API
        console.log("Fetching from TMDb:", this.movieId);
        const tmdbRes = await fetch(`${this.apiBase}/tmdb?id=${this.movieId}`);
        if (!tmdbRes.ok) throw new Error("TMDb fetch failed");

        const tmdbData = await tmdbRes.json();
        console.log("TMDb response:", tmdbData);
        this.renderMovie(tmdbData);
      }
    } catch (err) {
      console.error("Error loading movie:", err);
      document.body.innerHTML = `<p style="color:red">Failed to load movie: ${err.message}</p>`;
    }
  }

  renderMovie(data) {
    const container = document.getElementById("movie-container");
    if (!container) return;

    // Extract trailer (YouTube)
    let trailer = "";
    if (data.videos && data.videos.results.length > 0) {
      const yt = data.videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
      if (yt) {
        trailer = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${yt.key}" frameborder="0" allowfullscreen></iframe>`;
      }
    }

    container.innerHTML = `
      <h1>${data.title || data.name}</h1>
      <img src="${this.imgBase}${data.poster_path}" alt="${data.title}" style="max-width:200px;border-radius:10px;" />
      <p><b>Overview:</b> ${data.overview || "No overview available"}</p>
      <p><b>Release Date:</b> ${data.release_date || "N/A"}</p>
      ${trailer}
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => new MovieDetails());