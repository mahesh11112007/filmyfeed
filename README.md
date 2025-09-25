# FilmyFeed - Movie Discovery App

A responsive movie discovery web application built with Node.js, Express, and The Movie Database (TMDb) API.

## Features

- ðŸŽ¬ Browse Latest Released Movies
- ðŸ” Search Movies with URL navigation
- ðŸ“± Responsive design for mobile and desktop
- ðŸŒ™ Dark theme UI
- ðŸ“„ Detailed movie information in modal
- ðŸ”— Shareable search URLs (e.g., /?q=inception)
- âš¡ Fast loading with proxy API

## Screenshots

- **Home Page**: Latest Released Movies grid
- **Search Results**: Navigate to /?q=movie-name
- **Movie Details**: Click any movie for detailed info

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **API**: The Movie Database (TMDb)
- **Deployment**: Vercel
- **Styling**: CSS Grid, Flexbox, CSS Variables

## Quick Start

### Prerequisites
- Node.js (version 18+)
- npm or yarn
- TMDb API key

### Installation

1. **Clone/Download the project**
   ```bash
   # All files are already created in your directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
FilmyFeed/
â”œâ”€â”€ server.js              # Express server with API proxy
â”œâ”€â”€ package.json           # Dependencies and scripts
â”œâ”€â”€ vercel.json            # Vercel deployment config
â”œâ”€â”€ .env                   # Environment variables (TMDb API key)
â”œâ”€â”€ .gitignore            # Git ignore rules
â”œâ”€â”€ README.md             # This file
â””â”€â”€ public/               # Static files served by Express
    â”œâ”€â”€ index.html        # Main HTML page
    â”œâ”€â”€ style.css         # CSS styles with dark theme
    â”œâ”€â”€ script.js         # JavaScript functionality
    â””â”€â”€ logo.svg          # App logo
```

## API Endpoints

The Express server provides these proxy endpoints:

- `GET /api/movie/now_playing` - Latest released movies
- `GET /api/search/movie?query=TERM` - Search movies
- `GET /api/movie/:id` - Get movie details
- `GET /health` - Server health check

## Key Features Implementation

### 1. URL Navigation for Search
- Search queries update the URL: `/?q=inception`
- Direct URL access works: visit `yourdomain.com/?q=batman`
- Browser back/forward buttons work correctly
- Shareable search result links

### 2. Latest Released Movies
- Shows "Latest Released Movies" instead of "Now Playing"
- Fetches from TMDb's `now_playing` endpoint
- Loads 2 pages of results for more variety
- Regional filtering for India (IN)

### 3. Responsive Design
- Mobile-first approach
- Grid layout adapts to screen size
- Touch-friendly interface
- Optimized for all device sizes

## Environment Variables

```bash
TMDB_API_KEY=your_tmdb_api_key_here
```

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variable on Vercel**
   - Go to Vercel Dashboard â†’ Project â†’ Settings
   - Add Environment Variable: `TMDB_API_KEY`

### Other Platforms

The app works on any Node.js hosting platform:
- Railway
- Render
- Heroku
- DigitalOcean App Platform

## Development

### Available Scripts

```bash
npm start        # Production server
npm run dev      # Development with nodemon
npm install      # Install dependencies
```

### Local Development Tips

1. **Hot Reload**: Use `npm run dev` for automatic restarts
2. **API Testing**: Visit `/health` to test server
3. **Debug**: Check browser console for errors
4. **Proxy**: All `/api/*` requests are proxied to TMDb

## Troubleshooting

### Common Issues

1. **Movies not loading**
   - Check if `.env` file exists with valid TMDb API key
   - Verify internet connection
   - Check browser console for errors

2. **Search not working**
   - Ensure JavaScript is enabled
   - Check if API endpoints are accessible
   - Verify server is running

3. **Deployment issues**
   - Ensure environment variables are set on hosting platform
   - Check build logs for errors
   - Verify all files are uploaded

## License

This project is for educational purposes. Movie data provided by The Movie Database (TMDb).

## Contributing

Feel free to fork this project and submit pull requests for improvements.

---

**Made with â¤ï¸ for movie lovers**