/**
 * FilmyFeed Watch Page Controller
 * Initializes and manages the video player
 */

class WatchPageController {
    constructor() {
        this.movieId = null;
        this.player = null;
        this.startTime = 0;

        this.init();
    }

    init() {
        this.extractParams();
        this.checkBrowserSupport();
        this.initializePlayer();
        this.setupKeyboardShortcuts();
    }

    extractParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.movieId = urlParams.get('id');
        this.startTime = parseInt(urlParams.get('t')) || 0;

        if (!this.movieId) {
            this.showError('Movie ID not found');
            return;
        }
    }

    checkBrowserSupport() {
        // Check for HLS.js support
        if (!window.Hls && !this.canPlayHLS()) {
            this.showUnsupportedBrowser();
            return false;
        }

        return true;
    }

    canPlayHLS() {
        const video = document.createElement('video');
        return video.canPlayType('application/vnd.apple.mpegurl') !== '';
    }

    initializePlayer() {
        if (!this.checkBrowserSupport()) return;

        const container = document.getElementById('video-player-container');
        if (!container) {
            console.error('Player container not found');
            return;
        }

        try {
            // Initialize FilmyFeed Player
            this.player = new FilmyFeedPlayer(container, {
                movieId: this.movieId,
                autoplay: true,
                startTime: this.startTime
            });

            this.hidePageLoading();

            // Track viewing analytics
            this.trackViewStart();

        } catch (error) {
            console.error('Error initializing player:', error);
            this.showError('Failed to initialize video player');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.player || !this.player.video) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.player.togglePlay();
                    break;

                case 'ArrowLeft':
                    e.preventDefault();
                    this.player.seek(this.player.currentTime - 10);
                    break;

                case 'ArrowRight':
                    e.preventDefault();
                    this.player.seek(this.player.currentTime + 10);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.player.adjustVolume(0.1);
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    this.player.adjustVolume(-0.1);
                    break;

                case 'KeyM':
                    e.preventDefault();
                    this.player.toggleMute();
                    break;

                case 'KeyF':
                    e.preventDefault();
                    this.player.toggleFullscreen();
                    break;

                case 'Escape':
                    if (this.player.isFullscreen) {
                        this.player.exitFullscreen();
                    }
                    break;
            }
        });
    }

    trackViewStart() {
        // Analytics tracking
        console.log(`ðŸŽ¬ Started watching movie ${this.movieId}`);

        // Track with analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_start', {
                'movie_id': this.movieId,
                'timestamp': new Date().toISOString()
            });
        }

        // Could also track to your own analytics endpoint
        this.sendAnalytics('video_start', {
            movieId: this.movieId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: `${screen.width}x${screen.height}`
        });
    }

    async sendAnalytics(event, data) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event,
                    data,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    }

    showError(message) {
        document.body.innerHTML = `
            <div class="error-page">
                <div class="error-content">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="window.history.back()" class="btn-primary">Go Back</button>
                </div>
            </div>
        `;
    }

    showUnsupportedBrowser() {
        document.getElementById('unsupported-browser')?.classList.remove('hidden');
        this.hidePageLoading();
    }

    hidePageLoading() {
        document.getElementById('page-loading')?.classList.add('hidden');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸŽ¬ FilmyFeed Watch Page initialized');
    window.watchController = new WatchPageController();
});