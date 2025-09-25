/**
 * FilmyFeed Mobile - Movie Details with YouTube Trailers
 * Mobile-optimized movie information, trailer playback, touch interactions
 */

class MovieDetailsMobile {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
        this.movieId = null;
        this.movieData = null;
        this.creditsData = null;
        this.searchActive = false;

        // DOM elements
        this.elements = {
            // Status elements
            loadingEl: document.getElementById('movie-loading'),
            errorEl: document.getElementById('movie-error'),
            movieDetail: document.getElementById('movie-detail'),

            // Hero section
            heroBackdrop: document.getElementById('hero-backdrop'),
            moviePoster: document.getElementById('movie-poster'),
            movieTitle: document.getElementById('movie-title'),
            movieMeta: document.getElementById('movie-meta'),
            movieGenres: document.getElementById('movie-genres'),
            movieRating: document.getElementById('movie-rating'),
            watchTrailerBtn: document.getElementById('watch-trailer-btn'),
            addWatchlistBtn: document.getElementById('add-watchlist-btn'),

            // Details sections
            movieOverview: document.getElementById('movie-overview'),
            movieStatus: document.getElementById('movie-status'),
            movieRelease: document.getElementById('movie-release'),
            movieRuntime: document.getElementById('movie-runtime'),
            movieLanguage: document.getElementById('movie-language'),
            movieBudget: document.getElementById('movie-budget'),
            movieRevenue: document.getElementById('movie-revenue'),
            movieCast: document.getElementById('movie-cast'),
            movieDirector: document.getElementById('movie-director'),

            // Search elements
            searchToggle: document.getElementById('search-toggle'),
            searchWrapper: document.getElementById('search-wrapper'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchClose: document.getElementById('search-close'),

            // Trailer modal
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
        this.extractMovieId();
        this.loadMovieDetails();
    }

    setupEventListeners() {
        // Search toggle
        this.elements.searchToggle?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSearch();
        });

