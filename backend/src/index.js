import './env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment settings at startup
const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
if (isProd && (!jwtSecret || jwtSecret === 'dio_grace_secret_key_change_me_later')) {
  console.error('\n========================================================================');
  console.error('FATAL: JWT_SECRET environment variable is missing or set to');
  console.error('the default fallback key in production mode.');
  console.error('For security reasons, the server cannot start.');
  console.error('========================================================================\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: isProd 
    ? (allowedOrigins.length > 0 ? allowedOrigins : false) // Block all origins in prod by default if not set
    : '*', // Allow all in dev mode
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Main API Route
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});



// Serve static assets in production, or proxy to Vite dev server in development
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Fallback to index.html for React router
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
} else if (process.env.INTEGRATED_VITE !== 'true') {
  // Dev mode proxy to Vite dev server
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }

    const targetUrl = `http://localhost:3000${req.url}`;
    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.status(502).send('Vite dev server is not running on port 3000.');
    });

    req.pipe(proxyReq, { end: true });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

if (process.env.INTEGRATED_VITE !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
