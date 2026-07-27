import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { apiRouter } from './api/router';
import { initDatabase, isPostgresEnabled } from './db';
import { testRedisConnection } from './queue/redis';
import { prisma } from './db/prisma';
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
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Juda ko‘p so‘rov. Iltimos, biroz kuting.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Juda ko‘p so‘rov. Iltimos, biroz kuting.' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
