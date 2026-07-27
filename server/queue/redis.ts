import Redis from 'ioredis';
import tls from 'tls';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = REDIS_URL.startsWith('rediss://');

let redis: Redis | null = null;

/**
 * Get Redis connection (lazy init)
 */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // give up after 3 retries
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true, // don't connect until first command
      // TLS/SSL config for Upstash (rediss://)
      tls: isTLS ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 15000,
      commandTimeout: 5000,
    });

    redis.on('error', (err: Error) => {
      console.warn('⚠️  Redis connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready (TLS/SSL)');
    });
  }
  return redis;
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const r = getRedis();
    await r.connect();
    await r.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  try {
    const r = getRedis();
    return r.status === 'ready' || r.status === 'connect';
  } catch {
    return false;
  }
}

export default { getRedis, testRedisConnection, isRedisAvailable };
