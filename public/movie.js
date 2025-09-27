class MovieDetailsApp {
    constructor() {
        this.apiBase = '/api';
        this.localId = new URLSearchParams(window.location.search).get('localId');
        this.movieId = new URLSearchParams(window.location.search).get('id');

        this.elements = {
            title: document.getElementById('movie-title'),
            overview: document.getElementById('movie-overview'),
            poster: document.getElementById('movie-poster'),
            backdrop: document.getElementById('movie-backdrop'),
            player: document.getElementById('movie-player')
        };

        this.init();
    }

    async init() {
        if (this.localId) {
            await this.loadFromLocal(this.localId);
        } else if (this.movieId) {
            await this.loadFromTMDb(this.movieId);
        } else {
            this.elements.title.textContent = 'Movie not found';
        }
    }

    async loadFromLocal(localId) {
        try {
            const res = await fetch('/movies.json');
            const movies = await res.json();
            const movie = movies.find(m => m.id.toString() === localId);
            if (movie) {
                this.renderMovie(movie);
            } else {
                // fallback to TMDb if not in local
                await this.loadFromTMDb(localId);
            }
        } catch (err) {
            console.error('Local fetch failed, trying TMDb…', err);
            await this.loadFromTMDb(localId);
        }
    }

    async loadFromTMDb(id) {
        try {
            const res = await fetch(`${this.apiBase}/tmdb?id=${id}`);
            const movie = await res.json();
            this.renderMovie(movie);
        } catch (err) {
            console.error('TMDb fetch failed', err);
            this.elements.title.textContent = 'Error loading movie';
        }
    }

    renderMovie(movie) {
        this.elements.title.textContent = movie.title || 'Untitled';
        this.elements.overview.textContent = movie.overview || '';
        if (movie.poster) this.elements.poster.src = movie.poster;
        if (movie.backdrop) this.elements.backdrop.src = movie.backdrop;

        // trailer / player placeholder
        if (movie.streamUrl) {
            this.elements.player.innerHTML = `
                <video controls autoplay src="${movie.streamUrl}"></video>
            `;
        } else {
            this.elements.player.textContent = 'No stream available';
        }
    }
}

// ✅ Instantiate class
document.addEventListener('DOMContentLoaded', () => new MovieDetailsApp());