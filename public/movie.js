/**
 * FilmyFeed Professional - Movie Details with YouTube Trailers
 * Features: Complete movie information, trailer playback, collapsible search
 */

class MovieDetailsApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.movieId = null;
        this.movieData = null;
        this.creditsData = null;
        this.searchActive = false;

        // DOM elements
        this.elements = {
            // Status elements
            loadingEl: document.getElementById('detail-loading'),
            errorEl: document.getElementById('detail-error'),
            movieDetail: document.getElementById('movie-detail'),

            // Movie info elements
            poster: document.getElementById('detail-poster'),
            title: document.getElementById('detail-title'),
            meta: document.getElementById('detail-meta'),
            genres: document.getElementById('detail-genres'),
            tagline: document.getElementById('detail-tagline'),
            rating: document.getElementById('detail-rating'),
            ratingBadge: document.getElementById('detail-rating-badge'),
            overview: document.getElementById('detail-overview'),
            watchTrailerBtn: document.getElementById('watch-trailer-btn'),

            // Details elements
            director: document.getElementById('detail-director'),
            cast: document.getElementById('detail-cast'),
            status: document.getElementById('detail-status'),
            release: document.getElementById('detail-release'),
            runtime: document.getElementById('detail-runtime'),
            language: document.getElementById('detail-language'),
            budget: document.getElementById('detail-budget'),
            revenue: document.getElementById('detail-revenue'),
            homepage: document.getElementById('detail-homepage'),
            homepageSection: document.getElementById('homepage-section'),

            // Search elements
            searchToggle: document.getElementById('search-toggle'),
            searchWrapper: document.getElementById('search-wrapper'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchClose: document.getElementById('search-close'),

            // Trailer modal elements
            trailerModal: document.getElementById('trailer-modal'),
            trailerClose: document.getElementById('trailer-close'),
            trailerIframe: document.getElementById('trailer-iframe'),
            trailerTitle: document.getElementById('trailer-title')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.extractMovieId();
        this.loadMovieDetails();
    }

    setupEventListeners() {
        // Search toggle functionality
        this.elements.searchToggle?.addEventListener('click', () => {
            this.toggleSearch();
        });

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

        // Watch trailer button
        this.elements.watchTrailerBtn?.addEventListener('click', () => {
            this.playTrailer();
        });

        // Error retry
        this.elements.errorEl?.addEventListener('click', () => {
            this.loadMovieDetails();
        });

        // Close search on outside click
        document.addEventListener('click', (e) => {
            if (this.searchActive && 
                !e.target.closest('.search-container') && 
                !e.target.closest('.search-toggle')) {
                this.closeSearch();
            }
        });

        // Close search/trailer on escape
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
        this.elements.trailerClose?.addEventListener('click', () => {
            this.closeTrailer();
        });

        this.elements.trailerModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.trailerModal) {
                this.closeTrailer();
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
        setTimeout(() => {
            this.elements.searchInput?.focus();
        }, 200);
    }

    closeSearch() {
        this.searchActive = false;
        this.elements.searchWrapper?.classList.remove('active');
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
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

    async playTrailer() {
        if (!this.movieId || !this.movieData) return;

        try {
            // Show loading state
            this.elements.trailerTitle.textContent = 'Loading trailer...';
            this.elements.trailerModal.classList.remove('hidden');

            // Fetch trailer
            const trailerKey = await this.fetchTrailerKey(this.movieId);

            if (trailerKey) {
                this.openTrailer(trailerKey, this.movieData.title);
            } else {
                this.closeTrailer();
                this.showTrailerError('Trailer not available for this movie');
            }
        } catch (error) {
            console.error('Error loading trailer:', error);
            this.closeTrailer();
            this.showTrailerError('Failed to load trailer');
        }
    }

    async fetchTrailerKey(movieId) {
        try {
            const response = await this.fetchFromAPI(`movie/${movieId}/videos`);
            const videos = response?.results || [];

            // Sort videos by preference: Official trailers first, then teasers
            const sortedVideos = videos.sort((a, b) => {
                // Prefer official videos
                if (a.official !== b.official) {
                    return b.official - a.official;
                }
                // Prefer trailers over teasers
                if (a.type !== b.type) {
                    if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
                    if (b.type === 'Trailer' && a.type !== 'Trailer') return 1;
                    if (a.type === 'Teaser' && b.type !== 'Teaser') return -1;
                    if (b.type === 'Teaser' && a.type !== 'Teaser') return 1;
                }
                return 0;
            });

            // Find the best YouTube video
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
        this.elements.trailerIframe.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`;
        this.elements.trailerModal.classList.remove('hidden');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeTrailer() {
        this.elements.trailerIframe.src = '';
        this.elements.trailerModal.classList.add('hidden');

        // Re-enable body scroll
        document.body.style.overflow = '';
    }

    showTrailerError(message) {
        alert(message);
    }

    extractMovieId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.movieId = urlParams.get('id');

        if (!this.movieId) {
            this.showError('Movie ID not found in URL');
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
            // Fetch movie details and credits in parallel
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
            this.showError('Failed to load movie details. Click to retry.');
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
        this.renderBasicInfo();
        this.renderGenres();
        this.renderRating();
        this.renderOverview();
        this.renderCredits();
        this.renderTechnicalInfo();
        this.renderHomepage();
    }

    renderBasicInfo() {
        // Poster
        if (this.movieData.poster_path && this.elements.poster) {
            this.elements.poster.src = `${this.IMG_BASE}${this.movieData.poster_path}`;
            this.elements.poster.alt = `${this.movieData.title} poster`;
        }

        // Title
        const year = this.movieData.release_date 
            ? new Date(this.movieData.release_date).getFullYear()
            : '';

        const titleText = `${this.movieData.title || 'Untitled'}${year ? ` (${year})` : ''}`;

        if (this.elements.title) {
            this.elements.title.textContent = titleText;
        }

        // Meta information
        const language = (this.movieData.original_language || '').toUpperCase();
        const voteCount = this.movieData.vote_count || 0;
        const metaText = `Language: ${language || 'Unknown'} â€¢ ${voteCount.toLocaleString()} votes`;

        if (this.elements.meta) {
            this.elements.meta.textContent = metaText;
        }

        // Tagline
        if (this.elements.tagline) {
            if (this.movieData.tagline) {
                this.elements.tagline.textContent = `"${this.movieData.tagline}"`;
                this.elements.tagline.style.display = 'block';
            } else {
                this.elements.tagline.style.display = 'none';
            }
        }
    }

    renderGenres() {
        if (!this.elements.genres || !this.movieData.genres) return;

        const genresHTML = this.movieData.genres
            .map(genre => `<span class="genre-badge">${this.escapeHtml(genre.name)}</span>`)
            .join('');

        this.elements.genres.innerHTML = genresHTML;
    }

    renderRating() {
        const rating = typeof this.movieData.vote_average === 'number' 
            ? this.movieData.vote_average.toFixed(1) 
            : 'N/A';

        // Main rating display
        if (this.elements.rating) {
            const stars = this.generateStars(this.movieData.vote_average);
            this.elements.rating.innerHTML = `
                <div class="rating-score">
                    <span class="rating-number">${rating}</span>
                    <span class="rating-max">/10</span>
                </div>
                <div class="rating-stars">${stars}</div>
            `;
        }

        // Rating badge on poster
        if (this.elements.ratingBadge) {
            this.elements.ratingBadge.textContent = `â˜… ${rating}`;
        }
    }

    generateStars(rating) {
        if (typeof rating !== 'number') return '';

        const fullStars = Math.floor(rating / 2);
        const hasHalfStar = (rating % 2) >= 1;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return 'â˜…'.repeat(fullStars) + 
               (hasHalfStar ? 'â˜†' : '') + 
               'â˜†'.repeat(emptyStars);
    }

    renderOverview() {
        if (this.elements.overview) {
            const overview = this.movieData.overview || 'No overview available for this movie.';
            this.elements.overview.textContent = overview;
        }
    }

    renderCredits() {
        this.renderDirector();
        this.renderCast();
    }

    renderDirector() {
        if (!this.elements.director) return;

        const director = this.creditsData?.crew?.find(person => person.job === 'Director');
        this.elements.director.textContent = director ? director.name : 'Not available';
    }

    renderCast() {
        if (!this.elements.cast || !this.creditsData?.cast) return;

        const topCast = this.creditsData.cast.slice(0, 8);
        const castHTML = topCast
            .map(person => `
                <div class="cast-item">
                    <div class="cast-name">${this.escapeHtml(person.name)}</div>
                    <div class="cast-character">${this.escapeHtml(person.character || 'Unknown role')}</div>
                </div>
            `)
            .join('');

        this.elements.cast.innerHTML = castHTML;
    }

    renderTechnicalInfo() {
        const info = {
            status: this.movieData.status || 'Unknown',
            release: this.formatDate(this.movieData.release_date),
            runtime: this.formatRuntime(this.movieData.runtime),
            language: (this.movieData.original_language || '').toUpperCase() || 'Unknown',
            budget: this.formatCurrency(this.movieData.budget),
            revenue: this.formatCurrency(this.movieData.revenue)
        };

        Object.entries(info).forEach(([key, value]) => {
            const element = this.elements[key];
            if (element) {
                element.textContent = value;
            }
        });
    }

    renderHomepage() {
        if (!this.movieData.homepage || !this.elements.homepage) {
            this.elements.homepageSection?.classList.add('hidden');
            return;
        }

        this.elements.homepage.href = this.movieData.homepage;
        this.elements.homepage.textContent = this.movieData.homepage.replace(/^https?:\/\//, '');
        this.elements.homepageSection?.classList.remove('hidden');
    }

    formatDate(dateString) {
        if (!dateString) return 'Not available';

        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
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

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    formatCurrency(amount) {
        if (!amount || amount <= 0) return 'Not disclosed';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    }

    updatePageTitle() {
        const title = this.movieData?.title || 'Movie';
        document.title = `${title} - FilmyFeed Professional`;
    }

    showLoading() {
        this.hideAllStatus();
        this.elements.loadingEl?.classList.remove('hidden');
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.movieDetailsApp = new MovieDetailsApp();
});