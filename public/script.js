/**
 * FilmyFeed Mobile - Touch-optimized with YouTube Trailers
 * Features: Mobile-first design, touch gestures, trailer playback, collapsible search
 */

class FilmyFeedMobileApp {
    constructor() {
        this.API_BASE = '/api';
        this.IMG_BASE = 'https://image.tmdb.org/t/p/w500';
        this.currentQuery = '';
        this.isLoading = false;
        this.searchActive = false;
        this.touchStartY = 0;
        this.touchStartX = 0;

        // DOM elements
        this.elements = {
            moviesGrid: document.getElementById('movies-grid'),
            searchToggle: document.getElementById('search-toggle'),
            searchWrapper: document.getElementById('search-wrapper'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchClose: document.getElementById('search-close'),
            pageTitle: document.getElementById('page-title'),
            loadingEl: document.getElementById('loading'),
            errorEl: document.getElementById('error'),
            noResultsEl: document.getElementById('no-results'),

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
        this.setupTouchOptimizations();
        this.handleInitialLoad();
        this.preventZoom();
    }

    setupEventListeners() {
        // Search toggle
        this.elements.searchToggle?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSearch();
        });

        // Search close
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

        // Movie grid with touch support
        this.elements.moviesGrid?.addEventListener('click', (e) => {
            this.handleGridClick(e);
        });

        // Touch events for better mobile experience
        this.elements.moviesGrid?.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        });

        this.elements.moviesGrid?.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        });

        // Browser navigation
        window.addEventListener('popstate', () => {
            this.handleBrowserNavigation();
        });

        // Error retry with touch support
        this.elements.errorEl?.addEventListener('click', () => {
            this.retry();
        });

        // Close search on outside click/touch
        document.addEventListener('click', (e) => {
            if (this.searchActive && 
                !e.target.closest('.search-container') && 
                !e.target.closest('.search-toggle')) {
                this.closeSearch();
            }
        });

        // Keyboard and escape handling
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

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle viewport resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleViewportChange();
        }, 250));
    }

    setupTouchOptimizations() {
        // Disable double-tap zoom on buttons
        const buttons = document.querySelectorAll('button, .movie-card');
        buttons.forEach(button => {
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
        });

        // Add touch feedback to cards
        if (this.elements.moviesGrid) {
            this.elements.moviesGrid.addEventListener('touchstart', (e) => {
                const card = e.target.closest('.movie-card');
                if (card) {
                    card.style.transform = 'scale(0.98)';
                    card.style.transition = 'transform 0.1s ease';
                }
            });

            this.elements.moviesGrid.addEventListener('touchend', (e) => {
                const card = e.target.closest('.movie-card');
                if (card) {
                    setTimeout(() => {
                        card.style.transform = '';
                        card.style.transition = '';
                    }, 150);
                }
            });
        }
    }

    preventZoom() {
        // Prevent double-tap zoom on specific elements
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this.lastTouchEnd <= 300) {
                e.preventDefault();
            }
            this.lastTouchEnd = now;
        });
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
        }
    }

    handleTouchEnd(e) {
        if (!e.changedTouches.length) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;

        const deltaY = this.touchStartY - touchEndY;
        const deltaX = Math.abs(this.touchStartX - touchEndX);

        // Detect swipe gestures (optional enhancement)
        if (Math.abs(deltaY) > 50 && deltaX < 100) {
            if (deltaY > 0) {
                // Swipe up - could implement pull to refresh
                this.handleSwipeUp();
            } else {
                // Swipe down
                this.handleSwipeDown();
            }
        }
    }

    handleSwipeUp() {
        // Optional: Implement pull to refresh
        console.log('Swipe up detected');
    }

    handleSwipeDown() {
        // Optional: Close search if open
        if (this.searchActive) {
            this.closeSearch();
        }
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

        // Focus with delay for mobile
        setTimeout(() => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
                // Scroll into view on mobile
                this.elements.searchInput.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 300);
    }

    closeSearch() {
        this.searchActive = false;
        this.elements.searchWrapper?.classList.remove('active');

        // Blur input to hide mobile keyboard
        if (this.elements.searchInput) {
            this.elements.searchInput.blur();
        }
    }

    handleInitialLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.trim();

        if (query) {
            this.currentQuery = query;
            if (this.elements.searchInput) {
                this.elements.searchInput.value = query;
                this.openSearch();
            }
            this.loadSearchResults(query);
        } else {
            this.loadLatestMovies();
        }
    }

    handleSearch() {
        const query = this.elements.searchInput.value.trim();

        if (!query) {
            this.navigateToHome();
            return;
        }

        if (query === this.currentQuery) {
            this.closeSearch();
            return;
        }

        // Update URL
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
        window.history.pushState({ query }, '', newUrl);

        this.currentQuery = query;
        this.loadSearchResults(query);
        this.closeSearch();
    }

    navigateToHome() {
        window.history.pushState({}, '', window.location.pathname);
        this.currentQuery = '';
        this.closeSearch();
        this.loadLatestMovies();
    }

    handleBrowserNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q')?.trim();

        if (query) {
            this.currentQuery = query;
            if (this.elements.searchInput) {
                this.elements.searchInput.value = query;
            }
            this.loadSearchResults(query);
        } else {
            this.currentQuery = '';
            if (this.elements.searchInput) {
                this.elements.searchInput.value = '';
            }
            this.loadLatestMovies();
        }
    }

    async handleGridClick(e) {
        e.preventDefault();

        // Handle trailer button clicks
        const trailerBtn = e.target.closest('.btn-trailer');
        if (trailerBtn) {
            const movieId = trailerBtn.dataset.id;
            const movieTitle = trailerBtn.dataset.title || 'Movie';

            if (movieId) {
                await this.playTrailer(movieId, movieTitle);
            }
            return;
        }

        // Handle movie card clicks (navigate to details or show modal)
        const card = e.target.closest('.movie-card');
        if (card && !this.isLoading && !e.target.closest('.movie-actions')) {
            const movieId = card.dataset.id;
            if (movieId) {
                // On mobile, we can show details in a modal instead of navigation
                await this.showMovieModal(movieId);
            }
        }
    }

    async playTrailer(movieId, movieTitle) {
        try {
            // Show loading state
            this.elements.trailerTitle.textContent = 'Loading trailer...';
            this.elements.trailerModal.classList.remove('hidden');

            // Lock body scroll
            document.body.style.overflow = 'hidden';

            // Fetch trailer
            const trailerKey = await this.fetchTrailerKey(movieId);

            if (trailerKey) {
                this.openTrailer(trailerKey, movieTitle);
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

            // Sort by preference: Official trailers first
            const sortedVideos = videos.sort((a, b) => {
                if (a.official !== b.official) {
                    return b.official - a.official;
                }
                if (a.type !== b.type) {
                    if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
                    if (b.type === 'Trailer' && a.type !== 'Trailer') return 1;
                }
                return 0;
            });

            // Find best YouTube video
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

        // Lock body scroll
        document.body.style.overflow = 'hidden';
    }

    closeTrailer() {
        this.elements.trailerIframe.src = '';
        this.elements.trailerModal.classList.add('hidden');

        // Restore body scroll
        document.body.style.overflow = '';
    }

    async showMovieModal(movieId) {
        // Simple implementation - could be enhanced with a proper modal
        try {
            const movie = await this.fetchFromAPI(`movie/${movieId}`);
            if (movie) {
                const message = `${movie.title}\n\nRelease: ${movie.release_date || 'TBA'}\nRating: ${movie.vote_average?.toFixed(1) || 'N/A'}/10\n\n${movie.overview || 'No overview available.'}`;
                alert(message);
            }
        } catch (error) {
            console.error('Error fetching movie details:', error);
        }
    }

    async loadLatestMovies() {
        this.updatePageHeader('Latest Movies', 'Discover new releases with trailers');
        await this.fetchAndRenderMovies('latest');
    }

    async loadSearchResults(query) {
        this.updatePageHeader(`Search: "${query}"`, 'Movies matching your search');
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

        } catch (error) {
            console.error('Error fetching movies:', error);
            this.showError('Failed to load movies. Tap to retry.');
        } finally {
            this.hideLoading();
        }
    }

    async fetchLatestMovies() {
        // Fetch multiple pages for variety
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

        return [...(page1?.results || []), ...(page2?.results || [])];
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

        const response = await fetch(url.toString());

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

        const moviesHTML = movies.map(movie => this.createMobileMovieCard(movie)).join('');
        this.elements.moviesGrid.innerHTML = moviesHTML;

        // Animate cards for mobile
        this.animateCardsForMobile();

        this.hideAllStatus();
    }

    createMobileMovieCard(movie) {
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
            <article class="movie-card" data-id="${movie.id}" role="button" tabindex="0">
                <div class="poster-container">
                    ${posterUrl 
                        ? `<img class="movie-poster" src="${posterUrl}" alt="${title} poster" loading="lazy">` 
                        : `<div class="movie-poster" style="display:flex;align-items:center;justify-content:center;color:#666;font-size:0.8rem;">No Poster</div>`
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
                    <div class="movie-actions">
                        <button class="btn-trailer" data-id="${movie.id}" data-title="${title}">
                            ðŸŽ¬ Trailer
                        </button>
                        <button class="btn-details" data-id="${movie.id}">
                            Details
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    animateCardsForMobile() {
        const cards = this.elements.moviesGrid.querySelectorAll('.movie-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100); // Slower stagger for mobile
        });
    }

    updatePageHeader(title, subtitle) {
        if (this.elements.pageTitle) {
            this.elements.pageTitle.textContent = title;
        }

        const subtitleEl = document.querySelector('.page-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = subtitle;
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
        this.hideAllStatus();
        if (this.elements.errorEl) {
            const textEl = this.elements.errorEl.querySelector('.status-text');
            if (textEl) {
                textEl.textContent = message;
            }
     