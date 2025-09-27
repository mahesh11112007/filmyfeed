/**
 * FilmyFeed Movie Details Page - CORRECTED
 * Simplified version that works with basic JSON structure (movie, id, watch, download)
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
        try {
            this.setupEventListeners();
            this.extractParams();
            await this.loadLocalMovies();

            if (this.localId) {
                console.log('Loading local movie:', this.localId);
                this.isLocalMovie = true;
                await this.loadLocalMovieDetails();
            } else if (this.movieId) {
                console.log('Loading TMDb movie:', this.movieId);
                this.isLocalMovie = false;
                await this.loadTMDbMovieDetails();
            } else {
                console.error('No movie ID found in URL');
                this.showError('Movie not found. Please check the URL.');
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize movie details page.');
        }
    }

    setupEventListeners() {
        // Navigation - Fixed to work properly
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }

        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'index.html';
            });
        }

        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareMovie();
            });
        }

        // Action buttons - Fixed to work with basic JSON structure
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.playMovie();
            });
        }

        if (this.elements.heroPlayBtn) {
            this.elements.heroPlayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.playMovie();
            });
        }

        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadMovie();
            });
        }

        if (this.elements.trailerBtn) {
            this.elements.trailerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.playTrailer();
            });
        }

        if (this.elements.addListBtn) {
            this.elements.addListBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMyList();
            });
        }

        // Trailer modal
        if (this.elements.trailerClose) {
            this.elements.trailerClose.addEventListener('click', () => {
                this.closeTrailer();
            });
        }

        if (this.elements.trailerModal) {
            this.elements.trailerModal.addEventListener('click', (e) => {
                if (e.target === this.elements.trailerModal) {
                    this.closeTrailer();
                }
            });
        }

        // Error retry
        if (this.elements.movieError) {
            this.elements.movieError.addEventListener('click', () => {
                if (this.localId) {
                    this.loadLocalMovieDetails();
                } else if (this.movieId) {
                    this.loadTMDbMovieDetails();
                }
            });
        }

        // Related movies clicks
        document.addEventListener('click', (e) => {
            const relatedCard = e.target.closest('.related-card');
            if (relatedCard) {
                e.preventDefault();
                const localId = relatedCard.dataset.localId;
                const tmdbId = relatedCard.dataset.id;

                if (localId) {
                    window.location.href = `movie.html?localId=${encodeURIComponent(localId)}`;
                } else if (tmdbId) {
                    window.location.href = `movie.html?id=${encodeURIComponent(tmdbId)}`;
                }
            }
        });
    }

    extractParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.localId = urlParams.get('localId');
        this.movieId = urlParams.get('id');
        console.log('URL params extracted:', { localId: this.localId, movieId: this.movieId });
    }

    async loadLocalMovies() {
        try {
            const response = await fetch('/movies.json');
            if (!response.ok) {
                // Try alternative path
                const response2 = await fetch('/data/movies.json');
                if (response2.ok) {
                    this.localMovies = await response2.json();
                } else {
                    throw new Error('Could not load movies.json from any location');
                }
            } else {
                this.localMovies = await response.json();
            }
            console.log(`Loaded ${this.localMovies.length} local movies`);
        } catch (error) {
            console.error('Error loading movies.json:', error);
            this.localMovies = [];
        }
    }

    async loadLocalMovieDetails() {
        this.showLoading();

        try {
            // Find the local movie by ID
            const movie = this.localMovies.find(m => 
                String(m.id) === String(this.localId) || 
                m.movie === this.localId
            );

            if (!movie) {
                throw new Error(`Local movie not found: ${this.localId}`);
            }

            console.log('Found local movie:', movie);
            this.movieData = movie;

            // Try to enrich with TMDb if numeric ID exists
            if (movie.id && typeof movie.id === 'number' && movie.id > 1000) {
                try {
                    this.movieData = await this.enrichWithTMDb(movie);
                } catch (enrichError) {
                    console.log('TMDb enrichment failed, using basic data:', enrichError);
                    // Keep original movie data if enrichment fails
                }
            }

            this.renderMovieDetails();
            this.updatePageTitle();
            this.showContent();

        } catch (error) {
            console.error('Error loading local movie:', error);
            this.showError(`Failed to load movie details: ${error.message}`);
        }
    }

    async loadTMDbMovieDetails() {
        this.showLoading();

        try {
            const [movieResponse, creditsResponse] = await Promise.all([
                this.fetchFromAPI(`movie/${this.movieId}`),
                this.fetchFromAPI(`movie/${this.movieId}/credits`)
            ]);

            this.movieData = movieResponse;
            this.creditsData = creditsResponse;

            this.renderMovieDetails();
            this.updatePageTitle();
            this.showContent();

        } catch (error) {
            console.error('Error loading TMDb movie:', error);
            this.showError('Failed to load movie details from TMDb.');
        }
    }

    async enrichWithTMDb(localMovie) {
        if (!localMovie.id || typeof localMovie.id !== 'number') {
            return localMovie;
        }

        try {
            const [details, credits] = await Promise.all([
                this.fetchFromAPI(`movie/${localMovie.id}`),
                this.fetchFromAPI(`movie/${localMovie.id}/credits`)
            ]);

            return {
                ...localMovie,
                title: details.title || localMovie.movie,
                year: details.release_date ? new Date(details.release_date).getFullYear() : null,
                language: details.original_language?.toUpperCase(),
                rating: typeof details.vote_average === 'number' ? details.vote_average.toFixed(1) : null,
                runtime: details.runtime,
                poster: details.poster_path ? `${this.IMG_BASE}${details.poster_path}` : null,
                backdrop: details.backdrop_path ? `${this.BACKDROP_BASE}${details.backdrop_path}` : null,
                overview: details.overview,
                genres: (details.genres || []).map(g => g.name),
                cast: (credits.cast || []).slice(0, 5).map(p => p.name),
                director: (credits.crew || []).find(p => p.job === 'Director')?.name,
                release_date: details.release_date,
                vote_average: details.vote_average,
                spoken_languages: details.spoken_languages,
                _tmdbDetails: details,
                _tmdbCredits: credits
            };
        } catch (error) {
            console.log('TMDb enrichment failed for', localMovie.movie, error);
            return localMovie;
        }
    }

    renderMovieDetails() {
        if (!this.movieData) return;

        console.log('Rendering movie details:', this.movieData);

        // Hero backdrop
        const backdropUrl = this.movieData.backdrop || 
                           (this.movieData.backdrop_path ? `${this.BACKDROP_BASE}${this.movieData.backdrop_path}` : null);

        if (backdropUrl && this.elements.movieBackdrop) {
            this.elements.movieBackdrop.style.backgroundImage = `url(${backdropUrl})`;
        }

        // Movie poster  
        const posterUrl = this.movieData.poster ||
                         (this.movieData.poster_path ? `${this.IMG_BASE}${this.movieData.poster_path}` : null);

        if (posterUrl && this.elements.moviePoster) {
            this.elements.moviePoster.src = posterUrl;
            this.elements.moviePoster.alt = `${this.movieData.title || this.movieData.movie} poster`;
        }

        // Basic info
        if (this.elements.movieTitle) {
            this.elements.movieTitle.textContent = this.movieData.title || this.movieData.movie || 'Untitled';
        }

        // Meta information
        this.renderMovieMeta();

        // Genres
        this.renderGenres();

        // Overview
        if (this.elements.movieOverview) {
            this.elements.movieOverview.textContent = this.movieData.overview || 'No overview available.';
        }

        // Movie details
        this.renderMovieInfo();

        // Cast & Crew
        this.renderCastCrew();

        // Related movies (show other local movies)
        if (this.isLocalMovie && this.localMovies.length > 1) {
            const otherMovies = this.localMovies.filter(m => 
                String(m.id) !== String(this.localId) && m.movie !== this.localId
            ).slice(0, 6);
            this.renderRelatedMovies(otherMovies, true);
        }
    }

    renderMovieMeta() {
        if (!this.elements.movieMeta) return;

        const year = this.movieData.year || 
                    (this.movieData.release_date ? new Date(this.movieData.release_date).getFullYear() : '');

        const rating = this.movieData.rating || 
                      (typeof this.movieData.vote_average === 'number' ? this.movieData.vote_average.toFixed(1) : 'N/A');

        const language = (this.movieData.language || this.movieData.original_language || '').toUpperCase();

        const metaParts = [];
        if (year) metaParts.push(year);
        if (language) metaParts.push(language);
        metaParts.push(`â˜… ${rating}`);

        this.elements.movieMeta.textContent = metaParts.join(' â€¢ ');
    }

    renderGenres() {
        if (!this.elements.movieGenres) return;

        let genres = this.movieData.genres || [];

        if (genres.length > 0) {
            const genresHTML = genres
                .slice(0, 3)
                .map(genre => `<span class="genre">${this.escapeHtml(genre)}</span>`)
                .join('');
            this.elements.movieGenres.innerHTML = genresHTML;
        }
    }

    renderMovieInfo() {
        // Release date
        if (this.elements.movieRelease) {
            const releaseDate = this.movieData.release_date ? 
                this.formatDate(this.movieData.release_date) : 
                (this.movieData.year || 'Not available');
            this.elements.movieRelease.textContent = releaseDate;
        }

        // Runtime
        if (this.elements.movieRuntime) {
            this.elements.movieRuntime.textContent = this.formatRuntime(this.movieData.runtime) || 'Not available';
        }

        // Language
        if (this.elements.movieLanguage) {
            const language = this.movieData.spoken_languages?.[0]?.english_name || 
                           (this.movieData.language || this.movieData.original_language || 'Unknown').toUpperCase();
            this.elements.movieLanguage.textContent = language;
        }

        // Rating
        if (this.elements.movieRating) {
            const rating = this.movieData.rating ? 
                `${this.movieData.rating}/10` : 
                (typeof this.movieData.vote_average === 'number' ? 
                    `${this.movieData.vote_average.toFixed(1)}/10` : 'N/A');
            this.elements.movieRating.textContent = rating;
        }
    }

    renderCastCrew() {
        // Director
        if (this.elements.movieDirector) {
            const director = this.movieData.director || 
                           (this.creditsData?.crew?.find(person => person.job === 'Director')?.name) || 
                           'Not available';
            this.elements.movieDirector.textContent = director;
        }

        // Cast
        if (this.elements.movieCast) {
            const cast = this.movieData.cast || 
                        (this.creditsData?.cast?.slice(0, 5).map(person => person.name)) || 
                        [];

            const castText = Array.isArray(cast) ? cast.join(', ') : (cast || 'Not available');
            this.elements.movieCast.textContent = castText;
        }
    }

    renderRelatedMovies(movies, isLocal = false) {
        if (!this.elements.relatedMovies || !movies || movies.length === 0) {
            if (this.elements.relatedMovies) {
                this.elements.relatedMovies.innerHTML = '<p>No related movies found.</p>';
            }
            return;
        }

        const moviesHTML = movies.map(movie => {
            const title = movie.title || movie.movie || 'Untitled';
            const year = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : '');
            const poster = movie.poster || (movie.poster_path ? `${this.IMG_BASE}${movie.poster_path}` : '/placeholder.jpg');
            const id = isLocal ? movie.id : movie.id;
            const idParam = isLocal ? `localId=${encodeURIComponent(id)}` : `id=${encodeURIComponent(id)}`;

            return `
                <div class="related-card" ${isLocal ? `data-local-id="${id}"` : `data-id="${id}"`}>
                    <img src="${poster}" alt="${this.escapeHtml(title)}" loading="lazy" 
                         onerror="this.src='/placeholder.jpg'">
                    <div class="related-info">
                        <h4>${this.escapeHtml(title)}</h4>
                        ${year ? `<span class="year">${year}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.elements.relatedMovies.innerHTML = moviesHTML;
    }

    // Action methods - Fixed to work with basic JSON structure
    playMovie() {
        if (this.isLocalMovie && this.movieData?.watch) {
            // For local movies, redirect to watch page or direct link
            if (this.movieData.watch.includes('.mp4') || this.movieData.watch.includes('http')) {
                window.location.href = `watch.html?url=${encodeURIComponent(this.movieData.watch)}&title=${encodeURIComponent(this.movieData.title || this.movieData.movie)}`;
            } else {
                window.open(this.movieData.watch, '_blank');
            }
        } else if (!this.isLocalMovie) {
            // For TMDb movies, might need different handling
            window.location.href = `watch.html?id=${this.movieId}`;
        } else {
            alert('Watch link not available for this movie.');
        }
    }

    downloadMovie() {
        if (this.isLocalMovie && this.movieData?.download) {
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = this.movieData.download;
            link.download = this.movieData.title || this.movieData.movie || 'movie';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('Download link not available for this movie.');
        }
    }

    playTrailer() {
        if (this.movieData?.trailerUrl) {
            this.openTrailerModal(this.movieData.trailerUrl, this.movieData.title || this.movieData.movie);
        } else {
            alert('Trailer not available for this movie.');
        }
    }

    toggleMyList() {
        // Basic implementation - could be enhanced with local storage
        const button = this.elements.addListBtn;
        if (button) {
            if (button.textContent.includes('Remove')) {
                button.innerHTML = '<i class="icon-plus"></i> My List';
            } else {
                button.innerHTML = '<i class="icon-check"></i> Remove from List';
            }
        }
    }

    shareMovie() {
        if (navigator.share) {
            navigator.share({
                title: this.movieData?.title || this.movieData?.movie || 'Movie',
                text: `Check out ${this.movieData?.title || this.movieData?.movie || 'this movie'} on FilmyFeed!`,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Movie link copied to clipboard!');
            }).catch(() => {
                alert('Unable to share movie link.');
            });
        }
    }

    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    }

    // Modal methods
    openTrailerModal(trailerUrl, title) {
        if (this.elements.trailerModal && this.elements.trailerIframe) {
            this.elements.trailerIframe.src = trailerUrl;
            if (this.elements.trailerTitle) {
                this.elements.trailerTitle.textContent = `${title} - Trailer`;
            }
            this.elements.trailerModal.classList.add('active');
        }
    }

    closeTrailer() {
        if (this.elements.trailerModal && this.elements.trailerIframe) {
            this.elements.trailerModal.classList.remove('active');
            this.elements.trailerIframe.src = '';
        }
    }

    // Loading/Error states
    showLoading() {
        if (this.elements.movieLoading) this.elements.movieLoading.style.display = 'flex';
        if (this.elements.movieError) this.elements.movieError.style.display = 'none';
        if (this.elements.movieContent) this.elements.movieContent.style.display = 'none';
    }

    showContent() {
        if (this.elements.movieLoading) this.elements.movieLoading.style.display = 'none';
        if (this.elements.movieError) this.elements.movieError.style.display = 'none';
        if (this.elements.movieContent) this.elements.movieContent.style.display = 'block';
    }

    showError(message) {
        if (this.elements.movieLoading) this.elements.movieLoading.style.display = 'none';
        if (this.elements.movieContent) this.elements.movieContent.style.display = 'none';
        if (this.elements.movieError) {
            this.elements.movieError.style.display = 'flex';
            const errorText = this.elements.movieError.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
        } else {
            console.error(message);
        }
    }

    updatePageTitle() {
        const title = this.movieData?.title || this.movieData?.movie || 'Movie Details';
        document.title = `${title} - FilmyFeed`;
    }

    // API methods
    async fetchFromAPI(endpoint, params = {}) {
        const url = new URL(`${this.API_BASE}/${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        return response.json();
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
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

    formatRuntime(runtime) {
        if (!runtime || typeof runtime !== 'number') return null;
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.movieDetailsApp = new MovieDetailsApp();
});