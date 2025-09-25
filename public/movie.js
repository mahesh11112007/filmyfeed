/**
 * FilmyFeed Mobile App - Netflix-style Movie Details Page
 * Features: Hero backdrop, trailer modal, cast/crew, similar movies
 */

class MovieDetailsApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
        this.movieId = null;
        this.movieData = null;
        this.creditsData = null;

        // DOM elements
        this.elements = {
            // Navigation
            backBtn: document.getElementById('back-btn'),
            searchBtn: document.getElementById('search-btn'),
            shareBtn: document.getElementById('share-btn'),

            // Loading/Error states
            movieLoading: document.getElementById('movie-loading'),
            movieError: document.getElementById('movie-error'),
            movieContent: document.getElementById('movie-content'),

            // Hero section
            movieBackdrop: document.getElementById('movie-backdrop'),
            moviePoster: document.getElementById('movie-poster'),
            movieTitle: document.getElementById('movie-title'),
            movieMeta: document.getElementById('movie-meta'),
            movieGenres: document.getElementById('movie-genres'),
            heroPlayBtn: document.getElementById('hero-play-btn'),

            // Action buttons
            playBtn: document.getElementById('play-btn'),
            trailerBtn: document.getElementById('trailer-btn'),
            addListBtn: document.getElementById('add-list-btn'),
            likeBtn: document.getElementById('like-btn'),

            // Details
            movieOverview: document.getElementById('movie-overview'),
            movieDirector: document.getElementById('movie-director'),
            movieCast: document.getElementById('movie-cast'),
            movieRelease: document.getElementById('movie-release'),
            movieRuntime: document.getElementById('movie-runtime'),
            movieLanguage: document.getElementById('movie-language'),
            movieRating: document.getElementById('movie-rating'),

            // Related movies
            relatedMovies: document.getElementById('related-movies'),

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
        this.extractMovieId();
        if (this.movieId) {
            this.loadMovieDetails();
        } else {
            this.showError('Movie ID not found');
        }
    }

    setupEventListeners() {
        // Navigation
        this.elements.backBtn?.addEventListener('click', () => {
            this.goBack();
        });

        this.elements.searchBtn?.addEventListener('click', () => {
            window.location.href = '/?search=true';
        });

        this.elements.shareBtn?.addEventListener('click', () => {
            this.shareMovie();
        });

        // Action buttons
        this.elements.playBtn?.addEventListener('click', () => {
            this.playMovie();
        });

        this.elements.heroPlayBtn?.addEventListener('click', () => {
            this.playMovie();
        });

        this.elements.trailerBtn?.addEventListener('click', () => {
            this.playTrailer();
        });

        this.elements.addListBtn?.addEventListener('click', () => {
            this.toggleMyList();
        });

        this.elements.likeBtn?.addEventListener('click', () => {
            this.toggleLike();
        });

        // Trailer modal
        this.elements.trailerClose?.addEventListener('click', () => {
            this.closeTrailer();
        });

        this.elements.trailerModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.trailerModal) {
                this.closeTrailer();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.elements.trailerModal.classList.contains('hidden')) {
                    this.closeTrailer();
                }
            }
        });

        // Error retry
        this.elements.movieError?.addEventListener('click', () => {
            if (this.movieId) {
                this.loadMovieDetails();
            }
        });

        // Related movies clicks
        document.addEventListener('click', (e) => {
            const relatedCard = e.target.closest('.related-card');
            if (relatedCard && relatedCard.dataset.id) {
                window.location.href = `/movie.html?id=${encodeURIComponent(relatedCard.dataset.id)}`;
            }
        });
    }

    extractMovieId() {
        const urlParams = new URLSearchParams(window.location.search);
        this.movieId = urlParams.get('id');
    }

    async loadMovieDetails() {
        this.showLoading();

        try {
            // Load movie details and credits in parallel
            const [movieResponse, creditsResponse, similarResponse] = await Promise.all([
                this.fetchFromAPI(`movie/${this.movieId}`),
                this.fetchFromAPI(`movie/${this.movieId}/credits`),
                this.fetchFromAPI(`movie/${this.movieId}/similar`, { page: 1 })
            ]);

            this.movieData = movieResponse;
            this.creditsData = creditsResponse;

            this.renderMovieDetails();
            this.renderSimilarMovies(similarResponse.results || []);
            this.updatePageTitle();
            this.showContent();

        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details. Tap to retry.');
        }
    }

    renderMovieDetails() {
        if (!this.movieData) return;

        // Hero backdrop
        if (this.movieData.backdrop_path && this.elements.movieBackdrop) {
            this.elements.movieBackdrop.style.backgroundImage = 
                `url(${this.BACKDROP_BASE}${this.movieData.backdrop_path})`;
        }

        // Movie poster
        if (this.movieData.poster_path && this.elements.moviePoster) {
            this.elements.moviePoster.src = `${this.IMG_BASE}${this.movieData.poster_path}`;
            this.elements.moviePoster.alt = `${this.movieData.title} poster`;
        }

        // Basic info
        if (this.elements.movieTitle) {
            this.elements.movieTitle.textContent = this.movieData.title || 'Untitled';
        }

        // Meta information
        this.renderMovieMeta();

        // Genres
        this.renderGenres();

        // Overview
        if (this.elements.movieOverview) {
            this.elements.movieOverview.textContent = 
                this.movieData.overview || 'No overview available.';
        }

        // Movie details
        this.renderMovieInfo();

        // Cast & Crew
        this.renderCastCrew();
    }

    renderMovieMeta() {
        if (!this.elements.movieMeta) return;

        const year = this.movieData.release_date 
            ? new Date(this.movieData.release_date).getFullYear() 
            : '';

        const rating = typeof this.movieData.vote_average === 'number' 
            ? this.movieData.vote_average.toFixed(1) 
            : 'N/A';

        const language = (this.movieData.original_language || '').toUpperCase();

        const metaParts = [];
        if (year) metaParts.push(year);
        if (language) metaParts.push(language);
        metaParts.push(`â˜… ${rating}`);

        this.elements.movieMeta.textContent = metaParts.join(' â€¢ ');
    }

    renderGenres() {
        if (!this.elements.movieGenres || !this.movieData.genres) return;

        const genresHTML = this.movieData.genres
            .slice(0, 3) // Limit to 3 genres for mobile
            .map(genre => `<span class="genre-tag">${this.escapeHtml(genre.name)}</span>`)
            .join('');

        this.elements.movieGenres.innerHTML = genresHTML;
    }

    renderMovieInfo() {
        // Release date
        if (this.elements.movieRelease) {
            this.elements.movieRelease.textContent = 
                this.formatDate(this.movieData.release_date);
        }

        // Runtime
        if (this.elements.movieRuntime) {
            this.elements.movieRuntime.textContent = 
                this.formatRuntime(this.movieData.runtime);
        }

        // Language
        if (this.elements.movieLanguage) {
            const language = this.movieData.spoken_languages?.[0]?.english_name || 
                           (this.movieData.original_language || '').toUpperCase() || 
                           'Unknown';
            this.elements.movieLanguage.textContent = language;
        }

        // Rating
        if (this.elements.movieRating) {
            const rating = typeof this.movieData.vote_average === 'number' 
                ? `${this.movieData.vote_average.toFixed(1)}/10` 
                : 'N/A';
            this.elements.movieRating.textContent = rating;
        }
    }

    renderCastCrew() {
        if (!this.creditsData) return;

        // Director
        if (this.elements.movieDirector) {
            const director = this.creditsData.crew?.find(person => person.job === 'Director');
            this.elements.movieDirector.textContent = director ? director.name : 'Not available';
        }

        // Cast (top 5)
        if (this.elements.movieCast) {
            const topCast = this.creditsData.cast?.slice(0, 5) || [];
            const castNames = topCast.map(person => person.name).join(', ');
            this.elements.movieCast.textContent = castNames || 'Not available';
        }
    }

    renderSimilarMovies(movies) {
        if (!this.elements.relatedMovies) return;

        if (!movies || movies.length === 0) {
            this.elements.relatedMovies.innerHTML = 
                '<div class="loading-placeholder"><span>No similar movies found</span></div>';
            return;
        }

        const moviesHTML = movies.slice(0, 6).map(movie => this.createRelatedCard(movie)).join('');
        this.elements.relatedMovies.innerHTML = moviesHTML;
    }

    createRelatedCard(movie) {
        const posterUrl = movie.poster_path 
            ? `${this.IMG_BASE}${movie.poster_path}` 
            : null;

        const title = this.escapeHtml(movie.title || 'Untitled');
        const year = movie.release_date 
            ? new Date(movie.release_date).getFullYear() 
            : '';

        return `
            <div class="related-card movie-card" data-id="${movie.id}" role="button" tabindex="0">
                ${posterUrl 
                    ? `<img class="card-poster" src="${posterUrl}" alt="${title}" loading="lazy">` 
                    : '<div class="card-poster" style="background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem;">No Image</div>'
                }
                <div class="card-info">
                    <div class="card-title">${title}</div>
                    ${year ? `<div class="card-year">${year}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Action Functions
    playMovie() {
        // Placeholder for play functionality
        this.showNotification('Play functionality coming soon!');
    }

    async playTrailer() {
        try {
            this.elements.trailerTitle.textContent = 'Loading trailer...';
            this.elements.trailerModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            const trailerKey = await this.fetchTrailerKey();

            if (trailerKey) {
                this.openTrailer(trailerKey);
            } else {
                this.closeTrailer();
                this.showNotification('No trailer available for this movie');
            }
        } catch (error) {
            console.error('Error loading trailer:', error);
            this.closeTrailer();
            this.showNotification('Failed to load trailer');
        }
    }

    async fetchTrailerKey() {
        try {
            const response = await this.fetchFromAPI(`movie/${this.movieId}/videos`);
            const videos = response.results || [];

            // Sort by preference: Official trailers first
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

    openTrailer(youtubeKey) {
        const movieTitle = this.movieData?.title || 'Movie';
        this.elements.trailerTitle.textContent = `${movieTitle} - Trailer`;
        this.elements.trailerIframe.src = 
            `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        this.elements.trailerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeTrailer() {
        this.elements.trailerIframe.src = '';
        this.elements.trailerModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    toggleMyList() {
        const isAdded = this.elements.addListBtn.classList.toggle('added');
        const svg = this.elements.addListBtn.querySelector('svg path');

        if (isAdded) {
            svg.setAttribute('d', 'M5 13l4 4L19 7'); // Checkmark
            this.showNotification('Added to My List');
        } else {
            svg.setAttribute('d', 'M12 5v14m-7-7h14'); // Plus
            this.showNotification('Removed from My List');
        }
    }

    toggleLike() {
        const isLiked = this.elements.likeBtn.classList.toggle('liked');
        this.showNotification(isLiked ? 'Liked!' : 'Like removed');
    }

    shareMovie() {
        if (navigator.share && this.movieData) {
            navigator.share({
                title: this.movieData.title,
                text: `Check out ${this.movieData.title} on FilmyFeed!`,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Link copied to clipboard!');
            }).catch(() => {
                this.showNotification('Share feature not supported');
            });
        }
    }

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    }

    // UI State Functions
    showLoading() {
        this.elements.movieLoading?.classList.remove('hidden');
        this.elements.movieError?.classList.add('hidden');
        this.elements.movieContent?.classList.add('hidden');
    }

    showError(message) {
        const span = this.elements.movieError?.querySelector('span');
        if (span) span.textContent = message;

        this.elements.movieLoading?.classList.add('hidden');
        this.elements.movieError?.classList.remove('hidden');
        this.elements.movieContent?.classList.add('hidden');
    }

    showContent() {
        this.elements.movieLoading?.classList.add('hidden');
        this.elements.movieError?.classList.add('hidden');
        this.elements.movieContent?.classList.remove('hidden');
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

    updatePageTitle() {
        const title = this.movieData?.title || 'Movie';
        document.title = `${title} - FilmyFeed`;
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
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize movie details app
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸŽ¬ FilmyFeed Movie Details initialized');
    window.movieDetailsApp = new MovieDetailsApp();
}); 