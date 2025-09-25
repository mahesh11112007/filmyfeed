// DOM Elements
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
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

// Fetch movies
async function fetchMovies(endpoint, params = {}) {
  const url = new URL(`http://localhost:3000/api${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    showLoading();
    const res = await fetch(url);
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
    return;
  }
  noResultsEl.classList.add('hidden');
  moviesGrid.innerHTML = movies.map(movie => `
    <div class="movie-card" data-id="${movie.id}">
      <img class="movie-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" />
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-date">${movie.release_date || 'N/A'}</div>
        <div class="movie-rating">⭐ ${movie.vote_average.toFixed(1)} (${movie.vote_count})</div>
      </div>
    </div>
  `).join('');
}

// Show movie detail modal
async function showMovieDetail(id) {
  const data = await fetchMovies(`/movie/${id}`);
  if (!data) return;

  const poster = data.poster_path
    ? `<img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.title}" />`
    : '<p>No poster available</p>';

  modalBody.innerHTML = `
    ${poster}
    <h2>${data.title}</h2>
    <p><strong>Release Date:</strong> ${data.release_date || 'N/A'}</p>
    <p><strong>Rating:</strong> ⭐ ${data.vote_average.toFixed(1)} (${data.vote_count} votes)</p>
    <p><strong>Language:</strong> ${data.original_language.toUpperCase()}</p>
    <p><strong>Overview:</strong> ${data.overview || 'No overview available.'}</p>
  `;
  modal.classList.remove('hidden');
}

// Event Listeners
moviesGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.movie-card');
  if (card) showMovieDetail(card.dataset.id);
});

closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    loadNowPlaying();
    return;
  }
  currentQuery = query;
  isSearching = true;
  currentPage = 1;
  loadSearchResults();
}

// Loaders
function loadNowPlaying() {
  isSearching = false;
  pageTitle.textContent = 'Now Playing';
  fetchAndRenderNowPlaying();
}

async function fetchAndRenderNowPlaying() {
  const page1 = await fetchMovies('/movie/now_playing', { page: 1 });
  const page2 = await fetchMovies('/movie/now_playing', { page: 2 });

  const allMovies = [...(page1?.results || []), ...(page2?.results || [])];
  renderMovies(allMovies);
}

async function loadSearchResults() {
  pageTitle.textContent = `Search Results for "${currentQuery}"`;
  const data = await fetchMovies('/search/movie', { query: currentQuery, page: currentPage });
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
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  loadingEl.classList.add('hidden');
  noResultsEl.classList.add('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', loadNowPlaying);