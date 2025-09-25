/**
 * FilmyFeed Professional - Home Page Controller
 * Features: Latest movies, search, collapsible search UI
 */

class FilmyFeedApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.currentQuery = '';
        this.isLoading = false;
        this.searchActive = false;

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
            noResultsEl: document.getElementById('no-results')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.handleInitialLoad();
    }

    setupEventListeners() {
        // Search toggle
        this.elements.searchToggle?.addEventListener('click', () => {
            this.toggleSearch();
        });

        // Search close
        this.elements.searchClose?.addEventListener('click', () => {
            this.closeSearch();
        });

        // Search functionality
        this.elements.searchBtn?.addEventListener('click', () => {
            this.handleSearch();
        });

        this.elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Movie card clicks
        this.elements.moviesGrid?.addEventListener('click', (e) => {
            const card = e.target.closest('.movie-card');
            if (card && !this.isLoading) {
                this.handleMovieClick(card);
            }
        });

        // Browser navigation
        window.addEventListener('popstate', () => {
            this.handleBrowserNavigation();
        });

        // Error retry
        this.elements.errorEl?.addEventListener('click', () => {
            this.retry();
        });

        // Close search on outside click
        document.addEventListener('click', (e) => {
            if (this.searchActive && 
                !e.target.closest('.search-container') && 
                !e.target.closest('.search-toggle')) {
                this.closeSearch();
            }
        });

        // Close search on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchActive) {
                this.closeSearch();
            }
        });
    }

    toggleSearch() {
        if (this.searchActive) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }

    openSearch() {
        this.searchActive = true;
        this.elements.searchWrapper?.classList.add('active');
        // Focus on input after animation
        setTimeout(() => {
            this.elements.searchInput?.focus();
        }, 200);
    }

    closeSearch() {
        this.searchActive = false;
        this.elements.searchWrapper?.classList.remove('active');
        this.elements.searchInput.value = '';
    }

    handleInitialLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.trim();

        if (query) {
            this.currentQuery = query;
            if (this.elements.searchInput) {
                this.elements.searchInput.value = query;
                this.openSearch();
            }
            this.loadSearchResults(query);
        } else {
            this.loadLatestMovies();
        }
    }

    handleSearch() {
        const query = this.elements.searchInput.value.trim();

        if (!query) {
            this.navigateToHome();
            return;
        }

        if (query === this.currentQuery) {
            return;
        }

        // Update URL
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
        window.history.pushState({ query }, '', newUrl);

        this.currentQuery = query;
        this.loadSearchResults(query);
        this.closeSearch();
    }

    navigateToHome() {
        window.history.pushState({}, '', window.location.pathname);
        this.currentQuery = '';
        this.closeSearch();
        this.loadLatestMovies();
    }

    handleBrowserNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.trim();

        if (query) {
            this.currentQuery = query;
            if (this.elements.searchInput) {
                this.elements.searchInput.value = query;
            }
            this.loadSearchResults(query);
        } else {
            this.currentQuery = '';
            if (this.elements.searchInput) {
                this.elements.searchInput.value = '';
            }
            this.loadLatestMovies();
        }
    }

    handleMovieClick(card) {
        const movieId = card.dataset.id;
        if (movieId) {
            // Add loading state
            card.style.opacity = '0.7';
            card.style.pointerEvents = 'none';

            // Navigate to movie details
            window.location.href = `/movie.html?id=${encodeURIComponent(movieId)}`;
        }
    }

    async loadLatestMovies() {
        this.updatePageHeader('Latest Released Movies', 'Discover the newest releases in theaters worldwide');
        await this.fetchAndRenderMovies('latest');
    }

    async loadSearchResults(query) {
        this.updatePageHeader(`Search Results for "${query}"`, `Found movies matching your search`);
        await this.fetchAndRenderMovies('search', { query });
    }

    async fetchAndRenderMovies(type, options = {}) {
        if (this.isLoading) return;

        this.showLoading();

        try {
            let movies = [];

            if (type === 'latest') {
                movies = await this.fetchLatestMovies();
            } else if (type === 'search') {
                movies = await this.fetchSearchMovies(options.query);
            }

            this.renderMovies(movies);

        } catch (error) {
            console.error('Error fetching movies:', error);
            this.showError('Failed to load movies. Click to retry.');
        } finally {
            this.hideLoading();
        }
    }

    async fetchLatestMovies() {
        const [page1, page2] = await Promise.all([
            this.fetchFromAPI('movie/now_playing', { 
                page: 1, 
                language: 'en-US', 
                region: 'IN' 
            }),
            this.fetchFromAPI('movie/now_playing', { 
                page: 2, 
                language: 'en-US', 
                region: 'IN' 
            })
        ]);

        return [...(page1?.results || []), ...(page2?.results || [])];
    }

    async fetchSearchMovies(query) {
        const data = await this.fetchFromAPI('search/movie', {
            query: query,
            include_adult: false,
            language: 'en-US',
            page: 1
        });

        return data?.results || [];
    }

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

    renderMovies(movies) {
        if (!Array.isArray(movies) || movies.length === 0) {
            this.showNoResults();
            return;
        }

        const moviesHTML = movies.map(movie => this.createMovieCard(movie)).join('');
        this.elements.moviesGrid.innerHTML = moviesHTML;

        // Animate cards in
        this.animateCards();

        this.hideAllStatus();
    }

    createMovieCard(movie) {
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
                ${posterUrl 
                    ? `<img class="movie-poster" src="${posterUrl}" alt="${title} poster" loading="lazy">` 
                    : `<div class="movie-poster" aria-label="No poster available"></div>`
                }
                <div class="movie-info">
                    <h3 class="movie-title" title="${title}">${title}</h3>
                    <div class="movie-meta">
                        <span class="badge">
                            <span class="year">${year}</span>
                        </span>
                        <span class="badge">
                            <span class="rating">â˜… ${rating}</span>
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    animateCards() {
        const cards = this.elements.moviesGrid.querySelectorAll('.movie-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    updatePageHeader(title, subtitle) {
        if (this.elements.pageTitle) {
            this.elements.pageTitle.textContent = title;
        }

        const subtitleEl = document.querySelector('.page-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = subtitle;
        }
    }

    showLoading() {
        this.isLoading = true;
        this.hideAllStatus();
        this.elements.loadingEl?.classList.remove('hidden');
        this.elements.moviesGrid.innerHTML = '';
    }

    hideLoading() {
        this.isLoading = false;
        this.elements.loadingEl?.classList.add('hidden');
    }

    showError(message) {
        this.hideAllStatus();
        if (this.elements.errorEl) {
            const textEl = this.elements.errorEl.querySelector('.status-text');
            if (textEl) {
                textEl.textContent = message;
            }
            this.elements.errorEl.classList.remove('hidden');
        }
        this.elements.moviesGrid.innerHTML = '';
    }

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.filmyFeedApp = new FilmyFeedApp();
});