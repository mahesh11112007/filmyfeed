// Movie Details Page JavaScript - Working Version

console.log('Movie script loaded');

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

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

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

// UI Functions
function showLoading() {
    console.log('Showing loading...');
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    movieDetailsEl.classList.add('hidden');
}

function hideLoading() {
    console.log('Hiding loading...');
    loadingEl.classList.add('hidden');
}

function showError(message) {
    console.log('Showing error:', message);
    errorMessageEl.textContent = message;
    errorEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    movieDetailsEl.classList.add('hidden');
}

function showMovieDetails() {
    console.log('Showing movie details...');
    movieDetailsEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    loadingEl.classList.add('hidden');
}

// API Functions
async function fetchMovieData(movieId) {
    console.log('Fetching movie data for ID:', movieId);
    
    try {
        const response = await fetch(`/api/movie?id=${movieId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Movie API Response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'API returned error');
        }
        
        return result.data;
    } catch (error) {
        console.error('Fetch movie error:', error);
        throw error;
    }
}

async function fetchCredits(movieId) {
    try {
        const response = await fetch(`/api/credits?id=${movieId}`);
        
        if (!response.ok) {
            return { cast: [], crew: [] };
        }
        
        const result = await response.json();
        return result.success ? result.data : { cast: [], crew: [] };
    } catch (error) {
        console.warn('Credits fetch failed:', error);
        return { cast: [], crew: [] };
    }
}

// Render Functions
function renderMovieDetails(movie) {
    console.log('Rendering movie:', movie.title);
    
    // Basic info
    movieTitleEl.textContent = movie.title || 'Unknown Title';
    movieTaglineEl.textContent = movie.tagline || '';
    movieTaglineEl.style.display = movie.tagline ? 'block' : 'none';
    
    // Poster
    if (movie.poster_path) {
        moviePosterEl.src = IMG_BASE + movie.poster_path;
        moviePosterEl.alt = movie.title + ' Poster';
    } else {
        moviePosterEl.style.display = 'none';
    }
    
    // Meta info
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    movieYearEl.textContent = year;
    
    movieRuntimeEl.textContent = formatRuntime(movie.runtime);
    
    const rating = movie.vote_average ? `⭐ ${movie.vote_average.toFixed(1)}` : 'N/A';
    movieRatingEl.textContent = rating;
    
    // Genres
    if (movie.genres && movie.genres.length > 0) {
        movieGenresEl.innerHTML = movie.genres
            .map(g => `<span class="genre-tag">${escapeHtml(g.name)}</span>`)
            .join('');
    }
    
    // Overview
    movieDescriptionEl.textContent = movie.overview || 'No overview available.';
    
    // Stats
    voteAverageEl.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    voteCountEl.textContent = movie.vote_count ? movie.vote_count.toLocaleString() : 'N/A';
    movieBudgetEl.textContent = formatCurrency(movie.budget);
    movieRevenueEl.textContent = formatCurrency(movie.revenue);
    
    // Update title
    document.title = `${movie.title} - FilmyFeed`;
}

function renderCast(credits) {
    if (!credits.cast || credits.cast.length === 0) {
        castGridEl.innerHTML = '<p>No cast information available.</p>';
        return;
    }
    
    const topCast = credits.cast.slice(0, 12);
    
    castGridEl.innerHTML = topCast.map(person => {
        const photoUrl = person.profile_path ? IMG_BASE + person.profile_path : '';
        return `
            <div class="cast-card">
                ${photoUrl ? 
                    `<img src="${photoUrl}" alt="${escapeHtml(person.name)}" class="cast-photo">` :
                    '<div class="cast-photo" style="background: #333; display: flex; align-items: center; justify-content: center; color: #666;">No Photo</div>'
                }
                <div class="cast-name">${escapeHtml(person.name)}</div>
                <div class="cast-character">${escapeHtml(person.character || 'Unknown Role')}</div>
            </div>
        `;
    }).join('');
}

// Main Load Function
async function loadMovie() {
    const movieId = getMovieIdFromUrl();
    
    console.log('Loading movie with ID:', movieId);
    
    if (!movieId) {
        showError('No movie ID found in URL');
        return;
    }
    
    showLoading();
    
    try {
        // Fetch movie data and credits
        console.log('Fetching movie data and credits...');
        const [movieData, creditsData] = await Promise.all([
            fetchMovieData(movieId),
            fetchCredits(movieId)
        ]);
        
        console.log('Got movie data:', movieData);
        console.log('Got credits data:', creditsData);
        
        // Render everything
        renderMovieDetails(movieData);
        renderCast(creditsData);
        
        showMovieDetails();
        
    } catch (error) {
        console.error('Load movie error:', error);
        showError(`Failed to load movie: ${error.message}`);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting movie load...');
    loadMovie();
});

retryBtn.addEventListener('click', () => {
    console.log('Retry button clicked');
    loadMovie();
});

console.log('Movie script setup complete');