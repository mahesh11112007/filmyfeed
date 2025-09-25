// TMDb API Configuration
const API_KEY = 'API_KEY';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const moviesGrid = document.getElementById('moviesGrid');
const movieModal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.getElementById('modalOverlay');
const searchInput = document.getElementById('movieSearch');
const searchBtn = document.getElementById('searchBtn');
const loadingState = document.getElementById('loadingState');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');

// Application State
let currentMovies = [];
let isSearchMode = false;
let currentSearchQuery = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    loadNowPlayingMovies();
}

function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Clear search when input is empty
    searchInput.addEventListener('input', function() {
        if (this.value.trim() === '' && isSearchMode) {
            isSearchMode = false;
            currentSearchQuery = '';
            loadNowPlayingMovies();
        }
    });

    // Modal event listeners
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !movieModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Retry button
    retryBtn.addEventListener('click', function() {
        if (isSearchMode) {
            searchMovies(currentSearchQuery);
        } else {
            loadNowPlayingMovies();
        }
    });
}

async function loadNowPlayingMovies() {
    try {
        showLoading();
        
        // Load pages 1 and 2 of now playing movies
        const [page1Response, page2Response] = await Promise.all([
            fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=1`),
            fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=2`)
        ]);

        if (!page1Response.ok || !page2Response.ok) {
            throw new Error('Failed to fetch movies from TMDb API');
        }

        const page1Data = await page1Response.json();
        const page2Data = await page2Response.json();

        // Combine results from both pages
        const allMovies = [...page1Data.results, ...page2Data.results];
        
        if (allMovies.length === 0) {
            showEmptyState();
        } else {
            currentMovies = allMovies;
            displayMovies(allMovies);
            hideAllStates();
        }
    } catch (error) {
        console.error('Error loading now playing movies:', error);
        showError('Failed to load latest movies. Please check your API key and try again.');
    }
}

async function searchMovies(query) {
    if (!query.trim()) return;
    
    try {
        showLoading();
        currentSearchQuery = query;
        isSearchMode = true;

        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`);
        
        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const data = await response.json();
        
        if (data.results.length === 0) {
            showEmptyState();
        } else {
            currentMovies = data.results;
            displayMovies(data.results);
            hideAllStates();
        }
    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Failed to search movies. Please check your API key and try again.');
    }
}

function displayMovies(movies) {
    moviesGrid.innerHTML = '';
    
    movies.forEach((movie, index) => {
        const movieCard = createMovieCard(movie, index);
        moviesGrid.appendChild(movieCard);
    });
}

function createMovieCard(movie, index) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${movie.title}`);
    
    // Animation delay for staggered effect
    card.style.animationDelay = `${index * 0.1}s`;

    const posterUrl = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}` 
        : null;

    const releaseDate = movie.release_date 
        ? new Date(movie.release_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : 'Release date unknown';

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
        ${posterUrl 
            ? `<img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster" loading="lazy">` 
            : `<div class="movie-poster movie-poster--placeholder">No Image Available</div>`
        }
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-date">${releaseDate}</span>
                <div class="movie-rating">
                    <svg class="rating-star" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>${rating}</span>
                </div>
            </div>
        </div>
    `;

    // Add click and keyboard event listeners
    card.addEventListener('click', () => openMovieModal(movie));
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openMovieModal(movie);
        }
    });

    return card;
}

async function openMovieModal(movie) {
    try {
        // Show basic movie info immediately
        displayMovieModal(movie);
        showModal();

        // Fetch detailed movie information
        const response = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=en-US`);
        
        if (response.ok) {
            const detailedMovie = await response.json();
            displayMovieModal(detailedMovie);
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        // Still show the modal with basic info if detailed fetch fails
        displayMovieModal(movie);
        showModal();
    }
}

