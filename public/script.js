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
            // Header
            searchBtn: document.getElementById('search-btn'),
            searchOverlay: document.getElementById('search-overlay'),
            searchInput: document.getElementById('search-input'),
            searchClose: document.getElementById('search-close'),

            // Hero
            heroBackground: document.getElementById('hero-background'),
            heroTitle: document.getElementById('hero-title'),
            heroDescription: document.getElementById('hero-description'),
            heroPlayBtn: document.getElementById('hero-play-btn'),
            heroInfoBtn: document.getElementById('hero-info-btn'),

            // Content rows
            localMoviesSection: document.getElementById('local-movies-section'),
            localMoviesRow: document.getElementById('local-movies-row'),
            featuredRow: document.getElementById('featured-row'),
            moviesRow: document.getElementById('movies-row'),

            // Search results
            searchResultsSection: document.getElementById('search-results-section'),
            searchResultsTitle: document.getElementById('search-results-title'),
            searchResultsGrid: document.getElementById('search-results-grid'),

            // Navigation
            navItems: document.querySelectorAll('.nav-item')
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLocalMovies();
        this.loadInitialContent();
        this.handleUrlParams();
    }

    async loadLocalMovies() {
        try {
            const response = await fetch('/data/movies.json');
            this.localMovies = await response.json();
            console.log(`ðŸ“± Loaded ${this.localMovies.length} local movies`);
        } catch (error) {
            console.log('No local movies.json found, using TMDb only');
            this.localMovies = [];
            // Hide local movies section if no data
            this.elements.localMoviesSection?.classList.add('hidden');
        }
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

        // Search overlay background tap
        this.elements.searchOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.searchOverlay) {
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

        // Movie card clicks (event delegation) - CORRECTED
        document.addEventListener('click', (e) => {
            const movieCard = e.target.closest('.movie-card');
            if (movieCard && movieCard.dataset) {
                e.preventDefault();

                // Check if it's a local movie or TMDb movie
                if (movieCard.dataset.localId) {
                    window.location.href = `movie.html?localId=${encodeURIComponent(movieCard.dataset.localId)}`;
                } else if (movieCard.dataset.id) {
                    window.location.href = `movie.html?id=${encodeURIComponent(movieCard.dataset.id)}`;
                }
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
            // Search local movies first
            const localResults = this.searchLocalMovies(query);

            // Search TMDb
            const tmdbData = await this.fetchFromAPI('search/movie', {
                query: query,
                page: 1,
                include_adult: false,
                language: 'en-US'
            });

            // Combine and render results
            const combinedResults = [...localResults, ...(tmdbData.results || [])];
            this.renderSearchResults(combinedResults);

        } catch (error) {
            console.error('Search error:', error);
            this.renderSearchResults([]);
        }
    }

    searchLocalMovies(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.localMovies.filter(movie => 
            movie.movie && movie.movie.toLowerCase().includes(lowercaseQuery)
        );
    }

    // Content Loading Functions
    async loadInitialContent() {
        try {
            await Promise.all([
                this.loadHeroContent(),
                this.loadLocalMoviesContent(),
                this.loadFeaturedContent(),
                this.loadMoviesContent()
            ]);
        } catch (error) {
            console.error('Loading error:', error);
        }
    }

    async loadHeroContent() {
        try {
            if (this.localMovies.length > 0) {
                // Use first local movie as hero if available
                const enrichedMovie = await this.enrichWithTMDb(this.localMovies[0]);
                this.renderHeroMovie(enrichedMovie, true);
            } else {
                // Use TMDb movie as hero
                const data = await this.fetchFromAPI('movie/now_playing', { page: 1 });
                const movies = data.results || [];
                if (movies.length > 0) {
                    this.renderHeroMovie(movies[0], false);
                }
            }
        } catch (error) {
            console.error('Hero content error:', error);
        }
    }

    async loadLocalMoviesContent() {
        if (this.localMovies.length > 0) {
            try {
                // Enrich local movies with TMDb data
                const enrichedMovies = await Promise.all(
                    this.localMovies.map(movie => this.enrichWithTMDb(movie))
                );
                this.renderContentRow(this.elements.localMoviesRow, enrichedMovies, true);
            } catch (error) {
                console.error('Local movies enrichment error:', error);
                this.renderContentRow(this.elements.localMoviesRow, this.localMovies, true);
            }
        }
    }

    async loadFeaturedContent() {
        try {
            const data = await this.fetchFromAPI('movie/popular', { page: 1 });
            this.renderContentRow(this.elements.featuredRow, data.results || [], false);
        } catch (error) {
            console.error('Featured content error:', error);
            this.renderContentRow(this.elements.featuredRow, []);
        }
    }

    async loadMoviesContent() {
        try {
            const data = await this.fetchFromAPI('movie/top_rated', { page: 1 });
            this.renderContentRow(this.elements.moviesRow, data.results || [], false);
        } catch (error) {
            console.error('Movies content error:', error);
            this.renderContentRow(this.elements.moviesRow, []);
        }
    }

    // TMDb Enrichment Function
    async enrichWithTMDb(minItem) {
        if (!minItem.id) return minItem;

        try {
            const [details, credits] = await Promise.all([
                this.fetchFromAPI(`movie/${minItem.id}`),
                this.fetchFromAPI(`movie/${minItem.id}/credits`)
            ]);

            return {
                ...minItem,
                title: details.title || minItem.movie,
                year: details.release_date ? new Date(details.release_date).getFullYear() : undefined,
                language: details.original_language?.toUpperCase(),
                rating: typeof details.vote_average === 'number' ? details.vote_average.toFixed(1) : undefined,
                runtime: details.runtime,
                poster: details.poster_path ? `${this.IMG_BASE}${details.poster_path}` : undefined,
                backdrop: details.backdrop_path ? `${this.BACKDROP_BASE}${details.backdrop_path}` : undefined,
                overview: details.overview,
                genres: (details.genres || []).map(g => g.name),
                cast: (credits.cast || []).slice(0, 5).map(p => p.name),
                director: (credits.crew || []).find(p => p.job === 'Director')?.name
            };
        } catch (e) {
            console.log('TMDb enrichment failed for', minItem.movie || minItem.id, e);
            return minItem;
        }
    }

    // Rendering Functions
    renderHeroMovie(movie, isLocal) {
        if (!movie) return;

        // Update hero background
        const backdropUrl = isLocal ? 
            (movie.backdrop || (movie.backdrop_path ? `${this.BACKDROP_BASE}${movie.backdrop_path}` : null)) :
            (movie.backdrop_path ? `${this.BACKDROP_BASE}${movie.backdrop_path}` : null);

        if (backdropUrl && this.elements.heroBackground) {
            this.elements.heroBackground.style.backgroundImage = `url(${backdropUrl})`;
        }

        // Update hero content
        if (this.elements.heroTitle) {
            this.elements.heroTitle.textContent = movie.title || movie.movie || 'Featured Movie';
        }
        if (this.elements.heroDescription) {
            const overview = isLocal ? 
                (movie.overview || `${movie.year || ''} â€¢ ${movie.language || ''} â€¢ â˜… ${movie.rating || 'N/A'}`) :
                movie.overview || 'Discover amazing movies and shows.';
            this.elements.heroDescription.textContent = overview.substring(0, 200) + '...';
        }

        // Store movie data for hero actions
        if (this.elements.heroPlayBtn) {
            if (isLocal) {
                this.elements.heroPlayBtn.dataset.localId = movie.id;
            } else {
                this.elements.heroPlayBtn.dataset.movieId = movie.id;
            }
        }
        if (this.elements.heroInfoBtn) {
            if (isLocal) {
                this.elements.heroInfoBtn.dataset.localId = movie.id;
            } else {
                this.elements.heroInfoBtn.dataset.movieId = movie.id;
            }
        }
    }

    renderContentRow(container, movies, isLocal) {
        if (!container) return;

        if (!movies || movies.length === 0) {
            container.innerHTML = '<div class="loading-placeholder"><span>No content available</span></div>';
            return;
        }

        const moviesHTML = movies.map(movie => this.createMovieCard(movie, isLocal)).join('');
        container.innerHTML = moviesHTML;
    }

    renderSearchResults(movies) {
        if (!this.elements.searchResultsGrid) return;

        if (!movies || movies.length === 0) {
            this.elements.searchResultsGrid.innerHTML = 
                '<div class="loading-placeholder"><span>No results found</span></div>';
            return;
        }

        // Separate local and TMDb results
        const localResults = movies.filter(m => this.localMovies.find(local => local.id === m.id));
        const tmdbResults = movies.filter(m => !this.localMovies.find(local => local.id === m.id));

        const localHTML = localResults.map(movie => this.createMovieCard(movie, true)).join('');
        const tmdbHTML = tmdbResults.map(movie => this.createMovieCard(movie, false)).join('');

        this.elements.searchResultsGrid.innerHTML = localHTML + tmdbHTML;

        // Update search results title
        if (this.elements.searchResultsTitle) {
            this.elements.searchResultsTitle.textContent = 
                `Search results for "${this.currentQuery}"`;
        }
    }

    createMovieCard(movie, isLocal) {
        const posterUrl = isLocal ? 
            (movie.poster || (movie.poster_path ? `${this.IMG_BASE}${movie.poster_path}` : null)) :
            (movie.poster_path ? `${this.IMG_BASE}${movie.poster_path}` : null);

        const title = this.escapeHtml(movie.title || movie.movie || 'Untitled');
        const year = isLocal ? 
            (movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : '')) :
            (movie.release_date ? new Date(movie.release_date).getFullYear() : '');

        // CORRECTED: Use proper data attributes for navigation
        const dataAttribute = isLocal ? 
            `data-local-id="${movie.id}"` : 
            `data-id="${movie.id}"`;

        return `
            <div class="movie-card" ${dataAttribute} role="button" tabindex="0">
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
    playFeaturedMovie() {
        const localId = this.elements.heroPlayBtn?.dataset.localId;
        const movieId = this.elements.heroPlayBtn?.dataset.movieId;

        if (localId) {
            window.location.href = `watch.html?localId=${encodeURIComponent(localId)}`;
        } else if (movieId) {
            window.location.href = `watch.html?id=${encodeURIComponent(movieId)}`;
        }
    }

    showFeaturedMovieInfo() {
        const localId = this.elements.heroInfoBtn?.dataset.localId;
        const movieId = this.elements.heroInfoBtn?.dataset.movieId;

        if (localId) {
            window.location.href = `movie.html?localId=${encodeURIComponent(localId)}`;
        } else if (movieId) {
            window.location.href = `movie.html?id=${encodeURIComponent(movieId)}`;
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
            default:
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