        this.elements.searchClose?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeSearch();
        });

        // Search functionality
        this.elements.searchBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        this.elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch();
            }
        });

        // Watch trailer button
        this.elements.watchTrailerBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.playTrailer();
        });

        // Add to watchlist button (placeholder)
        this.elements.addWatchlistBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleWatchlist();
        });

        // Error retry
        this.elements.errorEl?.addEventListener('click', () => {
            this.loadMovieDetails();
        });

        // Close search on outside click
        document.addEventListener('click', (e) => {
            if (this.searchActive && 
                !e.target.closest('.search-wrapper') && 
                !e.target.closest('.search-toggle')) {
                this.closeSearch();
            }
        });

        // Keyboard handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.searchActive) {
                    this.closeSearch();
                } else if (!this.elements.trailerModal.classList.contains('hidden')) {
                    this.closeTrailer();
                }
            }
        });

        // Trailer modal events
        this.elements.trailerClose?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeTrailer();
        });

        this.elements.trailerModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.trailerModal) {
                this.closeTrailer();
            }
        });
    }

    setupTouchOptimizations() {
        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('button, .back-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.98)';
                button.style.transition = 'transform 0.1s ease';
            });

            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.transition = '';
                }, 150);
            });
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

        setTimeout(() => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
            }
        }, 300);
    }

    closeSearch() {
        this.searchActive = false;
        this.elements.searchWrapper?.classList.remove('active');

        if (this.elements.searchInput) {
            this.elements.searchInput.blur();
        }
    }

    handleSearch() {
        const query = this.elements.searchInput?.value.trim();

        if (!query) {
            window.location.href = '/';
            return;
        }

        window.location.href = `/?q=${encodeURIComponent(query)}`;
    }

    extractMovieId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.movieId = urlParams.get('id');

        if (!this.movieId) {
            this.showError('Movie ID not found. Go back to home.');
            return false;
        }

        return true;
    }

    async loadMovieDetails() {
        if (!this.movieId) {
            this.showError('Invalid movie ID');
            return;
        }

        this.showLoading();

        try {
            // Fetch movie details and credits
            const [movieResponse, creditsResponse] = await Promise.all([
                this.fetchFromAPI(`movie/${this.movieId}`, { language: 'en-US' }),
                this.fetchFromAPI(`movie/${this.movieId}/credits`, { language: 'en-US' })
            ]);

            this.movieData = movieResponse;
            this.creditsData = creditsResponse;

            this.renderMovieDetails();
            this.updatePageTitle();
            this.showDetails();

        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details. Tap to retry.');
        }
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

    renderMovieDetails() {
        this.renderHeroSection();
        this.renderOverview();
        this.renderMovieInfo();
        this.renderCast();
        this.renderCrew();
    }

    renderHeroSection() {
        // Backdrop
        if (this.movieData.backdrop_path && this.elements.heroBackdrop) {
            this.elements.heroBackdrop.style.backgroundImage = 
                `linear-gradient(rgba(11, 16, 32, 0.7), rgba(11, 16, 32, 0.9)), url(${this.BACKDROP_BASE}${this.movieData.backdrop_path})`;
            this.elements.heroBackdrop.style.backgroundSize = 'cover';
            this.elements.heroBackdrop.style.backgroundPosition = 'center';
        }

        // Poster
        if (this.movieData.poster_path && this.elements.moviePoster) {
            this.elements.moviePoster.src = `${this.IMG_BASE}${this.movieData.poster_path}`;
            this.elements.moviePoster.alt = `${this.movieData.title} poster`;
        }

        // Title
        if (this.elements.movieTitle) {
            const year = this.movieData.release_date 
                ? new Date(this.movieData.release_date).getFullYear()
                : '';
            this.elements.movieTitle.textContent = 
                `${this.movieData.title || 'Untitled'}${year ? ` (${year})` : ''}`;
        }

        // Meta information
        if (this.elements.movieMeta) {
            const language = (this.movieData.original_language || '').toUpperCase();
            const voteCount = this.movieData.vote_count || 0;
            this.elements.movieMeta.textContent = 
                `${language} â€¢ ${voteCount.toLocaleString()} votes`;
        }

        // Genres
        if (this.elements.movieGenres && this.movieData.genres) {
            const genresHTML = this.movieData.genres
                .slice(0, 3)
                .map(genre => `<span class="genre-tag">${this.escapeHtml(genre.name)}</span>`)
                .join('');
            this.elements.movieGenres.innerHTML = genresHTML;
        }

        // Rating
        if (this.elements.movieRating) {
            const rating = typeof this.movieData.vote_average === 'number' 
                ? this.movieData.vote_average.toFixed(1) 
                : 'N/A';
            this.elements.movieRating.textContent = rating;
        }
    }

    renderOverview() {
        if (this.elements.movieOverview) {
            const overview = this.movieData.overview || 'No overview available for this movie.';
            this.elements.movieOverview.textContent = overview;
        }
    }

    renderMovieInfo() {
        const info = {
            status: this.movieData.status || 'Unknown',
            release: this.formatDate(this.movieData.release_date),
            runtime: this.formatRuntime(this.movieData.runtime),
            language: (this.movieData.original_language || '').toUpperCase() || 'Unknown',
            budget: this.formatCurrency(this.movieData.budget),
            revenue: this.formatCurrency(this.movieData.revenue)
        };

        Object.entries(info).forEach(([key, value]) => {
            const element = this.elements[`movie${key.charAt(0).toUpperCase() + key.slice(1)}`];
            if (element) {
                element.textContent = value;
            }
        });
    }

    renderCast() {
        if (!this.elements.movieCast || !this.creditsData?.cast) return;

        const topCast = this.creditsData.cast.slice(0, 6);
        const castHTML = topCast
            .map(person => `
                <div class="cast-item">
                    <div class="cast-name">${this.escapeHtml(person.name)}</div>
                    <div class="cast-character">${this.escapeHtml(person.character || 'Unknown role')}</div>
                </div>
            `)
            .join('');

        this.elements.movieCast.innerHTML = castHTML;
    }

    renderCrew() {
        if (!this.elements.movieDirector) return;

        const director = this.creditsData?.crew?.find(person => person.job === 'Director');
        this.elements.movieDirector.textContent = director ? director.name : 'Not available';
    }

    async playTrailer() {
        if (!this.movieId || !this.movieData) return;

        try {
            this.elements.trailerTitle.textContent = 'Loading trailer...';
            this.elements.trailerModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            const trailerKey = await this.fetchTrailerKey(this.movieId);

            if (trailerKey) {
                this.openTrailer(trailerKey, this.movieData.title);
            } else {
                this.closeTrailer();
                this.showNotification('Trailer not available for this movie');
            }
        } catch (error) {
            console.error('Error loading trailer:', error);
            this.closeTrailer();
            this.showNotification('Failed to load trailer');
        }
    }

    async fetchTrailerKey(movieId) {
        try {
            const response = await this.fetchFromAPI(`movie/${movieId}/videos`);
            const videos = response?.results || [];

            const sortedVideos = videos.sort((a, b) => {
                if (a.official !== b.official) return b.official - a.official;
                if (a.type !== b.type) {
                    if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
                    if (b.type === 'Trailer' && a.type !== 'Trailer') return 1;
                }
                return 0;
            });

            const youtubeVideo = sortedVideos.find(video => 
                video.site === 'YouTube' && 
                (video.type === 'Trailer' || video.type === 'Teaser')
            );

            return youtubeVideo?.key || null;
        } catch (error) {
            console.error('Error fetching trailer:', error);
            return null;
        }
    }

    openTrailer(youtubeKey, movieTitle) {
        this.elements.trailerTitle.textContent = `${movieTitle} - Trailer`;
        this.elements.trailerIframe.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        this.elements.trailerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeTrailer() {
        this.elements.trailerIframe.src = '';
        this.elements.trailerModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    toggleWatchlist() {
        const isAdded = this.elements.addWatchlistBtn.classList.toggle('added');
        const icon = this.elements.addWatchlistBtn.querySelector('.btn-icon');
        const text = this.elements.addWatchlistBtn.querySelector('span:last-child');

        if (isAdded) {
            icon.textContent = 'âœ“';
            text.textContent = 'Added';
            this.showNotification('Added to watchlist');
        } else {
            icon.textContent = 'âž•';
            text.textContent = 'Watchlist';
            this.showNotification('Removed from watchlist');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Not available';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    formatRuntime(minutes) {
        if (!minutes || minutes <= 0) return 'Not available';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    formatCurrency(amount) {
        if (!amount || amount <= 0) return 'Not disclosed';
        if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    }

    updatePageTitle() {
        const title = this.movieData?.title || 'Movie';
        document.title = `${title} - FilmyFeed Mobile`;
    }

    showLoading() {
        this.hideAllStatus();
        this.elements.loadingEl?.classList.remove('hidden');
    }

    showError(message) {
        this.hideAllStatus();
        if (this.elements.errorEl) {
            const textEl = this.elements.errorEl.querySelector('.status-text');
            if (textEl) textEl.textContent = message;
            this.elements.errorEl.classList.remove('hidden');
        }
    }

    showDetails() {
        this.hideAllStatus();
        this.elements.movieDetail?.classList.remove('hidden');
    }

    hideAllStatus() {
        this.elements.loadingEl?.classList.add('hidden');
        this.elements.errorEl?.classList.add('hidden');
        this.elements.movieDetail?.classList.add('hidden');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.9); color: white; padding: 12px 20px;
            border-radius: 8px; z-index: 3000; font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize movie details app
document.addEventListener('DOMContentLoaded', () => {
    window.movieDetailsMobile = new MovieDetailsMobile();
});