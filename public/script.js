/**
 * FilmyFeed Mobile App - Netflix-style Interface
 * Home page controller with search, navigation, and movie browsing
 */

class FilmyFeedApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
        this.currentQuery = '';
        this.isLoading = false;
        this.searchActive = false;

        // DOM elements
        this.elements = {
            // Header
            searchBtn: document.getElementById('search-btn'),
            searchOverlay: document.getElementById('search-overlay'),
            searchInput: document.getElementById('search-input'),
            searchClose: document.getElementById('search-close'),

            // Hero
            heroSection: document.getElementById('hero-section'),
            heroBackground: document.getElementById('hero-background'),
            heroTitle: document.getElementById('hero-title'),
            heroDescription: document.getElementById('hero-description'),
            heroPlayBtn: document.getElementById('hero-play-btn'),
            heroInfoBtn: document.getElementById('hero-info-btn'),

            // Content rows
            featuredRow: document.getElementById('featured-row'),
            moviesRow: document.getElementById('movies-row'),

            // Search results
            searchResultsSection: document.getElementById('search-results-section'),
            searchResultsTitle: document.getElementById('search-results-title'),
            searchResultsGrid: document.getElementById('search-results-grid'),

            // Status
            loadingStatus: document.getElementById('loading-status'),
            errorStatus: document.getElementById('error-status'),
            noResultsStatus: document.getElementById('no-results-status'),

            // Navigation
            bottomNav: document.querySelector('.bottom-nav'),
            navItems: document.querySelectorAll('.nav-item')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialContent();
        this.handleUrlParams();
    }

    setupEventListeners() {
        // Search functionality
        this.elements.searchBtn?.addEventListener('click', () => {
            this.openSearch();
        });

        this.elements.searchClose?.addEventListener('click', () => {
            this.closeSearch();
        });

        this.elements.searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query) {
                this.performSearch(query);
            } else {
                this.showHomeContent();
            }
        });

        this.elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            }
        });

        // Search overlay background tap
        this.elements.searchOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.searchOverlay) {
                this.closeSearch();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchActive) {
                this.closeSearch();
            }
        });

        // Hero actions
        this.elements.heroPlayBtn?.addEventListener('click', () => {
            this.playFeaturedMovie();
        });

        this.elements.heroInfoBtn?.addEventListener('click', () => {
            this.showFeaturedMovieInfo();
        });

        // Bottom navigation
        this.elements.navItems?.forEach(item => {
            item.addEventListener('click', () => {
                this.handleNavigation(item.dataset.tab);
            });
        });

        // Error retry
        this.elements.errorStatus?.addEventListener('click', () => {
            this.retryLoad();
        });

        // Movie card clicks (using event delegation)
        document.addEventListener('click', (e) => {
            const movieCard = e.target.closest('.movie-card');
            if (movieCard && movieCard.dataset.id) {
                this.navigateToMovie(movieCard.dataset.id);
            }
        });
    }

    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
            this.elements.searchInput.value = query;
            this.openSearch();
            this.performSearch(query);
        }
    }

    // Search Functions
    openSearch() {
        this.searchActive = true;
        this.elements.searchOverlay?.classList.add('active');
        setTimeout(() => {
            this.elements.searchInput?.focus();
        }, 300);
    }

    closeSearch() {
        this.searchActive = false;
        this.elements.searchOverlay?.classList.remove('active');
        this.showHomeContent();
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }

        // Update URL
        window.history.pushState({}, '', '/');
    }

    async performSearch(query) {
        if (!query.trim()) return;

        this.currentQuery = query;
        this.showSearchResults();

        // Update URL
        window.history.pushState({}, '', `/?q=${encodeURIComponent(query)}`);

        try {
            const data = await this.fetchFromAPI('search/movie', {
                query: query,
                page: 1,
                include_adult: false,
                language: 'en-US'
            });

            this.renderSearchResults(data.results || []);

        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    // Content Loading
    async loadInitialContent() {
        try {
            this.showLoading();

            // Load hero content and content rows in parallel
            await Promise.all([
                this.loadHeroContent(),
                this.loadFeaturedContent(),
                this.loadMoviesContent()
            ]);

            this.hideLoading();

        } catch (error) {
            console.error('Loading error:', error);
            this.showError('Failed to load content. Tap to retry.');
        }
    }

    async loadHeroContent() {
        try {
            // Get now playing movies for hero
            const data = await this.fetchFromAPI('movie/now_playing', {
                page: 1,
                language: 'en-US'
            });

            const movies = data.results || [];
            if (movies.length > 0) {
                const heroMovie = movies[0]; // Use first movie as hero
                this.renderHeroMovie(heroMovie);
            }

        } catch (error) {
            console.error('Hero content error:', error);
        }
    }

    async loadFeaturedContent() {
        try {
            const data = await this.fetchFromAPI('movie/popular', {
                page: 1,
                language: 'en-US'
            });

            this.renderContentRow(this.elements.featuredRow, data.results || []);

        } catch (error) {
            console.error('Featured content error:', error);
            this.renderContentRow(this.elements.featuredRow, []);
        }
    }

    async loadMoviesContent() {
        try {
            const data = await this.fetchFromAPI('movie/top_rated', {
                page: 1,
                language: 'en-US'
            });

            this.renderContentRow(this.elements.moviesRow, data.results || []);

        } catch (error) {
            console.error('Movies content error:', error);
            this.renderContentRow(this.elements.moviesRow, []);
        }
    }

    // Rendering Functions
    renderHeroMovie(movie) {
        if (!movie || !this.elements.heroTitle) return;

        // Update hero background
        if (movie.backdrop_path && this.elements.heroBackground) {
            this.elements.heroBackground.style.backgroundImage = 
                `url(${this.BACKDROP_BASE}${movie.backdrop_path})`;
        }

        // Update hero content
        this.elements.heroTitle.textContent = movie.title || 'Featured Movie';
        this.elements.heroDescription.textContent = 
            (movie.overview || 'Discover amazing movies and shows.').substring(0, 200) + '...';

        // Store movie ID for hero actions
        if (this.elements.heroPlayBtn) {
            this.elements.heroPlayBtn.dataset.movieId = movie.id;
        }
        if (this.elements.heroInfoBtn) {
            this.elements.heroInfoBtn.dataset.movieId = movie.id;
        }
    }

    renderContentRow(container, movies) {
        if (!container) return;

        if (!movies || movies.length === 0) {
            container.innerHTML = '<div class="loading-placeholder"><span>No content available</span></div>';
            return;
        }

        const moviesHTML = movies.map(movie => this.createMovieCard(movie)).join('');
        container.innerHTML = moviesHTML;
    }

    renderSearchResults(movies) {
        if (!this.elements.searchResultsGrid) return;

        if (!movies || movies.length === 0) {
            this.elements.searchResultsGrid.innerHTML = 
                '<div class="loading-placeholder"><span>No results found</span></div>';
            return;
        }

        const moviesHTML = movies.map(movie => this.createMovieCard(movie)).join('');
        this.elements.searchResultsGrid.innerHTML = moviesHTML;

        // Update search results title
        if (this.elements.searchResultsTitle) {
            this.elements.searchResultsTitle.textContent = 
                `Search results for "${this.currentQuery}"`;
        }
    }

    createMovieCard(movie) {
        const posterUrl = movie.poster_path 
            ? `${this.IMG_BASE}${movie.poster_path}` 
            : null;

        const title = this.escapeHtml(movie.title || 'Untitled');
        const year = movie.release_date 
            ? new Date(movie.release_date).getFullYear() 
            : '';

        return `
            <div class="movie-card" data-id="${movie.id}" role="button" tabindex="0">
                ${posterUrl 
                    ? `<img class="card-poster" src="${posterUrl}" alt="${title}" loading="lazy">` 
                    : '<div class="card-poster no-poster"><span>No Image</span></div>'
                }
                <div class="card-info">
                    <div class="card-title">${title}</div>
                    ${year ? `<div class="card-year">${year}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Navigation Functions
    navigateToMovie(movieId) {
        if (!movieId) return;
        window.location.href = `/movie.html?id=${encodeURIComponent(movieId)}`;
    }

    playFeaturedMovie() {
        const movieId = this.elements.heroPlayBtn?.dataset.movieId;
        if (movieId) {
            window.location.href = `/watch.html?id=${encodeURIComponent(movieId)}`;
        }
    }

    showFeaturedMovieInfo() {
        const movieId = this.elements.heroInfoBtn?.dataset.movieId;
        if (movieId) {
            this.navigateToMovie(movieId);
        }
    }

    handleNavigation(tab) {
        // Update active nav item
        this.elements.navItems?.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        switch (tab) {
            case 'home':
                this.closeSearch();
                break;
            case 'search':
                this.openSearch();
                break;
            case 'coming-soon':
            case 'downloads':
            case 'more':
                console.log(`Navigation to ${tab} - Coming soon!`);
                break;
        }
    }

    // UI State Functions
    showHomeContent() {
        this.elements.searchResultsSection?.classList.add('hidden');
        document.querySelectorAll('.content-section:not(#search-results-section)')
            .forEach(section => section.classList.remove('hidden'));
    }

    showSearchResults() {
        document.querySelectorAll('.content-section:not(#search-results-section)')
            .forEach(section => section.classList.add('hidden'));
        this.elements.searchResultsSection?.classList.remove('hidden');
    }

    showLoading() {
        this.isLoading = true;
        this.hideAllStatus();
        this.elements.loadingStatus?.classList.remove('hidden');
    }

    hideLoading() {
        this.isLoading = false;
        this.elements.loadingStatus?.classList.add('hidden');
    }

    showError(message) {
        this.hideAllStatus();
        if (this.elements.errorStatus) {
            const span = this.elements.errorStatus.querySelector('span');
            if (span) span.textContent = message;
            this.elements.errorStatus.classList.remove('hidden');
        }
    }

    hideAllStatus() {
        this.elements.loadingStatus?.classList.add('hidden');
        this.elements.errorStatus?.classList.add('hidden');
        this.elements.noResultsStatus?.classList.add('hidden');
    }

    retryLoad() {
        this.loadInitialContent();
    }

    // API Functions
    async fetchFromAPI(endpoint, params = {}) {
        const url = new URL(`${this.API_BASE}/${endpoint}`, window.location.origin);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸŽ¬ FilmyFeed Mobile App initialized');
    window.filmyFeedApp = new FilmyFeedApp();
});