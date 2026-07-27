import { createApp } from '../dist/server-app.js';

let appPromise: ReturnType<typeof createApp> | null = null;
let initError: Error | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (initError) {
      throw initError;
    }

    if (!appPromise) {
      console.log('[Vercel] Initializing app...');
      appPromise = createApp().catch(err => {
        initError = err;
        console.error('[Vercel] App init failed:', err);
        throw err;
      });
    }

    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel] Handler error:', err);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVERLESS_INIT_ERROR',
          message: process.env.NODE_ENV === 'production'
            ? 'Server ishga tushirishda xatolik.'
            : err.message,
        }
      });
    }
  }
}