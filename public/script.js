// Main Page JavaScript - Fixed for Vercel API

console.log('Main script loaded');

// DOM Elements
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const pageTitle = document.getElementById('page-title');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const noResultsEl = document.getElementById('no-results');

// State
let currentPage = 1;
let isSearching = false;
let currentQuery = '';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Fetch movies via API
async function fetchMovies(endpoint, params = {}) {
    const url = new URL(`/api/${endpoint}`, window.location.origin);
    
    Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        showLoading();
        console.log('Fetching from:', url.toString());
        
        const res = await fetch(url.toString());
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const result = await res.json();
        console.log('API Response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'API returned error');
        }
        
        return result.data;
    } catch (err) {
        console.error('Fetch error:', err);
        showError(`Failed to fetch movies: ${err.message}`);
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
            const posterPath = movie.poster_path 
                ? `${IMG_BASE}${movie.poster_path}` 
                : '';
            const title = movie.title || 'Untitled';
            const date = movie.release_date || 'N/A';
            const rating = typeof movie.vote_average === 'number' 
                ? movie.vote_average.toFixed(1) 
                : 'N/A';

            return `
                <div class="movie-card" data-id="${movie.id}" role="button" tabindex="0">
                    ${posterPath ? 
                        `<img src="${posterPath}" alt="${escapeHtml(title)}" class="movie-poster" loading="lazy">` :
                        '<div class="movie-poster no-poster">No poster available</div>'
                    }
                    <div class="movie-info">
                        <h3 class="movie-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
                        <div class="movie-date">${escapeHtml(date)}</div>
                        <div class="movie-rating">⭐ ${rating}</div>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Handle URL parameters for search
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
        searchInput.value = query;
        currentQuery = query;
        isSearching = true;
        loadSearchResults();
    } else {
        loadNowPlaying();
    }
}

// Update URL without page reload
function updateUrl(query = '') {
    const url = new URL(window.location);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
}

// Event Listeners
moviesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (card) {
        const movieId = card.dataset.id;
        window.location.href = `/movie.html?id=${movieId}`;
    }
});

moviesGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.movie-card');
        if (card) {
            e.preventDefault();
            const movieId = card.dataset.id;
            window.location.href = `/movie.html?id=${movieId}`;
        }
    }
});

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

window.addEventListener('popstate', handleUrlParams);

function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        currentQuery = '';
        isSearching = false;
        updateUrl();
        loadNowPlaying();
        return;
    }

    currentQuery = query;
    isSearching = true;
    currentPage = 1;
    updateUrl(query);
    loadSearchResults();
}

function loadNowPlaying() {
    isSearching = false;
    pageTitle.textContent = 'Now Playing';
    fetchAndRenderNowPlaying();
}

async function fetchAndRenderNowPlaying() {
    const [page1, page2] = await Promise.all([
        fetchMovies('nowplaying', { page: 1 }),
        fetchMovies('nowplaying', { page: 2 })
    ]);

    const allMovies = [
        ...(page1?.results || []), 
        ...(page2?.results || [])
    ];

    renderMovies(allMovies);
}

async function loadSearchResults() {
    pageTitle.textContent = `Search Results for "${currentQuery}"`;
    
    const data = await fetchMovies('search', {
        query: currentQuery,
        page: currentPage
    });

    renderMovies(data?.results || []);
}

// UI Helpers
function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    noResultsEl.classList.add('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    console.error('Error:', message);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    noResultsEl.classList.add('hidden');
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// Add styles for no-poster placeholder
const style = document.createElement('style');
style.textContent = `
    .movie-poster.no-poster {
        width: 100%;
        height: 270px;
        background: var(--card-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 0.9rem;
        text-align: center;
        padding: 1rem;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    handleUrlParams();
});