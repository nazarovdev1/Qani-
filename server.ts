import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api/router';
import { initDatabase, isPostgresEnabled } from './server/db';
import { testRedisConnection } from './server/queue/redis';
import { prisma } from './server/db/prisma';
import rateLimit from 'express-rate-limit';

// ─── Global Error Handler ──────────────────────────────────────

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Server xatolik yuz berdi.'
        : err.message,
    },
  });
}

// ─── Rate Limiting ────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Juda ko‘p so‘rov. Iltimos, biroz kuting.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Juda ko‘p so‘rov. Iltimos, biroz kuting.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// ─── Create Express App (for both standalone & serverless) ──

export async function createApp() {
  const app = express();

  // Initialize database (PostgreSQL or JSON fallback)
  await initDatabase();

  // Check if PostgreSQL needs seeding
  if (isPostgresEnabled()) {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌱  PostgreSQL database is empty!');
        console.log('    Run: npm run db:seed');
        console.log('    To populate demo data (admin + users + challenges)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
      }
    } catch {
      // Ignore seed check errors
    }
  }

  // Test Redis
  const redisConnected = await testRedisConnection();
  if (redisConnected) {
    console.log('🟥 Redis is ready');
  } else {
    console.warn('⚠️  Redis not connected — using in-memory fallback');
  }

  // JSON Body Parser
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Rate limiting
  app.use('/api/auth', authLimiter);
  app.use('/api', generalLimiter);

  // Static uploads directory for media files (Vercel: use /tmp)
  const uploadDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads')
    : path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // API Routes FIRST
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', async (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'QANI? Mini App Service',
      version: '1.0.0',
    });
  });

  // Vite middleware in development or static index.html in production
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

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

// ─── Standalone Server (for local dev / Docker) ─────────────

async function startServer() {
  const app = await createApp();
  startOnAvailablePort(app, 3000);
}

// ─── Serverless Export (Vercel) ─────────────────────────────

export default createApp;

// ─── Start if run directly (not imported) ─────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
