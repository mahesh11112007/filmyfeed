/**
 * FilmyFeed Professional - Home Page Controller
 * Handles movie discovery, search, and navigation
 */

class FilmyFeedApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.currentQuery = '';
        this.isLoading = false;
        this.cache = new Map();

        // DOM elements
        this.elements = {
            moviesGrid: document.getElementById('movies-grid'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchForm: document.querySelector('.search-form'),
            pageTitle: document.getElementById('page-title'),
            pageSubtitle: document.querySelector('.page-subtitle'),
            loadingEl: document.getElementById('loading'),
            errorEl: document.getElementById('error'),
            noResultsEl: document.getElementById('no-results')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.handleInitialLoad();
        this.preloadCriticalResources();
    }

    setupEventListeners() {
        // Search form submission
        this.elements.searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Search button click
        this.elements.searchBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Search input enter key
        this.elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
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
    }

    handleInitialLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.trim();

        if (query) {
            this.currentQuery = query;
            this.elements.searchInput.value = query;
            this.loadSearchResults(query);
        } else {
            this.loadLatestMovies();
        }
    }

    async handleSearch() {
        const query = this.elements.searchInput.value.trim();

        if (!query) {
            this.navigateToHome();
            return;
        }

        if (query === this.currentQuery) {
            return; // Avoid duplicate searches
        }

        // Update URL without page reload
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
        window.history.pushState({ query }, '', newUrl);

        this.currentQuery = query;
        await this.loadSearchResults(query);
    }

    navigateToHome() {
        window.history.pushState({}, '', window.location.pathname);
        this.currentQuery = '';
        this.elements.searchInput.value = '';
        this.loadLatestMovies();
    }

    handleBrowserNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.trim();

        if (query) {
            this.currentQuery = query;
            this.elements.searchInput.value = query;
            this.loadSearchResults(query);
        } else {
            this.currentQuery = '';
            this.elements.searchInput.value = '';
            this.loadLatestMovies();
        }
    }

    handleMovieClick(card) {
        const movieId = card.dataset.id;
        if (movieId) {
            // Add loading state to clicked card
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
        this.updatePageHeader(
            `Search Results for "${query}"`,
            `Found movies matching your search for "${query}"`
        );
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
            this.hideLoading();

        } catch (error) {
            console.error('Error fetching movies:', error);
            this.showError('Failed to load movies. Click to retry.');
        }
    }

    async fetchLatestMovies() {
        const cacheKey = 'latest_movies';

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
                return cached.data;
            }
        }

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

        const movies = [
            ...(page1?.results || []),
            ...(page2?.results || [])
        ];

        // Cache the results
        this.cache.set(cacheKey, {
            data: movies,
            timestamp: Date.now()
        });

        return movies;
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

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'default'
        });

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
            <article class="movie-card" data-id="${movie.id}" tabindex="0" role="button" aria-label="View details for ${title}">
                <div class="poster-container">
                    ${posterUrl 
                        ? `<img class="movie-poster" src="${posterUrl}" alt="${title} poster" loading="lazy">` 
                        : `<div class="movie-poster" aria-label="No poster available"></div>`
                    }
                </div>
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

        if (this.elements.pageSubtitle) {
            this.elements.pageSubtitle.textContent = subtitle;
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
        this.isLoading = false;
        this.hideAllStatus();
        if (this.elements.errorEl) {
            this.elements.errorEl.querySelector('.status-text').textContent = message;
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

    preloadCriticalResources() {
        // Preload common movie poster sizes
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = 'https://image.tmdb.org';
        document.head.appendChild(link);
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

// Handle service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}