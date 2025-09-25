/**
 * FilmyFeed Mobile - Touch-optimized with YouTube Trailers
 */
class FilmyFeedMobileApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.currentQuery = '';
        this.isLoading = false;
        this.searchActive = false;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.lastTouchEnd = 0;

        // DOM elements
        this.elements = {
            moviesGrid: document.getElementById('movies-grid'),
            searchToggle: document.getElementById('search-toggle'),
            searchWrapper: document.getElementById('search-wrapper'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchClose: document.getElementById('search-close'),
            pageTitle: document.getElementById('page-title'),
            loadingEl: document.getElementById('loading'),
            errorEl: document.getElementById('error'),
            noResultsEl: document.getElementById('no-results'),
            trailerModal: document.getElementById('trailer-modal'),
            trailerClose: document.getElementById('trailer-close'),
            trailerIframe: document.getElementById('trailer-iframe'),
            trailerTitle: document.getElementById('trailer-title')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTouchOptimizations();
        this.handleInitialLoad();
        this.preventZoom();
    }

    // ... (keep your existing methods, unchanged, until renderMovies)

    createMobileMovieCard(movie) {
        const posterUrl = movie.poster_path 
            ? `${this.IMG_BASE}${movie.poster_path}` 
            : null;

        const title = this.escapeHtml(movie.title || 'Untitled');
        const year = movie.release_date 
            ? new Date(movie.release_date).getFullYear() 
            : 'TBA';

        const rating = typeof movie.vote_average === 'number' 
            ? movie.vote_average.toFixed(1) 
            : 'N/A';

        return `
            <article class="movie-card" data-id="${movie.id}" role="button" tabindex="0">
                <div class="poster-container">
                    ${posterUrl 
                        ? `<img class="movie-poster" src="${posterUrl}" alt="${title} poster" loading="lazy">` 
                        : `<div class="movie-poster" style="display:flex;align-items:center;justify-content:center;color:#666;font-size:0.8rem;">No Poster</div>`
                    }
                </div>
                <div class="movie-info">
                    <h3 class="movie-title" title="${title}">${title}</h3>
                    <div class="movie-meta">
                        <span class="badge"><span class="year">${year}</span></span>
                        <span class="badge"><span class="rating">★ ${rating}</span></span>
                    </div>
                    <div class="movie-actions">
                        <button class="btn-trailer" data-id="${movie.id}" data-title="${title}">🎬 Trailer</button>
                        <button class="btn-details" data-id="${movie.id}">Details</button>
                    </div>
                </div>
            </article>
        `;
    }

    // --- Helpers that were missing ---
    showNoResults() {
        this.hideAllStatus();
        this.elements.noResultsEl?.classList.remove('hidden');
        this.elements.moviesGrid.innerHTML = '';
    }

    hideAllStatus() {
        this.elements.loadingEl?.classList.add('hidden');
        this.elements.errorEl?.classList.add('hidden');
        this.elements.noResultsEl?.classList.add('hidden');
    }

    retry() {
        if (this.currentQuery) {
            this.loadSearchResults(this.currentQuery);
        } else {
            this.loadLatestMovies();
        }
    }

    showNotification(message) {
        alert(message); // simple fallback for now
    }

    debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m]));
    }

    handleOrientationChange() {
        console.log('Orientation changed');
    }

    handleViewportChange() {
        console.log('Viewport resized');
    }
}

// Bootstrap app
document.addEventListener('DOMContentLoaded', () => {
    new FilmyFeedMobileApp();
});