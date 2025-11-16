# Grokipedia vs Wikipedia Comparator

A web application that compares articles from Grokipedia and Wikipedia using Google's Gemini AI to provide insightful analysis of differences in tone, bias, and content.

## Features

- 🔍 Search and fetch articles from both Grokipedia and Wikipedia
- 🤖 AI-powered comparison using Google Gemini
- 💾 Persistent storage of comparisons using SQLite
- 📜 View comparison history
- 🎨 Modern, responsive UI with dark mode

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- React Router for navigation
- Vite for build tooling
- Tailwind CSS for styling

**Backend:**
- Express.js server
- SQLite database with better-sqlite3
- Google Generative AI SDK

## Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   This will start both the Vite dev server (port 5173) and the Express backend (port 3000).

4. **Access the application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment to Railway

### Quick Deploy

1. **Push your code to GitHub**

2. **Create a new project on Railway:**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add environment variables:**
   In the Railway dashboard, add the following environment variable:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Deploy:**
   Railway will automatically detect the configuration and deploy your app.

### Manual Configuration

The repository includes a `railway.toml` file that configures:
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Restart policy: On failure with max 10 retries

### Database Persistence

Railway provides ephemeral storage by default. For persistent database storage:

1. Add a Railway Volume:
   - In your Railway project, click "New" → "Volume"
   - Mount it at `/app/data`

2. Update the environment variable:
   ```
   DATABASE_PATH=/app/data/comparisons.db
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Start only the Vite dev server
- `npm run dev:server` - Start only the Express backend
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server
- `npm run preview` - Preview the production build locally

## API Endpoints

The Express backend provides the following REST API:

- `GET /api/grokipedia/:term` - Fetch Grokipedia article
- `GET /api/wikipedia/:term` - Fetch Wikipedia article
- `POST /api/compare` - Compare articles with Gemini AI
- `GET /api/comparisons` - Get all saved comparisons
- `GET /api/comparisons/:id` - Get a specific comparison
- `POST /api/comparisons` - Save a new comparison
- `DELETE /api/comparisons/:id` - Delete a comparison

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Your Google Gemini API key |
| `PORT` | No | 3000 | Port for the Express server |
| `DATABASE_PATH` | No | ./comparisons.db | Path to SQLite database file |
| `NODE_ENV` | No | development | Environment (production/development) |

## Project Structure

```
.
├── server/
│   └── index.js          # Express server
├── services/
│   ├── apiService.ts     # API calls to backend
│   └── databaseService.ts # Database operations
├── components/           # React components
├── pages/               # React pages
├── App.tsx              # Main app component
├── index.tsx            # App entry point
└── vite.config.ts       # Vite configuration
```

## Security Features

✅ API keys stored server-side (not exposed to client)
✅ CORS protection
✅ Input validation on all endpoints
✅ No third-party CORS proxies
✅ Prepared statements for SQL queries

## Troubleshooting

**Issue:** Database errors on Railway
- **Solution:** Make sure you've set up a Railway Volume for persistent storage

**Issue:** API key errors
- **Solution:** Verify your `GEMINI_API_KEY` is set correctly in Railway's environment variables

**Issue:** CORS errors in development
- **Solution:** Make sure both the Vite dev server and Express server are running

## License

This project was created as a demonstration application.

## Contributing

Feel free to open issues or submit pull requests for improvements!
