import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if it exists
try {
    const envFile = readFileSync(path.join(__dirname, '../.env'), 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2].trim();
        }
    });
} catch (err) {
    // .env file doesn't exist, that's okay
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI (lazy initialization)
let genAI = null;
const getGenAI = () => {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in your .env file or environment.');
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

// Initialize SQLite Database
const db = new Database(process.env.DATABASE_PATH || './comparisons.db');

// Create table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS comparisons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL,
        grokipedia_html TEXT NOT NULL,
        wikipedia_text TEXT NOT NULL,
        gemini_comparison TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// API Routes

/**
 * Fetch Grokipedia source HTML
 */
app.get('/api/grokipedia/:term', async (req, res) => {
    try {
        const { term } = req.params;
        if (!term || !term.trim()) {
            return res.status(400).json({ error: 'Term parameter is required' });
        }

        const formattedTerm = encodeURIComponent(term.trim()).replace(/%20/g, '_');
        const targetUrl = `https://grokipedia.com/page/${formattedTerm}`;

        const response = await fetch(targetUrl);

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Failed to fetch from Grokipedia. Status: ${response.status}`
            });
        }

        const html = await response.text();

        if (!html || html.includes("This page does not exist yet")) {
            return res.status(404).json({
                error: `The Grokipedia page for "${term}" does not exist.`
            });
        }

        res.json({ html });
    } catch (error) {
        console.error('Grokipedia fetch error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * Fetch Wikipedia extract
 */
app.get('/api/wikipedia/:term', async (req, res) => {
    try {
        const { term } = req.params;
        if (!term || !term.trim()) {
            return res.status(400).json({ error: 'Term parameter is required' });
        }

        const formattedTerm = encodeURIComponent(term.trim());
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${formattedTerm}&format=json&origin=*`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Failed to fetch from Wikipedia API. Status: ${response.status}`
            });
        }

        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (!pageId || pageId === '-1') {
            return res.status(404).json({
                error: `The Wikipedia page for "${term}" does not exist.`
            });
        }

        const extract = pages[pageId].extract;
        if (!extract) {
            return res.status(404).json({
                error: `No summary extract found on Wikipedia for "${term}".`
            });
        }

        res.json({ extract });
    } catch (error) {
        console.error('Wikipedia fetch error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * Compare content with Gemini
 */
app.post('/api/compare', async (req, res) => {
    try {
        const { systemPrompt, userPrompt, grokipediaText, wikipediaText } = req.body;

        if (!systemPrompt || !userPrompt || !grokipediaText || !wikipediaText) {
            return res.status(400).json({
                error: 'Missing required fields: systemPrompt, userPrompt, grokipediaText, wikipediaText'
            });
        }

        const fullPrompt = `
            ${userPrompt}

            --- GROKIPEDIA TEXT ---
            ${grokipediaText}

            --- WIKIPEDIA TEXT ---
            ${wikipediaText}
        `;

        const ai = getGenAI();
        const model = ai.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();

        res.json({ comparison: text });
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({
            error: `Gemini API request failed: ${error.message}`
        });
    }
});

/**
 * Save a comparison to the database
 */
app.post('/api/comparisons', async (req, res) => {
    try {
        const { term, grokipediaHtml, wikipediaText, geminiComparison } = req.body;

        if (!term || !grokipediaHtml || !wikipediaText || !geminiComparison) {
            return res.status(400).json({
                error: 'Missing required fields: term, grokipediaHtml, wikipediaText, geminiComparison'
            });
        }

        const stmt = db.prepare(`
            INSERT INTO comparisons (term, grokipedia_html, wikipedia_text, gemini_comparison)
            VALUES (?, ?, ?, ?)
        `);

        const info = stmt.run(term, grokipediaHtml, wikipediaText, geminiComparison);

        res.json({ id: info.lastInsertRowid });
    } catch (error) {
        console.error('Database insert error:', error);
        res.status(500).json({ error: 'Failed to save comparison' });
    }
});

/**
 * Get all comparisons
 */
app.get('/api/comparisons', async (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT id, term, grokipedia_html as grokipediaHtml,
                   wikipedia_text as wikipediaText,
                   gemini_comparison as geminiComparison,
                   timestamp
            FROM comparisons
            ORDER BY timestamp DESC
        `);

        const comparisons = stmt.all();
        res.json(comparisons);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Failed to fetch comparisons' });
    }
});

/**
 * Get a single comparison by ID
 */
app.get('/api/comparisons/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const stmt = db.prepare(`
            SELECT id, term, grokipedia_html as grokipediaHtml,
                   wikipedia_text as wikipediaText,
                   gemini_comparison as geminiComparison,
                   timestamp
            FROM comparisons
            WHERE id = ?
        `);

        const comparison = stmt.get(id);

        if (!comparison) {
            return res.status(404).json({ error: 'Comparison not found' });
        }

        res.json(comparison);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Failed to fetch comparison' });
    }
});

/**
 * Delete a comparison by ID
 */
app.delete('/api/comparisons/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const stmt = db.prepare('DELETE FROM comparisons WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Comparison not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Database delete error:', error);
        res.status(500).json({ error: 'Failed to delete comparison' });
    }
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    db.close();
    process.exit(0);
});
