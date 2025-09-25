// DOM Elements
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchToggle = document.getElementById('search-toggle');
const searchWrapper = document.getElementById('search-wrapper');
const searchClose = document.getElementById('search-close');
const pageTitle = document.getElementById('page-title');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const noResultsEl = document.getElementById('no-results');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.querySelector('.close');

// State
let currentPage = 1;
let isSearching = false;
let currentQuery = '';
let searchActive = false;

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Collapsible Search Functions
function toggleSearch() {
    if (searchActive) {
        closeSearch();
    } else {
        openSearch();
    }
}

function openSearch() {
    searchActive = true;
    searchWrapper.classList.add('active');

    // Focus on input after animation
    setTimeout(() => {
        searchInput.focus();
    }, 200);
}

function closeSearch() {
    searchActive = false;
    searchWrapper.classList.remove('active');

    // Blur input to hide mobile keyboard
    searchInput.blur();
}

// Search Event Listeners
if (searchToggle) {
    searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSearch();
    });
}

if (searchClose) {
    searchClose.addEventListener('click', (e) => {
        e.preventDefault();
        closeSearch();
    });
}

// Close search on outside click
document.addEventListener('click', (e) => {
    if (searchActive && 
        !e.target.closest('.search-wrapper') && 
        !e.target.closest('.search-toggle')) {
        closeSearch();
    }
});

// Close search on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchActive) {
        closeSearch();
    }
});

// Fetch movies via local proxy
async function fetchMovies(endpoint, params = {}) {
    const url = new URL(`/api/${endpoint}`, window.location.origin);
    Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        showLoading();
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        return data;
    } catch (err) {
        showError('Failed to fetch movies. Please try again later.');
        return null;
    } finally {
        hideLoading();
    }
}

// Render movies grid
function renderMovies(movies) {
    if (!movies || movies.length === 0) {
        noResultsEl.classList.remove('hidden');
        moviesGrid.innerHTML = '';
        return;
    }

    noResultsEl.classList.add('hidden');
    moviesGrid.innerHTML = movies
        .map((movie) => {
            const posterPath = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : '';
            const title = movie.title || 'Untitled';
            const date = movie.release_date || 'N/A';
            const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A';

            return `
                <div class="movie-card" data-id="${movie.id}">
                    ${posterPath 
                        ? `<img class="movie-poster" src="${posterPath}" alt="${escapeHtml(title)} poster" loading="lazy">` 
                        : '<div class="movie-poster" style="display:flex;align-items:center;justify-content:center;color:#666;font-size:0.9rem;">No Poster Available</div>'
                    }
                    <div class="movie-info">
                        <h3 class="movie-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
                        <div class="movie-date">${escapeHtml(date)}</div>
                        <div class="movie-rating">â˜… ${rating}/10</div>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Show movie details in modal
async function showMovieDetail(id) {
    const data = await fetchMovies(`movie/${id}`);
    if (!data) return;

    const poster = data.poster_path 
        ? `<img src="${IMG_BASE}${data.poster_path}" alt="${escapeHtml(data.title)} poster">` 
        : '<div style="background:#333;padding:2rem;text-align:center;color:#666;">No Poster Available</div>';

    const title = data.title || 'Untitled';
    const date = data.release_date || 'N/A';
    const rating = typeof data.vote_average === 'number' ? data.vote_average.toFixed(1) : 'N/A';
    const votes = typeof data.vote_count === 'number' ? data.vote_count : 0;
    const lang = (data.original_language || 'N/A').toUpperCase();
    const overview = data.overview || 'No overview available.';

    modalBody.innerHTML = `
        ${poster}
        <h2 style="margin: 1rem 0;">${escapeHtml(title)}</h2>
        <p><strong>Release Date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Rating:</strong> ${rating}/10 (${votes.toLocaleString()} votes)</p>
        <p><strong>Language:</strong> ${escapeHtml(lang)}</p>
        <p style="margin-top: 1rem;"><strong>Overview:</strong></p>
        <p>${escapeHtml(overview)}</p>
    `;

    modal.classList.remove('hidden');
}

// Event Listeners
if (moviesGrid) {
    moviesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (card) showMovieDetail(card.dataset.id);
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
}

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

function handleSearch() {
    const query = searchInput ? searchInput.value.trim() : '';
    if (!query) {
        loadNowPlaying();
        closeSearch();
        return;
    }

    currentQuery = query;
    isSearching = true;
    currentPage = 1;
    loadSearchResults();
    closeSearch();
}

// Loaders
function loadNowPlaying() {
    isSearching = false;
    if (pageTitle) pageTitle.textContent = 'Now Playing';
    fetchAndRenderNowPlaying();
}

async function fetchAndRenderNowPlaying() {
    const page1 = await fetchMovies('movie/now_playing', { page: 1, language: 'en-US', region: 'IN' });
    const page2 = await fetchMovies('movie/now_playing', { page: 2, language: 'en-US', region: 'IN' });
    const allMovies = [...(page1?.results || []), ...(page2?.results || [])];
    renderMovies(allMovies);
}

async function loadSearchResults() {
    if (pageTitle) pageTitle.textContent = `Search Results for "${currentQuery}"`;
    const data = await fetchMovies('search/movie', { 
        query: currentQuery, 
        page: currentPage, 
        include_adult: false, 
        language: 'en-US' 
    });
    renderMovies(data?.results || []);
}

// UI Helpers
function showLoading() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (noResultsEl) noResultsEl.classList.add('hidden');
}

function hideLoading() {
    if (loadingEl) loadingEl.classList.add('hidden');
}

function showError(message) {
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
    if (loadingEl) loadingEl.classList.add('hidden');
    if (noResultsEl) noResultsEl.classList.add('hidden');
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸŽ¬ FilmyFeed loaded with collapsible search!');
    loadNowPlaying();
});