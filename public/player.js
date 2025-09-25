/**
 * FilmyFeed Professional Video Player
 * Netflix-style video player with HLS streaming, quality selection, mobile controls
 */

class FilmyFeedPlayer {
    constructor(container, options = {}) {
        this.container = container;
        this.movieId = options.movieId;
        this.autoplay = options.autoplay || false;
        this.startTime = options.startTime || 0;

        // Player state
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1;
        this.isMuted = false;
        this.currentQuality = 'auto';
        this.availableQualities = [];
        this.controlsVisible = true;
        this.isFullscreen = false;

        // HLS instance
        this.hls = null;
        this.video = null;

        // Touch/gesture state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTouchTime = 0;
        this.isSeekingByTouch = false;

        this.init();
    }

    init() {
        this.createPlayerHTML();
        this.setupVideoElement();
        this.setupHLS();
        this.setupEventListeners();
        this.setupTouchControls();

        if (this.movieId) {
            this.loadMovie(this.movieId);
        }
    }

    createPlayerHTML() {
        this.container.innerHTML = `
            <div class="filmyfeed-player" id="filmyfeed-player">
                <video 
                    class="player-video" 
                    id="player-video"
                    playsinline
                    webkit-playsinline
                    preload="metadata"
                ></video>

                <!-- Loading Overlay -->
                <div class="player-loading" id="player-loading">
                    <div class="loading-spinner"></div>
                    <span class="loading-text">Loading video...</span>
                </div>

                <!-- Error Overlay -->
                <div class="player-error hidden" id="player-error">
                    <div class="error-icon">âš ï¸</div>
                    <h3 class="error-title">Playback Error</h3>
                    <p class="error-message">Unable to load video. Please try again.</p>
                    <button class="retry-btn" id="retry-btn">Retry</button>
                </div>

                <!-- Player Controls -->
                <div class="player-controls" id="player-controls">
                    <!-- Top Controls -->
                    <div class="controls-top">
                        <button class="control-btn back-btn" id="back-btn" aria-label="Back">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>
                        <div class="movie-info">
                            <h3 class="movie-title" id="player-movie-title">Loading...</h3>
                            <p class="movie-meta" id="player-movie-meta"></p>
                        </div>
                        <button class="control-btn cast-btn" id="cast-btn" aria-label="Cast">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Center Play Button -->
                    <div class="controls-center">
                        <button class="play-btn-large" id="play-btn-large" aria-label="Play/Pause">
                            <svg class="play-icon" width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <svg class="pause-icon hidden" width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Bottom Controls -->
                    <div class="controls-bottom">
                        <!-- Progress Bar -->
                        <div class="progress-section">
                            <div class="progress-bar" id="progress-bar">
                                <div class="progress-buffer" id="progress-buffer"></div>
                                <div class="progress-played" id="progress-played"></div>
                                <div class="progress-handle" id="progress-handle"></div>
                            </div>
                            <div class="time-display">
                                <span class="current-time" id="current-time">0:00</span>
                                <span class="duration" id="duration">0:00</span>
                            </div>
                        </div>

                        <!-- Control Buttons -->
                        <div class="control-buttons">
                            <button class="control-btn play-btn" id="play-btn" aria-label="Play/Pause">
                                <svg class="play-icon" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                <svg class="pause-icon hidden" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            </button>

                            <button class="control-btn volume-btn" id="volume-btn" aria-label="Volume">
                                <svg class="volume-high" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                </svg>
                                <svg class="volume-muted hidden" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                </svg>
                            </button>

                            <button class="control-btn quality-btn" id="quality-btn" aria-label="Quality">
                                <span class="quality-text">AUTO</span>
                            </button>

                            <button class="control-btn subtitles-btn" id="subtitles-btn" aria-label="Subtitles">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
                                </svg>
                            </button>

                            <button class="control-btn download-btn" id="download-btn" aria-label="Download">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                </svg>
                            </button>

                            <button class="control-btn fullscreen-btn" id="fullscreen-btn" aria-label="Fullscreen">
                                <svg class="expand" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                                </svg>
                                <svg class="compress hidden" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quality Selection Menu -->
                <div class="quality-menu hidden" id="quality-menu">
                    <div class="menu-header">
                        <h4>Video Quality</h4>
                    </div>
                    <div class="quality-options" id="quality-options">
                        <!-- Quality options populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        // Get elements
        this.video = document.getElementById('player-video');
        this.playBtnLarge = document.getElementById('play-btn-large');
        this.playBtn = document.getElementById('play-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.progressPlayed = document.getElementById('progress-played');
        this.progressBuffer = document.getElementById('progress-buffer');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        this.controls = document.getElementById('player-controls');
        this.loading = document.getElementById('player-loading');
        this.error = document.getElementById('player-error');
    }

    setupVideoElement() {
        if (!this.video) return;

        // Basic video event listeners
        this.video.addEventListener('loadedmetadata', () => {
            this.duration = this.video.duration;
            this.updateDurationDisplay();
            this.hideLoading();
        });

        this.video.addEventListener('timeupdate', () => {
            this.currentTime = this.video.currentTime;
            this.updateProgress();
        });

        this.video.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButtons();
        });

        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButtons();
        });

        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButtons();
            this.showControls();
        });

        this.video.addEventListener('waiting', () => {
            this.showLoading();
        });

        this.video.addEventListener('canplay', () => {
            this.hideLoading();
        });

        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.showError('Video playback failed. Please try again.');
        });
    }

    setupHLS() {
        if (!window.Hls) {
            console.error('HLS.js not loaded');
            this.showError('Video player not supported. Please update your browser.');
            return;
        }

        if (Hls.isSupported()) {
            this.hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
            });

            this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                console.log('ðŸŽ¬ HLS manifest loaded, qualities:', data.levels.length);
                this.availableQualities = data.levels.map(level => ({
                    height: level.height,
                    bitrate: level.bitrate,
                    label: this.getQualityLabel(level.height)
                }));
                this.populateQualityMenu();
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    this.showError('Streaming error. Please check your connection.');
                }
            });

        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            console.log('ðŸŽ¬ Using native HLS support');
        } else {
            this.showError('HLS streaming not supported in this browser.');
        }
    }

    async loadMovie(movieId) {
        try {
            this.showLoading();

            // Get video info
            const videoInfo = await this.fetchVideoInfo(movieId);
            if (!videoInfo.available) {
                throw new Error('Video not available');
            }

            // Load HLS manifest
            const manifestUrl = `/api/stream/${movieId}/manifest.m3u8`;

            if (this.hls) {
                this.hls.loadSource(manifestUrl);
                this.hls.attachMedia(this.video);
            } else {
                // Native HLS
                this.video.src = manifestUrl;
            }

            // Update UI with movie info
            await this.updateMovieInfo(movieId);

            if (this.autoplay) {
                this.video.play();
            }

        } catch (error) {
            console.error('Error loading movie:', error);
            this.showError('Failed to load movie. Please try again.');
        }
    }

    async fetchVideoInfo(movieId) {
        const response = await fetch(`/api/stream/${movieId}/info`);
        return await response.json();
    }

    async updateMovieInfo(movieId) {
        try {
            const response = await fetch(`/api/movie/${movieId}`);
            const movieData = await response.json();

            const titleEl = document.getElementById('player-movie-title');
            const metaEl = document.getElementById('player-movie-meta');

            if (titleEl) titleEl.textContent = movieData.title || 'Unknown Movie';
            if (metaEl) {
                const year = movieData.release_date ? new Date(movieData.release_date).getFullYear() : '';
                const runtime = this.formatDuration(movieData.runtime * 60);
                metaEl.textContent = `${year} â€¢ ${runtime}`;
            }
        } catch (error) {
            console.error('Error fetching movie info:', error);
        }
    }

    // ... (continued in next part due to length)

    getQualityLabel(height) {
        if (height >= 2160) return '4K';
        if (height >= 1080) return '1080p';
        if (height >= 720) return '720p';
        if (height >= 480) return '480p';
        return 'Auto';
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    showLoading() {
        this.loading?.classList.remove('hidden');
    }

    hideLoading() {
        this.loading?.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.error?.classList.remove('hidden');
        const errorMessage = this.error?.querySelector('.error-message');
        if (errorMessage) errorMessage.textContent = message;
    }

    hideError() {
        this.error?.classList.add('hidden');
    }
}

// Export for use
window.FilmyFeedPlayer = FilmyFeedPlayer;