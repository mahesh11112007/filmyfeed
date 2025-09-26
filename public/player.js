/**
 * FilmyFeed Player (Enhanced)
 * CORRECTED version with proper local movie support
 */

class FilmyFeedPlayer {
    constructor(container, opts = {}) {
        this.container = container;
        this.movieId = opts.movieId;
        this.autoplay = !!opts.autoplay;
        this.hls = null;
        this.video = null;
        this.qualities = [];
        this.currentLevel = -1; // -1 = auto
        this.customDownloadUrl = null;
        this.API = '/api';

        this.bind();
    }

    bind() {
        this.container.innerHTML = `
            <div class="ff-player">
                <video id="ff-video" class="ff-video" playsinline webkit-playsinline preload="metadata"></video>
                <div class="ff-ui">
                    <div class="ff-top">
                        <button id="ff-back" class="ff-btn" aria-label="Back">âŸµ</button>
                        <div class="ff-title-wrap">
                            <div id="ff-title" class="ff-title">Loading...</div>
                            <div id="ff-meta" class="ff-meta"></div>
                        </div>
                        <button id="ff-quality" class="ff-btn">AUTO</button>
                    </div>
                    <div class="ff-center">
                        <button id="ff-playbig" class="ff-playbig">â–¶</button>
                    </div>
                    <div class="ff-bottom">
                        <div id="ff-progress" class="ff-progress">
                            <div id="ff-buffer" class="ff-buffer"></div>
                            <div id="ff-played" class="ff-played"></div>
                        </div>
                        <div class="ff-controls">
                            <button id="ff-play" class="ff-btn">â–¶</button>
                            <div class="ff-time"><span id="ff-cur">0:00</span> / <span id="ff-dur">0:00</span></div>
                            <div class="ff-gap"></div>
                            <button id="ff-sub" class="ff-btn">CC</button>
                            <button id="ff-dl" class="ff-btn">â¬‡</button>
                            <button id="ff-full" class="ff-btn">â›¶</button>
                        </div>
                    </div>
                </div>
                <div id="ff-loading" class="ff-loading"><div class="ff-spin"></div><span>Loadingâ€¦</span></div>
                <div id="ff-error" class="ff-error hidden"><span id="ff-errmsg">Playback error</span><button id="ff-retry" class="ff-btn ff-retry">Retry</button></div>
                <div id="ff-qmenu" class="ff-qmenu hidden"></div>
            </div>`;

        this.video = this.container.querySelector('#ff-video');
        this.elements = {
            back: this.container.querySelector('#ff-back'),
            quality: this.container.querySelector('#ff-quality'),
            playbig: this.container.querySelector('#ff-playbig'),
            play: this.container.querySelector('#ff-play'),
            full: this.container.querySelector('#ff-full'),
            dl: this.container.querySelector('#ff-dl'),
            sub: this.container.querySelector('#ff-sub'),
            qmenu: this.container.querySelector('#ff-qmenu'),
            progress: this.container.querySelector('#ff-progress'),
            played: this.container.querySelector('#ff-played'),
            buffer: this.container.querySelector('#ff-buffer'),
            cur: this.container.querySelector('#ff-cur'),
            dur: this.container.querySelector('#ff-dur'),
            title: this.container.querySelector('#ff-title'),
            meta: this.container.querySelector('#ff-meta'),
            loading: this.container.querySelector('#ff-loading'),
            error: this.container.querySelector('#ff-error'),
            errmsg: this.container.querySelector('#ff-errmsg'),
            retry: this.container.querySelector('#ff-retry'),
        };

        this.wireEvents();
    }

