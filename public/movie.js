// Movie Details Page JavaScript

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const movieDetailsEl = document.getElementById('movie-details');

// Movie elements
const moviePosterEl = document.getElementById('movie-poster');
const movieTitleEl = document.getElementById('movie-title');
const movieTaglineEl = document.getElementById('movie-tagline');
const movieYearEl = document.getElementById('movie-year');
const movieRuntimeEl = document.getElementById('movie-runtime');
const movieRatingEl = document.getElementById('movie-rating');
const movieGenresEl = document.getElementById('movie-genres');
const movieDescriptionEl = document.getElementById('movie-description');
const voteAverageEl = document.getElementById('vote-average');
const voteCountEl = document.getElementById('vote-count');
const movieBudgetEl = document.getElementById('movie-budget');
const movieRevenueEl = document.getElementById('movie-revenue');
const castGridEl = document.getElementById('cast-grid');
const crewListEl = document.getElementById('crew-list');

// Trailer elements
const playBtn = document.getElementById('play-btn');
const trailerModal = document.getElementById('trailer-modal');
const trailerIframe = document.getElementById('trailer-iframe');
const closeModalBtn = document.querySelector('.close-modal');

// Constants
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// State
let currentMovieId = null;
let movieData = null;

// Utility Functions
function getMovieIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
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

async function fetchMovieCredits(movieId) {
    const url = new URL(`/api/movie/${movieId}/credits`, window.location.origin);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
        throw new Error(`Failed to fetch movie credits: ${response.statusText}`);
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
    movieDetailsEl.classList.add('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    movieDetailsEl.classList.add('hidden');
}

function showMovieDetails() {
    movieDetailsEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    loadingEl.classList.add('hidden');
}

// Render Functions
function renderMovieDetails(data) {
    movieData = data;
    
    // Basic movie info
    movieTitleEl.textContent = data.title || 'Untitled';
    movieTaglineEl.textContent = data.tagline || '';
    movieTaglineEl.style.display = data.tagline ? 'block' : 'none';
    
    // Poster
    if (data.poster_path) {
        moviePosterEl.src = `${IMG_BASE}${data.poster_path}`;
        moviePosterEl.alt = `${data.title} Poster`;
    } else {
        moviePosterEl.src = '';
        moviePosterEl.alt = 'No poster available';
        moviePosterEl.style.display = 'none';
    }
    
    // Meta information
    const releaseYear = data.release_date ? new Date(data.release_date).getFullYear() : 'N/A';
    movieYearEl.textContent = releaseYear;
    
    movieRuntimeEl.textContent = formatRuntime(data.runtime);
    
    const rating = data.vote_average ? `â­ ${data.vote_average.toFixed(1)}` : 'N/A';
    movieRatingEl.textContent = rating;
    
    // Genres
    if (data.genres && data.genres.length > 0) {
        movieGenresEl.innerHTML = data.genres
            .map(genre => `<span class="genre-tag">${escapeHtml(genre.name)}</span>`)
            .join('');
    } else {
        movieGenresEl.innerHTML = '';
    }
    
    // Overview
    movieDescriptionEl.textContent = data.overview || 'No overview available.';
    
    // Stats
    voteAverageEl.textContent = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
    voteCountEl.textContent = data.vote_count ? data.vote_count.toLocaleString() : 'N/A';
    movieBudgetEl.textContent = formatCurrency(data.budget);
    movieRevenueEl.textContent = formatCurrency(data.revenue);
    
    // Update page title
    document.title = `${data.title} - FilmyFeed`;
}

function renderCast(credits) {
    if (!credits.cast || credits.cast.length === 0) {
        castGridEl.innerHTML = '<p>No cast information available.</p>';
        return;
    }
    
    // Show top 12 cast members
    const topCast = credits.cast.slice(0, 12);
    
    castGridEl.innerHTML = topCast.map(person => {
        const photoUrl = person.profile_path ? `${IMG_BASE}${person.profile_path}` : '';
        return `
            <div class="cast-card">
                ${photoUrl ? 
                    `<img src="${photoUrl}" alt="${escapeHtml(person.name)}" class="cast-photo">` :
                    '<div class="cast-photo" style="background: var(--card-bg); display: flex; align-items: center; justify-content: center; color: #666;">No Photo</div>'
                }
                <div class="cast-info">
                    <div class="cast-name">${escapeHtml(person.name)}</div>
                    <div class="cast-character">${escapeHtml(person.character || 'Unknown Role')}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCrew(credits) {
    if (!credits.crew || credits.crew.length === 0) {
        crewListEl.innerHTML = '<p>No crew information available.</p>';
        return;
    }
    
    // Filter important crew members
    const importantJobs = ['Director', 'Producer', 'Executive Producer', 'Screenplay', 'Story', 'Music', 'Cinematography', 'Editor'];
    const importantCrew = credits.crew.filter(person => 
        importantJobs.some(job => person.job.includes(job))
    ).slice(0, 20);
    
    crewListEl.innerHTML = importantCrew.map(person => `
        <div class="crew-item">
            <span class="crew-name">${escapeHtml(person.name)}</span>
            <span class="crew-job">${escapeHtml(person.job)}</span>
        </div>
    `).join('');
}

// Trailer Functions
async function loadTrailer() {
    try {
        const videos = await fetchMovieVideos(currentMovieId);
        const trailer = videos.results.find(video => 
            video.type === 'Trailer' && video.site === 'YouTube'
        );
        
        if (trailer) {
            const embedUrl = `https://www.youtube.com/embed/${trailer.key}`;
            trailerIframe.src = embedUrl;
            trailerModal.classList.remove('hidden');
        } else {
            alert('No trailer available for this movie.');
        }
    } catch (error) {
        console.error('Error loading trailer:', error);
        alert('Failed to load trailer.');
    }
}

function closeTrailer() {
    trailerModal.classList.add('hidden');
    trailerIframe.src = '';
}

// Main Load Function
async function loadMovie() {
    currentMovieId = getMovieIdFromUrl();
    
    if (!currentMovieId) {
        showError('No movie ID provided in the URL.');
        return;
    }
    
    showLoading();
    
    try {
        // Fetch movie data and credits in parallel
        const [movieData, creditsData] = await Promise.all([
            fetchMovieData(currentMovieId),
            fetchMovieCredits(currentMovieId)
        ]);
        
        renderMovieDetails(movieData);
        renderCast(creditsData);
        renderCrew(creditsData);
        
        showMovieDetails();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading movie:', error);
        showError('Failed to load movie details. Please try again later.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadMovie);

retryBtn.addEventListener('click', loadMovie);

playBtn.addEventListener('click', loadTrailer);

closeModalBtn.addEventListener('click', closeTrailer);

trailerModal.addEventListener('click', (e) => {
    if (e.target === trailerModal) {
        closeTrailer();
    }
});

// Handle escape key to close trailer
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !trailerModal.classList.contains('hidden')) {
        closeTrailer();
    }
});