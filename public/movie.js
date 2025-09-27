/**
 * FilmyFeed Movie Details Page - CORRECTED FOR TMDb ENRICHMENT
 * Uses only movie, id, watch, download from movies.json
 * All images and metadata come from TMDb API
 */
class MovieDetailsApp {
    constructor() {
        // TMDb API configuration - you need to add your API key in server.js
        this.API_BASE = '/api/tmdb';
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
            relatedMovies: document.getElementById('related-movies')
        };

        this.init();
    }

    async init() {
        try {
            console.log('Initializing MovieDetailsApp...');
            this.setupEventListeners();
            this.extractParams();
            await this.loadLocalMovies();

            if (this.localId) {
                console.log('Loading local movie with localId:', this.localId);
                this.isLocalMovie = true;
                await this.loadLocalMovieDetails();
            } else if (this.movieId) {
                console.log('Loading TMDb movie with id:', this.movieId);
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
        // Navigation buttons
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }

        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/index.html';
            });
        }

        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareMovie();
            });
        }

        // Action buttons
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
    }

    extractParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.localId = urlParams.get('localId');
        this.movieId = urlParams.get('id');
        console.log('URL params extracted:', { localId: this.localId, movieId: this.movieId });
    }

    async loadLocalMovies() {
        try {
            console.log('Loading movies.json...');
            const response = await fetch('/movies.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.localMovies = await response.json();
            console.log('Loaded local movies:', this.localMovies);
        } catch (error) {
            console.error('Error loading movies.json:', error);
            this.localMovies = [];
        }
    }

    async loadLocalMovieDetails() {
        this.showLoading();

        try {
            console.log('Finding local movie with localId:', this.localId);

            // Find the local movie by ID
            const movie = this.localMovies.find(m => 
                String(m.id) === String(this.localId)
            );

            if (!movie) {
                throw new Error(`Local movie not found with id: ${this.localId}`);
            }

            console.log('Found local movie:', movie);

            // ALWAYS enrich with TMDb data for images and metadata
            this.movieData = await this.enrichWithTMDb(movie);

            console.log('Enriched movie data:', this.movieData);

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
            console.log('No valid TMDb ID found, using basic local data only');
            return localMovie;
        }

        try {
            console.log('Enriching with TMDb data for movie ID:', localMovie.id);

            const [details, credits] = await Promise.all([
                this.fetchFromAPI(`movie/${localMovie.id}`),
                this.fetchFromAPI(`movie/${localMovie.id}/credits`)
            ]);

            console.log('TMDb details received:', details);
            console.log('TMDb credits received:', credits);

            // Merge TMDb data with local data, keeping local watch/download links
            const enrichedMovie = {
                // Keep original local data
                movie: localMovie.movie,
                id: localMovie.id,
                watch: localMovie.watch,
                download: localMovie.download,

                // Add TMDb data
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

                // Store full TMDb data for reference
                _tmdbDetails: details,
                _tmdbCredits: credits
            };

            console.log('Movie enriched with TMDb data:', enrichedMovie);
            return enrichedMovie;

        } catch (error) {
            console.error('TMDb enrichment failed for', localMovie.movie, error);
            // Return original local movie data if enrichment fails
            return {
                ...localMovie,
                title: localMovie.movie // Fallback title
            };
        }
    }

    renderMovieDetails() {
        if (!this.movieData) {
            console.error('No movie data to render');
            return;
        }

        console.log('Rendering movie details for:', this.movieData.title || this.movieData.movie);

        // Hero backdrop from TMDb
        const backdropUrl = this.movieData.backdrop || 
                           (this.movieData.backdrop_path ? `${this.BACKDROP_BASE}${this.movieData.backdrop_path}` : null);

        if (backdropUrl && this.elements.movieBackdrop) {
            this.elements.movieBackdrop.style.backgroundImage = `url(${backdropUrl})`;
            console.log('Set backdrop:', backdropUrl);
        }

        // Movie poster from TMDb
        const posterUrl = this.movieData.poster ||
                         (this.movieData.poster_path ? `${this.IMG_BASE}${this.movieData.poster_path}` : null);

        if (posterUrl && this.elements.moviePoster) {
            this.elements.moviePoster.src = posterUrl;
            this.elements.moviePoster.alt = `${this.movieData.title || this.movieData.movie} poster`;
            console.log('Set poster:', posterUrl);
        }

        // Movie title
        if (this.elements.movieTitle) {
            this.elements.movieTitle.textContent = this.movieData.title || this.movieData.movie || 'Untitled';
        }

        // Meta information (year, language, rating)
        this.renderMovieMeta();

        // Genres from TMDb
        this.renderGenres();

        // Overview from TMDb
        if (this.elements.movieOverview) {
            this.elements.movieOverview.textContent = this.movieData.overview || 'No overview available.';
        }

        // Movie details from TMDb
        this.renderMovieInfo();

        // Cast & Crew from TMDb
        this.renderCastCrew();

        console.log('Movie details rendered successfully');
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

    // Action methods - Use local watch/download links
    playMovie() {
        if (this.isLocalMovie && this.movieData?.watch) {
            console.log('Playing movie from local watch link:', this.movieData.watch);
            // For local movies, use the watch link from movies.json
            if (this.movieData.watch.includes('.mp4') || this.movieData.watch.includes('http')) {
                window.location.href = `watch.html?url=${encodeURIComponent(this.movieData.watch)}&title=${encodeURIComponent(this.movieData.title || this.movieData.movie)}`;
            } else {
                window.open(this.movieData.watch, '_blank');
            }
        } else {
            alert('Watch link not available for this movie.');
        }
    }

    downloadMovie() {
        if (this.isLocalMovie && this.movieData?.download) {
            console.log('Downloading movie from local download link:', this.movieData.download);
            // For local movies, use the download link from movies.json
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
        // Could implement trailer from TMDb videos API in the future
        alert('Trailer feature coming soon!');
    }

    shareMovie() {
        if (navigator.share) {
            navigator.share({
                title: this.movieData?.title || this.movieData?.movie || 'Movie',
                text: `Check out ${this.movieData?.title || this.movieData?.movie || 'this movie'} on FilmyFeed!`,
                url: window.location.href
            }).catch(console.error);
        } else {
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
            window.location.href = '/index.html';
        }
    }

    // Loading/Error states
    showLoading() {
        console.log('Showing loading state');
        if (this.elements.movieLoading) this.elements.movieLoading.style.display = 'flex';
        if (this.elements.movieError) this.elements.movieError.style.display = 'none';
        if (this.elements.movieContent) this.elements.movieContent.style.display = 'none';
    }

    showContent() {
        console.log('Showing content');
        if (this.elements.movieLoading) this.elements.movieLoading.style.display = 'none';
        if (this.elements.movieError) this.elements.movieError.style.display = 'none';
        if (this.elements.movieContent) this.elements.movieContent.style.display = 'block';
    }

    showError(message) {
        console.error('Showing error:', message);
        if (this.elements.movieLoading) this.elements.movieLoading.style.display = 'none';
        if (this.elements.movieContent) this.elements.movieContent.style.display = 'none';
        if (this.elements.movieError) {
            this.elements.movieError.style.display = 'flex';
            const errorText = this.elements.movieError.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }

    updatePageTitle() {
        const title = this.movieData?.title || this.movieData?.movie || 'Movie Details';
        document.title = `${title} - FilmyFeed`;
    }

    // API methods
    async fetchFromAPI(endpoint, params = {}) {
        try {
            const url = new URL(`${this.API_BASE}/${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            console.log('Fetching from API:', url.toString());
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
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
                