import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function createServer() {
  const app = express();

  // Proxy endpoint for Grokipedia - no CORS needed!
  app.get('/api/proxy/grokipedia', async (req, res) => {
    const term = req.query.term;
    if (!term) {
      return res.status(400).json({ error: 'Term parameter required' });
    }

    try {
      const formattedTerm = encodeURIComponent(term.trim()).replace(/%20/g, '_');
      const targetUrl = `https://grokipedia.com/page/${formattedTerm}`;
      
      const response = await fetch(targetUrl);
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to fetch from Grokipedia (Status: ${response.status})` 
        });
      }
      
      const html = await response.text();
      if (!html || html.includes("This page does not exist yet")) {
        return res.status(404).json({ 
          error: `The Grokipedia page for "${term}" does not exist.` 
        });
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (isProduction) {
    // Serve static files from dist
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In development, use Vite dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    // Transform and serve index.html in dev mode
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        // Read the HTML file and transform it with Vite
        const template = readFileSync(join(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    if (!isProduction) {
      console.log(`Development mode: Vite dev server integrated`);
    }
  });
}

createServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

