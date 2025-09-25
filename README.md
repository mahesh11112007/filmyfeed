# FilmyFeed - Movie Discovery App

A responsive movie discovery web application built with Node.js and Express, using The Movie Database (TMDb) API.

## Features

- Browse now playing movies
- Search for movies
- View detailed movie information
- Responsive design for mobile and desktop
- Dark theme UI

## Setup Instructions

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Production Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables on Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings â†’ Environment Variables
   - Add: `TMDB_API_KEY` with your TMDb API key

### Environment Variables

The app requires the following environment variable:
- `TMDB_API_KEY`: Your TMDb API key (already set in .env file)

### Project Structure

```
â”œâ”€â”€ server.js              # Express server
â”œâ”€â”€ package.json           # Dependencies and scripts
â”œâ”€â”€ vercel.json            # Vercel deployment configuration
â”œâ”€â”€ .env                   # Environment variables (not in git)
â”œâ”€â”€ .gitignore            # Git ignore file
â””â”€â”€ public/               # Static files
    â”œâ”€â”€ index.html        # Main HTML file
    â”œâ”€â”€ style.css         # CSS styles
    â”œâ”€â”€ script.js         # JavaScript functionality
    â””â”€â”€ logo.svg          # App logo
```

### API Endpoints

- `GET /api/movie/now_playing` - Get now playing movies
- `GET /api/search/movie` - Search for movies
- `GET /api/movie/:id` - Get movie details

### Technologies Used

- Node.js & Express.js (Backend)
- HTML5, CSS3, JavaScript (Frontend)
- TMDb API (Movie data)
- Vercel (Deployment)

## License

This project is for educational purposes. Movie data provided by TMDb.