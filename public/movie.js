/**
 * FilmyFeed Movie Details Page - CORRECTED
 * Properly handles both local JSON movies and TMDb movies
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

        // CORRECTED: Properly determine movie type and load details
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
    }

    async loadLocalMovies() {
        try {
            const response = await fetch('/data/movies.json');
            this.localMovies = await response.json();
            console.log(`ðŸ“± Loaded ${this.localMovies.length} local movies for details page`);
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
            window.location.href = 'index.html';
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

            // Enrich with TMDb data if ID is available
            if (movie.id && typeof movie.id === 'number') {
                this.movieData = await this.enrichWithTMDb(movie);
            } else {
                this.movieData = movie;
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
            console.error('Error loading TMDb movie:', error);
            this.showError('Failed to load movie details from TMDb. Check your API key.');
        }
    }

    // TMDb Enrichment Function (same as in script.js)
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
                director: (credits.crew || []).find(p => p.job === 'Director')?.name,
                // Store credits for later use
                _tmdbDetails: details,
                _tmdbCredits: credits
            };
        } catch (e) {
            console.log('TMDb enrichment failed for', minItem.movie || minItem.id, e);
            return minItem;
        }
    }

    renderMovieDetails() {
        if (!this.movieData) return;

        console.log('Rendering movie details:', this.movieData);

        // Hero backdrop
        const backdropUrl = this.isLocalMovie ? 
            (this.movieData.backdrop || (this.movieData.backdrop_path ? `${this.BACKDROP_BASE}${this.movieData.backdrop_path}` : null)) :
            (this.movieData.backdrop_path ? `${this.BACKDROP_BASE}${this.movieData.backdrop_path}` : null);

        if (backdropUrl && this.elements.movieBackdrop) {
            this.elements.movieBackdrop.style.backgroundImage = `url(${backdropUrl})`;
        }

        // Movie poster
        const posterUrl = this.isLocalMovie ? 
            (this.movieData.poster || (this.movieData.poster_path ? `${this.IMG_BASE}${this.movieData.poster_path}` : null)) :
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
            this.elements.movieOverview.textContent = 
                this.movieData.overview || 'No overview available.';
        }

        // Movie details
        this.renderMovieInfo();

        // Cast & Crew (for enriched local movies or TMDb movies)
        this.renderCastCrew();

        // Related movies (for local movies, show other local movies)
        if (this.isLocalMovie) {
            const otherMovies = this.localMovies.filter(m => m.id !== this.localId).slice(0, 6);
            this.renderRelatedMovies(otherMovies, true);
        }
    }

    renderMovieMeta() {
        if (!this.elements.movieMeta) return;

        const year = this.isLocalMovie ? 
            (this.movieData.year || (this.movieData.release_date ? new Date(this.movieData.release_date).getFullYear() : '')) :
            (this.movieData.release_date ? new Date(this.movieData.release_date).getFullYear() : '');

        const rating = this.isLocalMovie ? 
            (this.movieData.rating || (typeof this.movieData.vote_average === 'number' ? this.movieData.vote_average.toFixed(1) : 'N/A')) :
            (typeof this.movieData.vote_average === 'number' ? this.movieData.vote_average.toFixed(1) : 'N/A');

        const language = this.isLocalMovie ? 
            (this.movieData.language || this.movieData.original_language || '').toUpperCase() :
            (this.movieData.original_language || '').toUpperCase();

        const metaParts = [];
        if (year) metaParts.push(year);
        if (language) metaParts.push(language);
        metaParts.push(`â˜… ${rating}`);

        this.elements.movieMeta.textContent = metaParts.join(' â€¢ ');
    }

    renderGenres() {
        if (!this.elements.movieGenres) return;

        let genres = [];
        if (this.isLocalMovie && this.movieData.genres) {
            genres = this.movieData.genres;
        } else if (!this.isLocalMovie && this.movieData.genres) {
            genres = this.movieData.genres.map(g => g.name || g);
        }

        if (genres.length > 0) {
            const genresHTML = genres
                .slice(0, 3)
                .map(genre => `<span class="genre-tag">${this.escapeHtml(genre)}</span>`)
                .join('');
            this.elements.movieGenres.innerHTML = genresHTML;
        }
    }

    renderMovieInfo() {
        // Release date
        if (this.elements.movieRelease) {
            const releaseDate = this.isLocalMovie ? 
                (this.movieData.year || (this.movieData.release_date ? this.formatDate(this.movieData.release_date) : 'Not available')) :
                (this.movieData.release_date ? this.formatDate(this.movieData.release_date) : 'Not available');
            this.elements.movieRelease.textContent = releaseDate;
        }

        // Runtime
        if (this.elements.movieRuntime) {
            this.elements.movieRuntime.textContent = 
                this.formatRuntime(this.movieData.runtime) || 'Not available';
        }

        // Language
        if (this.elements.movieLanguage) {
            const language = this.isLocalMovie ? 
                (this.movieData.language?.toUpperCase() || this.movieData.original_language?.toUpperCase() || 'Not available') :
                (this.movieData.spoken_languages?.[0]?.english_name || 
                 (this.movieData.original_language || '').toUpperCase() || 
                 'Unknown');
            this.elements.movieLanguage.textContent = language;
        }

        // Rating
        if (this.elements.movieRating) {
            const rating = this.isLocalMovie ? 
                (this.movieData.rating ? `${this.movieData.rating}/10` : 
                 (typeof this.movieData.vote_average === 'number' ? `${this.movieData.vote_average.toFixed(1)}/10` : 'N/A')) :
                (typeof this.movieData.vote_average === 'number' ? `${this.movieData.vote_average.toFixed(1)}/10` : 'N/A');
            this.elements.movieRating.textContent = rating;
        }
    }

    renderCastCrew() {
        // Director
        if (this.elements.movieDirector) {
            const director = this.isLocalMovie ? 
                (this.movieData.director || 
                 (this.movieData._tmdbCredits?.crew?.find(person => person.job === 'Director')?.name)) :
                (this.creditsData?.crew?.find(person => person.job === 'Director')?.name);
            this.elements.movieDirector.textContent = director || 'Not available';
        }

        // Cast
        if (this.elements.movieCast) {
            const cast = this.isLocalMovie ? 
                (this.movieData.cast || 
                 (this.movieData._tmdbCredits?.cast?.slice(0, 5).map(person => person.name))) :
                (this.creditsData?.cast?.slice(0, 5).map(person => person.name) || []);

            const castText = Array.isArray(cast) ? cast.join(', ') : (cast || 'Not available');
            this.elements.movieCast.textContent = castText;
        }
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

    renderSimilarMovies(movies) {
        this.renderRelatedMovies(movies, false);
    }

    createRelatedCard(movie, isLocal) {
        const posterUrl = isLocal ? 
            (movie.poster || (movie.poster_path ? `${this.IMG_BASE}${movie.poster_path}` : null)) :
            (movie.poster_path ? `${this.IMG_BASE}${movie.poster_path}` : null);

        const title = this.escapeHtml(movie.title || movie.movie || 'Untitled');
        const year = isLocal ? 
            (movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : '')) :
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
            window.location.href = `watch.html?localId=${encodeURIComponent(this.localId)}`;
        } else if (this.movieId) {
            window.location.href = `watch.html?id=${encodeURIComponent(this.movieId)}`;
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
        if (this.isLocalMovie && this.movieData && this.movieData.download) {
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

            return youtubeVideo?.key 