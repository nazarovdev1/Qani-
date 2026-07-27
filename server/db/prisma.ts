import { PrismaClient } from '@prisma/client';

// PrismaClient singleton — one instance throughout the app
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown helper
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