    wireEvents() {
        const v = this.video;

        // Video events
        v.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            this.updateDuration();
            this.hide(this.elements.loading);
        });

        v.addEventListener('timeupdate', () => this.updateProgress());
        v.addEventListener('progress', () => this.updateBuffer());
        v.addEventListener('waiting', () => this.show(this.elements.loading));
        v.addEventListener('canplay', () => this.hide(this.elements.loading));

        v.addEventListener('error', (e) => {
            console.error('Video error:', e);
            this.fail('Video error occurred');
        });

        v.addEventListener('play', () => {
            this.elements.play.textContent = 'â¸';
            this.elements.playbig.classList.add('hidden');
        });

        v.addEventListener('pause', () => {
            this.elements.play.textContent = 'â–¶';
            this.elements.playbig.classList.remove('hidden');
        });

        // Control events
        this.elements.play.addEventListener('click', () => this.toggle());
        this.elements.playbig.addEventListener('click', () => this.toggle());
        this.elements.full.addEventListener('click', () => this.fullscreen());
        this.elements.back.addEventListener('click', () => history.back());
        this.elements.retry.addEventListener('click', () => this.reload());

        this.elements.progress.addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            v.currentTime = pct * v.duration;
        });

        this.elements.dl.addEventListener('click', () => this.download());
        this.elements.quality.addEventListener('click', () => this.toggleQMenu());
        this.elements.sub.addEventListener('click', () => this.toggleSubtitles());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
            if (e.code === 'KeyF') { this.fullscreen(); }
            if (e.code === 'ArrowRight') { v.currentTime += 10; }
            if (e.code === 'ArrowLeft') { v.currentTime -= 10; }
            if (e.code === 'KeyM') { v.muted = !v.muted; }
            if (e.code === 'Escape') { if (document.fullscreenElement) document.exitFullscreen(); }
        });
    }

    // CORRECTED: Load local movie from JSON data
    async loadLocalMovie(movieData) {
        try {
            console.log('Loading local movie:', movieData);
            this.show(this.elements.loading);

            // Update UI with movie info
            this.elements.title.textContent = movieData.movie || movieData.title || 'Movie';
            const year = movieData.year || '';
            const language = movieData.language ? movieData.language.toUpperCase() : '';
            const rating = movieData.rating ? `â˜… ${movieData.rating}` : '';
            const metaParts = [year, language, rating].filter(Boolean);
            this.elements.meta.textContent = metaParts.join(' â€¢ ');

            // Store download URL
            if (movieData.download) {
                this.customDownloadUrl = movieData.download;
            }

            // CORRECTED: Load video stream
            if (movieData.watch) {
                await this.attachVideo(movieData.watch);
            } else {
                throw new Error('No watch URL provided');
            }

            if (this.autoplay) {
                this.video.play().catch(console.error);
            }

        } catch (e) {
            console.error('Failed to load local movie:', e);
            this.fail(`Failed to load movie: ${e.message}`);
        }
    }

    // Load TMDb movie
    async load(movieId) {
        this.movieId = movieId;
        try {
            console.log('Loading TMDb movie:', movieId);
            this.show(this.elements.loading);

            // Get movie metadata
            const meta = await fetch(`${this.API}/movie/${movieId}`).then(r => r.json());
            this.elements.title.textContent = meta.title || 'Movie';
            const year = meta.release_date ? new Date(meta.release_date).getFullYear() : '';
            this.elements.meta.textContent = `${year} â€¢ TMDb`;

            const manifest = `${this.API}/stream/${movieId}/manifest.m3u8`;
            await this.attachVideo(manifest);

            if (this.autoplay) {
                this.video.play().catch(console.error);
            }

        } catch (e) {
            console.error('Failed to load TMDb movie:', e);
            this.fail('Failed to load video from server');
        }
    }

    // CORRECTED: Universal video attachment (HLS or direct video)
    async attachVideo(videoUrl) {
        console.log('Attaching video:', videoUrl);
        const v = this.video;

        // Check if it's an HLS stream
        if (videoUrl.includes('.m3u8')) {
            return this.attachHLS(videoUrl);
        } else {
            // Direct video (MP4, WebM, etc.)
            return this.attachDirectVideo(videoUrl);
        }
    }

    async attachHLS(manifestUrl) {
        const v = this.video;

        if (window.Hls?.isSupported()) {
            this.hls?.destroy?.();
            this.hls = new Hls({ 
                enableWorker: true, 
                lowLatencyMode: false,
                backBufferLength: 90 
            });

            this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                console.log('ðŸŽ¬ HLS manifest loaded, qualities:', data.levels.length);
                this.qualities = data.levels.map((lv, i) => ({
                    i, 
                    label: this.qLabel(lv.height), 
                    height: lv.height
                }));
                this.renderQMenu();
            });

            this.hls.on(Hls.Events.ERROR, (_, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    this.fail(`HLS error: ${data.details}`);
                }
            });

            this.hls.loadSource(manifestUrl);
            this.hls.attachMedia(v);

        } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            v.src = manifestUrl;

        } else {
            this.fail('HLS not supported in this browser');
        }
    }

    async attachDirectVideo(videoUrl) {
        console.log('Attaching direct video:', videoUrl);
        const v = this.video;

        try {
            v.src = videoUrl;

            // Hide quality menu for direct video
            this.elements.quality.style.display = 'none';

            return new Promise((resolve, reject) => {
                v.addEventListener('loadedmetadata', resolve, { once: true });
                v.addEventListener('error', reject, { once: true });
            });

        } catch (error) {
            console.error('Error loading direct video:', error);
            this.fail(`Failed to load video: ${error.message}`);
        }
    }

    renderQMenu() {
        const q = this.elements.qmenu;
        q.innerHTML = '';

        // Auto quality option
        const autoBtn = document.createElement('button');
        autoBtn.className = 'ff-qitem active';
        autoBtn.textContent = 'AUTO';
        autoBtn.onclick = () => this.setQuality(-1, 'AUTO');
        q.appendChild(autoBtn);

        // Manual quality options
        this.qualities.forEach(l => {
            const b = document.createElement('button');
            b.className = 'ff-qitem';
            b.textContent = l.label;
            b.onclick = () => this.setQuality(l.i, l.label);
            q.appendChild(b);
        });
    }

    setQuality(level, label) {
        this.currentLevel = level;
        if (this.hls) {
            this.hls.currentLevel = level; // -1 for auto
        }
        this.elements.quality.textContent = label;
        this.hide(this.elements.qmenu);

        // Update active state
        this.elements.qmenu.querySelectorAll('.ff-qitem').forEach((item, i) => {
            item.classList.toggle('active', 
                (level === -1 && i === 0) || 
                (level !== -1 && i === level + 1)
            );
        });
    }

    toggleQMenu() {
        this.elements.qmenu.classList.toggle('hidden');
    }

    toggle() {
        if (this.video.paused) { 
            this.video.play().catch(console.error); 
        } else { 
            this.video.pause(); 
        }
    }

    fullscreen() {
        const el = this.container;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            el.requestFullscreen?.() || 
            el.webkitRequestFullscreen?.() || 
            el.mozRequestFullScreen?.();
        }
    }

    updateDuration() { 
        this.elements.dur.textContent = this.fmt(this.video.duration); 
    }

    updateProgress() {
        const v = this.video;
        if (!v.duration) return;
        const pct = (v.currentTime / v.duration) * 100;
        this.elements.played.style.width = pct + '%';
        this.elements.cur.textContent = this.fmt(v.currentTime);
    }

    updateBuffer() {
        const v = this.video; 
        if (!v.buffered || v.buffered.length === 0 || !v.duration) return;
        const end = v.buffered.end(v.buffered.length - 1);
        const pct = (end / v.duration) * 100;
        this.elements.buffer.style.width = pct + '%';
    }

    download() {
        if (this.customDownloadUrl) {
            // Use local movie download URL
            window.open(this.customDownloadUrl, '_blank');
        } else if (this.movieId) {
            // Use TMDb download endpoint
            window.open(`${this.API}/download/${this.movieId}?quality=1080p`, '_blank');
        } else {
            console.log('No download URL available');
        }
    }

    toggleSubtitles() {
        // Basic subtitle toggle - add <track> element if available
        const existing = this.video.querySelector('track');
        if (existing) { 
            existing.remove(); 
            this.elements.sub.style.opacity = '0.6';
            return; 
        }

        const track = document.createElement('track');
        track.kind = 'subtitles'; 
        track.label = 'English'; 
        track.srclang = 'en';
        track.src = `/subtitles/${this.movieId}.vtt`;
        track.default = true;
        this.video.appendChild(track);
        this.elements.sub.style.opacity = '1';
    }

    reload() { 
        console.log('Reloading player');
        this.hide(this.elements.error);
        this.show(this.elements.loading);

        // Reload the current source
        if (this.video.src) {
            this.video.load();
        }
    }

    // Utility functions
    fmt(s) { 
        if (!isFinite(s)) return '0:00'; 
        const m = Math.floor(s/60); 
        const sec = Math.floor(s%60); 
        return `${m}:${String(sec).padStart(2,'0')}`; 
    }

    qLabel(h) { 
        if (h >= 2160) return '4K'; 
        if (h >= 1080) return '1080p'; 
        if (h >= 720) return '720p'; 
        if (h >= 480) return '480p'; 
        return 'AUTO'; 
    }

    show(el) { 
        el?.classList?.remove('hidden'); 
    }

    hide(el) { 
        el?.classList?.add('hidden'); 
    }

    fail(msg) { 
        console.error('Player failed:', msg);
        this.elements.errmsg.textContent = msg; 
        this.show(this.elements.error); 
        this.hide(this.elements.loading); 
    }
}

window.FilmyFeedPlayer = FilmyFeedPlayer;