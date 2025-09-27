class MovieApp {
    constructor() {
        this.localMovies = [];
        this.apiBase = '/api';
        this.elements = {
            movieGrid: document.getElementById('movie-grid'),
            searchInput: document.getElementById('search-input')
        };

        this.init();
    }

    async init() {
        await this.loadLocalMovies();
        this.renderMovies(this.localMovies);

        this.elements.searchInput?.addEventListener('input', (e) => {
            this.searchMovies(e.target.value);
        });
    }

    async loadLocalMovies() {
        try {
            // ✅ Corrected path (your movies.json is in root /public)
            const response = await fetch('/movies.json');
            this.localMovies = await response.json();
            console.log(`📋 Loaded ${this.localMovies.length} local movies`);
        } catch (error) {
            console.log('⚠️ No local movies.json found, using TMDb only');
            this.localMovies = [];
        }
    }

    renderMovies(movies) {
        if (!this.elements.movieGrid) return;
        this.elements.movieGrid.innerHTML = movies.map(movie => `
            <div class="movie-card" data-local-id="${movie.id}">
                <img src="${movie.poster}" alt="${movie.title}">
                <h3>${movie.title}</h3>
            </div>
        `).join('');

        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const localId = card.dataset.localId;
                if (localId) {
                    window.location.href = `movie.html?localId=${localId}`;
                }
            });
        });
    }

    searchMovies(query) {
        const filtered = this.localMovies.filter(movie =>
            movie.title.toLowerCase().includes(query.toLowerCase())
        );
        this.renderMovies(filtered);
    }
}

document.addEventListener('DOMContentLoaded', () => new MovieApp());