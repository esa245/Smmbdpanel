import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // SMM Panel v2 Proxy API Endpoint
  app.post('/api/smm', async (req, res) => {
    try {
      const { apiUrl = 'https://motherpanel.com/api/v2', key, action, ...otherParams } = req.body;

      if (!key) {
        return res.status(400).json({ error: 'API Key is required' });
      }

      const formData = new URLSearchParams();
      formData.append('key', key);
      formData.append('action', action);
      for (const [k, v] of Object.entries(otherParams)) {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error('SMM API Proxy Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to connect to SMM Panel API' });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
