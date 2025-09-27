/**
 * FilmyFeed Mobile App - Netflix-style Interface
 * CORRECTED version with proper navigation and TMDb enrichment
 */

class FilmyFeedApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
        this.currentQuery = '';
        this.isLoading = false;
        this.searchActive = false;
        this.localMovies = [];

        this.elements = {
            nav: {
                homeBtn: document.getElementById('home-btn'),
                backBtn: document.getElementById('back-btn'),
                searchBtn: document.getElementById('search-btn'),
                shareBtn: document.getElementById('share-btn'),
            },
            sliderNav: {
                moviesTab: document.getElementById('movies-tab'),
                showsTab: document.getElementById('shows-tab'),
            },
            moviesContainer: document.getElementById('movies-container'),
            resultsContainer: document.getElementById('search-results'),
            loader: document.getElementById('loader'),
            moviePopup: document.getElementById('movie-popup'),
            popupTitle: document.getElementById('popup-title'),
            popupOverview: document.getElementById('popup-overview'),
            popupRating: document.getElementById('popup-rating'),
            popupActionButton: document.getElementById('popup-action-btn'),
            searchForm: document.getElementById('search-form'),
            searchInput: document.getElementById('search-input')
        };

        this.init();
    }

    // Initialize event listeners and initial content load
    async init() {
        this.setupEventListeners();
        await this.loadLocalMovies();
        this.loadInitialContent();
        this.handleUrlParams();
    }

    // Load movies.json for local storage of movie links
    async loadLocalMovies() {
        try {
            const response = await fetch('/movies.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.localMovies = await response.json();
            console.log('📂 Loaded local movies:', this.localMovies);
        } catch (error) {
            console.warn('No local movies.json found, using TMDb only');
            this.localMovies = [];
        }
    }

    // Setup UI event listeners
    setupEventListeners() {
        // Navigation buttons
        if (this.elements.nav.searchBtn) {
            this.elements.nav.searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSearch();
            });
        }
        if (this.elements.nav.backBtn) {
            this.elements.nav.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }
        // Search form
        if (this.elements.searchForm) {
            this.elements.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = this.elements.searchInput.value.trim();
                if (query) {
                    this.searchMovies(query);
                }
            });
        }
    }

    // Load initial content (trending, top rated, etc.)
    async loadInitialContent() {
        // Example: fetch trending movies
        const movies = await this.fetchFromAPI('trending/movie/week');
        this.renderMovies(movies.results);
    }

    // Handle movie link clicks via URL params
    handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const localId = params.get('localId');
        if (id || localId) {
            window.location.href = `movie.html${id ? '?id=' + id : '?localId=' + localId}`;
        }
    }

    // Search TMDb for movies
    async searchMovies(query) {
        if (this.isLoading) return;
        this.isLoading = true;
        const movies = await this.fetchFromAPI('search/movie', { query });
        this.elements.resultsContainer.innerHTML = '';
        this.renderMovies(movies.results, this.elements.resultsContainer);
        this.isLoading = false;
    }

    // Render a list of movie cards
    renderMovies(movies, container = this.elements.moviesContainer) {
        if (!movies || movies.length === 0) {
            container.innerHTML = '<p>No results found.</p>';
            return;
        }
        container.innerHTML = '';
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            if (movie.id) movieCard.dataset.id = movie.id;
            if (movie.localId) movieCard.dataset.localId = movie.localId;
            movieCard.innerHTML = `
                <img src="${this.IMG_BASE + movie.poster_path}" alt="${this.escapeHtml(movie.title)} poster">
                <h3>${this.escapeHtml(movie.title)}</h3>
            `;
            container.appendChild(movieCard);

            // Click to open movie page
            movieCard.addEventListener('click', (e) => {
                const movieCardElem = e.currentTarget;
                e.preventDefault();
                // Check if it's a local movie or TMDb movie
                if (movieCardElem.dataset.localId) {
                    window.location.href = `movie.html?localId=${encodeURIComponent(movieCardElem.dataset.localId)}`;
                } else if (movieCardElem.dataset.id) {
                    window.location.href = `movie.html?id=${encodeURIComponent(movieCardElem.dataset.id)}`;
                }
            });
        });
    }

    // Show or hide search bar
    toggleSearch() {
        if (!this.searchActive) {
            this.elements.searchForm.style.display = 'block';
            this.searchActive = true;
        } else {
            this.elements.searchForm.style.display = 'none';
            this.searchActive = false;
        }
    }

    // Go back to previous page or home
    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/index.html';
        }
    }

    // Fetch from TMDb API via proxy
    async fetchFromAPI(endpoint, params = {}) {
        try {
            const url = new URL(`${this.API_BASE}/${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    // Escape text to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 FilmyFeed Mobile App initialized');
    window.filmyFeedApp = new FilmyFeedApp();
});