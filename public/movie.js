/**
 * FilmyFeed Professional - Movie Details Controller
 * Handles individual movie information display
 */

class MovieDetailsApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
        this.movieId = null;
        this.movieData = null;
        this.creditsData = null;

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
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchForm: document.querySelector('.search-form')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.extractMovieId();
        this.loadMovieDetails();
    }

    setupEventListeners() {
        // Search functionality
        this.elements.searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        this.elements.searchBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Error retry
        this.elements.errorEl?.addEventListener('click', () => {
            this.loadMovieDetails();
        });
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
            this.hideLoading();

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

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
            }
        });

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
        this.showDetails();
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
        const metaText = `Original Language: ${language || 'Unknown'} â€¢ ${voteCount.toLocaleString()} votes`;

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

    handleSearch() {
        const query = this.elements.searchInput?.value.trim();

        if (!query) {
            window.location.href = '/';
            return;
        }

        window.location.href = `/?q=${encodeURIComponent(query)}`;
    }

    showLoading() {
        this.hideAllStatus();
        this.elements.loadingEl?.classList.remove('hidden');
    }

    hideLoading() {
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