function displayMovieModal(movie) {
    const posterUrl = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}` 
        : null;

    const releaseDate = movie.release_date 
        ? new Date(movie.release_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        : 'Unknown';

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const voteCount = movie.vote_count || 0;
    const originalLanguage = movie.original_language ? movie.original_language.toUpperCase() : 'Unknown';
    const overview = movie.overview || 'No plot summary available.';
    const runtime = movie.runtime ? `${movie.runtime} minutes` : 'Unknown';

    modalBody.innerHTML = `
        <div class="modal-movie">
            <div class="modal-movie__poster-container">
                ${posterUrl 
                    ? `<img src="${posterUrl}" alt="${movie.title} poster" class="modal-movie__poster">` 
                    : `<div class="modal-movie__poster--placeholder">No Image Available</div>`
                }
            </div>
            <div class="modal-movie__info">
                <h2 class="modal-movie__title">${movie.title}</h2>
                <div class="modal-movie__meta">
                    <div class="meta-item">
                        <span class="meta-label">Release Date</span>
                        <span class="meta-value">${releaseDate}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Rating</span>
                        <div class="rating-display">
                            <svg class="rating-star" viewBox="0 0 24 24" width="18" height="18">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span class="meta-value">${rating}/10 (${voteCount.toLocaleString()} votes)</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Language</span>
                        <span class="meta-value">${originalLanguage}</span>
                    </div>
                    ${movie.runtime ? `
                        <div class="meta-item">
                            <span class="meta-label">Runtime</span>
                            <span class="meta-value">${runtime}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-movie__overview">
                    <h3 class="overview-title">Plot Summary</h3>
                    <p class="overview-text">${overview}</p>
                </div>
            </div>
        </div>
    `;
}

function showModal() {
    movieModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    setTimeout(() => {
        modalClose.focus();
    }, 100);
}

function closeModal() {
    movieModal.classList.add('hidden');
    document.body.style.overflow = '';
    
    // Return focus to the search input or last focused element
    searchInput.focus();
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        searchMovies(query);
    }
}

function showLoading() {
    loadingState.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    emptyState.classList.add('hidden');
    moviesGrid.innerHTML = '';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    moviesGrid.innerHTML = '';
}

function showEmptyState() {
    emptyState.classList.remove('hidden');
    loadingState.classList.add('hidden');
    errorMessage.classList.add('hidden');
    moviesGrid.innerHTML = '';
}

function hideAllStates() {
    loadingState.classList.add('hidden');
    errorMessage.classList.add('hidden');
    emptyState.classList.add('hidden');
}

// Handle API key validation
function validateApiKey() {
    if (API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
        showError('Please replace YOUR_TMDB_API_KEY_HERE with your actual TMDb API key to use this application.');
        return false;
    }
    return true;
}

// Check API key on load
document.addEventListener('DOMContentLoaded', function() {
    if (!validateApiKey()) {
        return;
    }
});

// Utility function to debounce search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add debounced search on input
const debouncedSearch = debounce(function(query) {
    if (query.trim()) {
        searchMovies(query);
    }
}, 500);

// Optional: Auto-search as user types (commented out by default)
// searchInput.addEventListener('input', function() {
//     const query = this.value.trim();
//     if (query.length >= 3) {
//         debouncedSearch(query);
//     }
// });

// Handle network errors and provide user feedback
window.addEventListener('online', function() {
    if (currentMovies.length === 0) {
        if (isSearchMode && currentSearchQuery) {
            searchMovies(currentSearchQuery);
        } else {
            loadNowPlayingMovies();
        }
    }
});

window.addEventListener('offline', function() {
    showError('You are currently offline. Please check your internet connection and try again.');
});

// Keyboard navigation for movie grid
document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('movie-card')) {
        let currentIndex = Array.from(moviesGrid.children).indexOf(e.target);
        let nextIndex;
        
        switch (e.key) {
            case 'ArrowRight':
                nextIndex = currentIndex + 1;
                break;
            case 'ArrowLeft':
                nextIndex = currentIndex - 1;
                break;
            case 'ArrowDown':
                // Calculate approximate cards per row based on grid
                const cardsPerRow = Math.floor(moviesGrid.offsetWidth / 300);
                nextIndex = currentIndex + cardsPerRow;
                break;
            case 'ArrowUp':
                const cardsPerRowUp = Math.floor(moviesGrid.offsetWidth / 300);
                nextIndex = currentIndex - cardsPerRowUp;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        
        if (nextIndex >= 0 && nextIndex < moviesGrid.children.length) {
            moviesGrid.children[nextIndex].focus();
        }
    }
});