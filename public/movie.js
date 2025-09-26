// Movie page JavaScript - WORKING VERSION

console.log('Movie script loaded');

// Get elements
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
const castGridEl = document.getElementById('cast-grid');

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

function getMovieIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

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

async function fetchMovieData(movieId) {
    console.log('Fetching movie data for ID:', movieId);
    
    try {
        const response = await fetch(`/api/movie?id=${movieId}`);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'API returned error');
        }
        
        return result.data;
    } catch (error) {
        console.error('Fetch error:', error);
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

function renderMovieDetails(movie) {
    console.log('Rendering movie:', movie.title);
    
    // Basic info
    movieTitleEl.textContent = movie.title || 'Unknown Title';
    movieTaglineEl.textContent = movie.tagline || '';
    
    // Poster
    if (movie.poster_path) {
        moviePosterEl.src = IMG_BASE + movie.poster_path;
        moviePosterEl.alt = movie.title + ' Poster';
    }
    
    // Meta info
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    movieYearEl.textContent = year;
    
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
    movieRuntimeEl.textContent = runtime;
    
    const rating = movie.vote_average ? `⭐ ${movie.vote_average.toFixed(1)}` : 'N/A';
    movieRatingEl.textContent = rating;
    
    // Genres
    if (movie.genres && movie.genres.length > 0) {
        movieGenresEl.innerHTML = movie.genres
            .map(g => `<span style="background: var(--accent); color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem;">${g.name}</span>`)
            .join('');
    }
    
    // Overview
    movieDescriptionEl.textContent = movie.overview || 'No overview available.';
    
    // Stats
    voteAverageEl.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    voteCountEl.textContent = movie.vote_count ? movie.vote_count.toLocaleString() : 'N/A';
    
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
                    `<img src="${photoUrl}" alt="${person.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 0.5rem;">` :
                    '<div style="width: 100%; height: 150px; background: #333; border-radius: 5px; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; color: #666;">No Photo</div>'
                }
                <div style="font-weight: bold; font-size: 0.9rem;">${person.name}</div>
                <div style="color: #aaa; font-size: 0.8rem;">${person.character || 'Unknown'}</div>
            </div>
        `;
    }).join('');
}

async function loadMovie() {
    const movieId = getMovieIdFromUrl();
    
    console.log('Loading movie with ID:', movieId);
    
    if (!movieId) {
        showError('No movie ID found in URL');
        return;
    }
    
    showLoading();
    
    try {
        // Fetch movie data
        const movieData = await fetchMovieData(movieId);
        console.log('Got movie data:', movieData);
        
        // Fetch credits (optional)
        const creditsData = await fetchCredits(movieId);
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