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

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

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
      const votes = typeof movie.vote_count === 'number' ? movie.vote_count : 0;

      return `
        <div class="movie-card" data-id="${movie.id}">
          <img class="movie-poster" src="${posterPath}" alt="${escapeHtml(title)}" loading="lazy" />
          <div class="movie-info">
            <div class="movie-title">${escapeHtml(title)}</div>
            <div class="movie-date">${escapeHtml(date)}</div>
            <div class="movie-rating">${rating} (${votes})</div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Show movie detail modal
async function showMovieDetail(id) {
  const data = await fetchMovies(`movie/${id}`, { language: 'en-US' });
  if (!data) return;

  const poster = data.poster_path
    ? `<img src="${IMG_BASE}${data.poster_path}" alt="${escapeHtml(data.title || 'Poster')}" />`
    : `<p>No poster available</p>`;

  const title = data.title || 'Untitled';
  const date = data.release_date || 'N/A';
  const rating =
    typeof data.vote_average === 'number' ? data.vote_average.toFixed(1) : 'N/A';
  const votes = typeof data.vote_count === 'number' ? data.vote_count : 0;
  const lang = (data.original_language || 'NA').toUpperCase();
  const overview = data.overview || 'No overview available.';

  modalBody.innerHTML = `
    ${poster}
    <h2 id="modal-title">${escapeHtml(title)}</h2>
    <p><strong>Release Date</strong>: ${escapeHtml(date)}</p>
    <p><strong>Rating</strong>: ${rating} (${votes} votes)</p>
    <p><strong>Language</strong>: ${escapeHtml(lang)}</p>
    <p><strong>Overview</strong>: ${escapeHtml(overview)}</p>
  `;
  modal.classList.remove('hidden');
}

// Event Listeners
moviesGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.movie-card');
  if (card) showMovieDetail(card.dataset.id);
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
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
  const page1 = await fetchMovies('movie/now_playing', { page: 1, language: 'en-US', region: 'IN' });
  const page2 = await fetchMovies('movie/now_playing', { page: 2, language: 'en-US', region: 'IN' });
  const allMovies = [...(page1?.results || []), ...(page2?.results || [])];
  renderMovies(allMovies);
}

async function loadSearchResults() {
  pageTitle.textContent = `Search Results for "${currentQuery}"`;
  const data = await fetchMovies('search/movie', { query: currentQuery, page: currentPage, include_adult: false, language: 'en-US' });
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

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Initialize
document.addEventListener('DOMContentLoaded', loadNowPlaying);