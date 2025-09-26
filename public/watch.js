// Watch Page JavaScript

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const backToMovieBtn = document.getElementById('back-to-movie');
const backBtn = document.getElementById('back-btn');

// Video elements
const videoPlayer = document.getElementById('video-player');
const videoIframe = document.getElementById('video-iframe');
const videoOverlay = document.getElementById('video-overlay');
const playButton = document.getElementById('play-button');

// Movie info elements
const movieTitleEl = document.getElementById('movie-title');
const movieYearEl = document.getElementById('movie-year');
const movieRatingEl = document.getElementById('movie-rating');
const movieRuntimeEl = document.getElementById('movie-runtime');
const movieDescriptionEl = document.getElementById('movie-description');

// Streaming options
const streamingOptions = document.getElementById('streaming-options');

// Quality modal
const qualityModal = document.getElementById('quality-modal');
const qualityBtns = document.querySelectorAll('.quality-btn');
const closeModalBtn = document.querySelector('.close-modal');

// State
let currentMovieId = null;
let movieData = null;

// Utility Functions
function getMovieIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Navigation Functions
function goBackToMovie() {
    if (currentMovieId) {
        window.location.href = `/movie.html?id=${currentMovieId}`;
    } else {
        window.location.href = '/';
    }
}

function goHome() {
    window.location.href = '/';
}

// API Functions
async function fetchMovieData(movieId) {
    const url = new URL(`/api/movie/${movieId}`, window.location.origin);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
        throw new Error(`Failed to fetch movie data: ${response.statusText}`);
    }
    
    return await response.json();
}

async function fetchMovieVideos(movieId) {
    try {
        const url = new URL(`/api/movie/${movieId}/videos`, window.location.origin);
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            return { results: [] };
        }
        
        return await response.json();
    } catch (error) {
        console.warn('Failed to fetch videos:', error);
        return { results: [] };
    }
}

// UI Functions
function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    videoPlayer.classList.add('hidden');
    streamingOptions.classList.add('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    videoPlayer.classList.add('hidden');
    streamingOptions.classList.remove('hidden');
}

function showVideoPlayer() {
    videoPlayer.classList.remove('hidden');
    errorEl.classList.add('hidden');
    loadingEl.classList.add('hidden');
}

// Video Functions
async function loadVideo() {
    try {
        const videos = await fetchMovieVideos(currentMovieId);
        
        // Look for trailers, teasers, or clips
        const availableVideos = videos.results.filter(video => 
            video.site === 'YouTube' && 
            ['Trailer', 'Teaser', 'Clip', 'Behind the Scenes'].includes(video.type)
        );
        
        if (availableVideos.length > 0) {
            // Prefer trailers, then teasers, then clips
            const video = availableVideos.find(v => v.type === 'Trailer') ||
                         availableVideos.find(v => v.type === 'Teaser') ||
                         availableVideos[0];
            
            loadVideoPlayer(video);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error loading video:', error);
        return false;
    }
}

function loadVideoPlayer(video) {
    const embedUrl = `https://www.youtube.com/embed/${video.key}?autoplay=0&controls=1&rel=0`;
    videoIframe.src = embedUrl;
    
    showVideoPlayer();
    hideLoading();
}

function playVideo() {
    if (videoIframe.src) {
        // Add autoplay parameter
        const currentSrc = videoIframe.src;
        if (!currentSrc.includes('autoplay=1')) {
            videoIframe.src = currentSrc.replace('autoplay=0', 'autoplay=1');
        }
        
        // Hide overlay
        videoOverlay.classList.add('hidden');
    }
}

// Movie Info Functions
function renderMovieInfo(data) {
    movieData = data;
    
    movieTitleEl.textContent = data.title || 'Unknown Title';
    
    const releaseYear = data.release_date ? new Date(data.release_date).getFullYear() : 'N/A';
    movieYearEl.textContent = releaseYear;
    
    const rating = data.vote_average ? `â­ ${data.vote_average.toFixed(1)}` : 'N/A';
    movieRatingEl.textContent = rating;
    
    movieRuntimeEl.textContent = formatRuntime(data.runtime);
    
    movieDescriptionEl.textContent = data.overview || 'No description available.';
    
    // Update page title
    document.title = `Watch ${data.title} - FilmyFeed`;
}

// Main Load Function
async function loadWatchPage() {
    currentMovieId = getMovieIdFromUrl();
    
    if (!currentMovieId) {
        showError('No movie ID provided in the URL.');
        return;
    }
    
    showLoading();
    
    try {
        // Fetch movie data
        const movieData = await fetchMovieData(currentMovieId);
        renderMovieInfo(movieData);
        
        // Try to load video
        const hasVideo = await loadVideo();
        
        if (!hasVideo) {
            showError('This movie is not available for streaming yet. Check the streaming platforms below.');
        }
        
    } catch (error) {
        console.error('Error loading watch page:', error);
        showError('Failed to load movie. Please try again later.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadWatchPage);

retryBtn.addEventListener('click', loadWatchPage);

backToMovieBtn.addEventListener('click', goBackToMovie);

backBtn.addEventListener('click', goBackToMovie);

playButton.addEventListener('click', playVideo);

videoOverlay.addEventListener('click', playVideo);

// Quality selector
qualityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const quality = btn.dataset.quality;
        // In a real implementation, this would switch video quality
        console.log('Selected quality:', quality);
        qualityModal.classList.add('hidden');
    });
});

closeModalBtn.addEventListener('click', () => {
    qualityModal.classList.add('hidden');
});

qualityModal.addEventListener('click', (e) => {
    if (e.target === qualityModal) {
        qualityModal.classList.add('hidden');
    }
});

// Handle escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!qualityModal.classList.contains('hidden')) {
            qualityModal.classList.add('hidden');
        }
    }
});

// Handle browser back button
window.addEventListener('popstate', () => {
    // User pressed back button
    goBackToMovie();
});