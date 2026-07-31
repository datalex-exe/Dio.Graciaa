import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set environment variable to signify integrated Vite mode for Express
process.env.INTEGRATED_VITE = 'true';

// Dynamically import Express app to avoid ESM hoisting issues
const { default: expressApp } = await import('../backend/src/index.js');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'express-backend',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/api') || req.url.startsWith('/health')) {
            expressApp(req, res, next);
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    hmr: {
      clientPort: 3000
    }
  }
});
