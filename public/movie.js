const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const movieDetailsEl = document.getElementById('movie-details');

// Utility
function getMovieIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function fetchMovieData(movieId) {
    const url = `/api/movie/${movieId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Expected JSON, got HTML');
    }
    return await res.json();
}

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

async function loadMovie() {
    const movieId = getMovieIdFromUrl();
    if (!movieId) {
        showError('No movie ID provided');
        return;
    }
    showLoading();
    try {
        const movieData = await fetchMovieData(movieId);
        // ... Render logic for your page ...
        showMovieDetails();
        hideLoading();
    } catch (error) {
        showError(`Failed to load: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', loadMovie);
retryBtn.addEventListener('click', loadMovie);