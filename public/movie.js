/**
 * FilmyFeed Movie Details Page
 * Supports both local JSON movies and TMDb movies
 */

class MovieDetailsApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
        this.movieId = null;
        this.localId = null;
        this.movieData = null;
        this.creditsData = null;
        this.isLocalMovie = false;
        this.localMovies = [];

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
            downloadBtn: document.getElementById('download-btn'),
            addListBtn: document.getElementById('add-list-btn'),

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

    async init() {
        this.setupEventListeners();
        this.extractParams();
        await this.loadLocalMovies();

        if (this.localId) {
            this.isLocalMovie = true;
            await this.loadLocalMovieDetails();
        } else if (this.movieId) {
            this.isLocalMovie = false;
            await this.loadTMDbMovieDetails();
        } else {
            this.showError('Movie not found');
        }
    }

    async loadLocalMovies() {
        try {
            const response = await fetch('/data/movies.json');
            this.localMovies = await response.json();
        } catch (error) {
            console.log('No local movies.json found');
            this.localMovies = [];
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

        this.elements.downloadBtn?.addEventListener('click', () => {
            this.downloadMovie();
        });

        this.elements.addListBtn?.addEventListener('click', () => {
            this.toggleMyList();
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

        // Error retry
        this.elements.movieError?.addEventListener('click', () => {
            if (this.localId) {
                this.loadLocalMovieDetails();
            } else if (this.movieId) {
                this.loadTMDbMovieDetails();
            }
        });

        // Related movies clicks
        document.addEventListener('click', (e) => {
            const relatedCard = e.target.closest('.related-card');
            if (relatedCard) {
                const localId = relatedCard.dataset.localId;
                const tmdbId = relatedCard.dataset.id;

                if (localId) {
                    window.location.href = `/movie.html?localId=${encodeURIComponent(localId)}`;
                } else if (tmdbId) {
                    window.location.href = `/movie.html?id=${encodeURIComponent(tmdbId)}`;
                }
            }
        });
    }

    extractParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.localId = urlParams.get('localId');
        this.movieId = urlParams.get('id');
    }

    async loadLocalMovieDetails() {
        this.showLoading();

        try {
            const movie = this.localMovies.find(m => m.id === this.localId);
            if (!movie) {
                throw new Error('Local movie not found');
            }

            this.movieData = movie;
            this.renderLocalMovieDetails();
            this.updatePageTitle();
            this.showContent();

        } catch (error) {
            console.error('Error loading local movie:', error);
            this.showError('Failed to load movie details. Tap to retry.');
        }
    }

    async loadTMDbMovieDetails() {
        this.showLoading();

        try {
            const [movieResponse, creditsResponse, similarResponse] = await Promise.all([
                this.fetchFromAPI(`movie/${this.movieId}`),
                this.fetchFromAPI(`movie/${this.movieId}/credits`),
                this.fetchFromAPI(`movie/${this.movieId}/similar`, { page: 1 })
            ]);

            this.movieData = movieResponse;
            this.creditsData = creditsResponse;

            this.renderTMDbMovieDetails();
            this.renderSimilarMovies(similarResponse.results || []);
            this.updatePageTitle();
            this.showContent();

        } catch (error) {
            console.error('Error loading TMDb movie:', error);
            this.showError('Failed to load movie details. Tap to retry.');
        }
    }

    renderLocalMovieDetails() {
        if (!this.movieData) return;

        // Hero backdrop
        if (this.movieData.backdrop && this.elements.movieBackdrop) {
            this.elements.movieBackdrop.style.backgroundImage = `url(${this.movieData.backdrop})`;
        }

        // Movie poster
        if (this.movieData.poster && this.elements.moviePoster) {
            this.elements.moviePoster.src = this.movieData.poster;
            this.elements.moviePoster.alt = `${this.movieData.title} poster`;
        }

        // Basic info
        if (this.elements.movieTitle) {
            this.elements.movieTitle.textContent = this.movieData.title || 'Untitled';
        }

        // Meta information
        if (this.elements.movieMeta) {
            const metaParts = [];
            if (this.movieData.year) metaParts.push(this.movieData.year);
            if (this.movieData.language) metaParts.push(this.movieData.language.toUpperCase());
            if (this.movieData.rating) metaParts.push(`â˜… ${this.movieData.rating}`);
            this.elements.movieMeta.textContent = metaParts.join(' â€¢ ');
        }

        // Genres
        if (this.elements.movieGenres && this.movieData.genres) {
            const genresHTML = this.movieData.genres
                .slice(0, 3)
                .map(genre => `<span class="genre-tag">${this.escapeHtml(genre)}</span>`)
                .join('');
            this.elements.movieGenres.innerHTML = genresHTML;
        }

        // Overview
        if (this.elements.movieOverview) {
            this.elements.movieOverview.textContent = 
                this.movieData.overview || this.movieData.description || 'No description available.';
        }

        // Movie details
        this.renderLocalMovieInfo();

        // Related movies (show other local movies)
        const otherMovies = this.localMovies.filter(m => m.id !== this.localId).slice(0, 6);
        this.renderRelatedMovies(otherMovies, true);
    }

    renderTMDbMovieDetails() {
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
        this.renderTMDbMovieMeta();

        // Genres
        this.renderTMDbGenres();

        // Overview
        if (this.elements.movieOverview) {
            this.elements.movieOverview.textContent = 
                this.movieData.overview || 'No overview available.';
        }

        // Movie details
        this.renderTMDbMovieInfo();

        // Cast & Crew
        this.renderCastCrew();
    }

    renderTMDbMovieMeta() {
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

    renderTMDbGenres() {
        if (!this.elements.movieGenres || !this.movieData.genres) return;

        const genresHTML = this.movieData.genres
            .slice(0, 3)
            .map(genre => `<span class="genre-tag">${this.escapeHtml(genre.name)}</span>`)
            .join('');

        this.elements.movieGenres.innerHTML = genresHTML;
    }

    renderLocalMovieInfo() {
        // Release date
        if (this.elements.movieRelease) {
            this.elements.movieRelease.textContent = this.movieData.year || 'Not available';
        }

        // Runtime
        if (this.elements.movieRuntime) {
            this.elements.movieRuntime.textContent = 
                this.formatRuntime(this.movieData.runtime) || 'Not available';
        }

        // Language
        if (this.elements.movieLanguage) {
            this.elements.movieLanguage.textContent = 
                this.movieData.language?.toUpperCase() || 'Not available';
        }

        // Rating
        if (this.elements.movieRating) {
            this.elements.movieRating.textContent = 
                this.movieData.rating ? `${this.movieData.rating}/10` : 'Not available';
        }
    }

    renderTMDbMovieInfo() {
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
        this.renderRelatedMovies(movies, false);
    }

    renderRelatedMovies(movies, isLocal) {
        if (!this.elements.relatedMovies) return;

        if (!movies || movies.length === 0) {
            this.elements.relatedMovies.innerHTML = 
                '<div class="loading-placeholder"><span>No similar movies found</span></div>';
            return;
        }

        const moviesHTML = movies.slice(0, 6).map(movie => this.createRelatedCard(movie, isLocal)).join('');
        this.elements.relatedMovies.innerHTML = moviesHTML;
    }

    createRelatedCard(movie, isLocal) {
        const posterUrl = isLocal ? movie.poster : 
            (movie.poster_path ? `${this.IMG_BASE}${movie.poster_path}` : null);

        const title = this.escapeHtml(movie.title || 'Untitled');
        const year = isLocal ? movie.year : 
            (movie.release_date ? new Date(movie.release_date).getFullYear() : '');

        const dataAttribute = isLocal ? `data-local-id="${movie.id}"` : `data-id="${movie.id}"`;

        return `
            <div class="related-card movie-card" ${dataAttribute} role="button" tabindex="0">
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

    // Action Functions
    playMovie() {
        if (this.isLocalMovie && this.localId) {
            window.location.href = `/watch.html?localId=${encodeURIComponent(this.localId)}`;
        } else if (this.movieId) {
            window.location.href = `/watch.html?id=${encodeURIComponent(this.movieId)}`;
        }
    }

    async playTrailer() {
        if (this.isLocalMovie) {
            this.showNotification('Trailer not available for local movies');
            return;
        }

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

    downloadMovie() {
        if (this.isLocalMovie && this.movieData.download) {
            window.open(this.movieData.download, '_blank');
            this.showNotification('Download started');
        } else if (this.movieId) {
            window.open(`/api/download/${this.movieId}?quality=1080p`, '_blank');
            this.showNotification('Download started');
        } else {
            this.showNotification('Download not available');
        }
    }

    async fetchTrailerKey() {
        if (this.isLocalMovie) return null;

        try {
            const response = await this.fetchFromAPI(`movie/${this.movieId}/videos`);
            const videos = response.results || [];

            const youtubeVideo = videos.find(video => 
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
            `https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`;
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

        if (isAdded) {
            this.elements.addListBtn.innerHTML = 'âœ“';
            this.showNotification('Added to My List');
        } else {
            this.elements.addListBtn.innerHTML = 'ï¼‹';
            this.showNotification('Removed from My List');
        }
    }

    shareMovie() {
        if (navigator.share && this.movieData) {
            navigator.share({
                title: this.movieData.title,
                text: `Check out ${this.movieData.title} on FilmyFeed!`,
                url: window.location.href
            }).catch(console.error);
        } else {
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
        t