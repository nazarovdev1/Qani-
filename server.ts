import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createApp } from './server/app';

// ─── Port Helper ──────────────────────────────────────────────

function startOnAvailablePort(app: express.Express, preferred: number) {
  const server = app.listen(preferred, '0.0.0.0', () => {
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : preferred;
    console.log(`\n🚀 QANI? Server listening on http://0.0.0.0:${port}`);
    console.log(`📊 Health check: http://0.0.0.0:${port}/health\n`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${preferred} is busy, trying ${preferred + 1}...`);
      startOnAvailablePort(app, preferred + 1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

// ─── Standalone Server (for local dev / Docker) ─────────────

async function startServer() {
  const app = await createApp();

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  startOnAvailablePort(app, 3000);
}

// ─── Start if run directly (not imported) ─────────────────────

const isMainModule = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();

if (isMainModule) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

