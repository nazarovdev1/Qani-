import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, isPostgresEnabled } from '../db';
import { dbStore } from '../db/store';
import { User } from '../db/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Validates Telegram Mini App initData HMAC hash using Bot Token
 */
export function verifyTelegramInitData(
  initDataRaw: string,
  botToken: string
): { isValid: boolean; user?: Record<string, unknown>; startParam?: string } {
  try {
    const urlParams = new URLSearchParams(initDataRaw);
    const hash = urlParams.get('hash');
    if (!hash) return { isValid: false };

    urlParams.delete('hash');

    // Sort parameters alphabetically
    const params: string[] = [];
    for (const [key, value] of urlParams.entries()) {
      params.push(`${key}=${value}`);
    }
    params.sort();
    const dataCheckString = params.join('\n');

    // Secret key = HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false };
    }

    const userDataStr = urlParams.get('user');
    const user = userDataStr ? JSON.parse(userDataStr) : undefined;
    const startParam = urlParams.get('start_param') || undefined;

    return { isValid: true, user, startParam };
  } catch (e) {
    console.error('Telegram initData verification error:', e);
    return { isValid: false };
  }
}

/**
 * Express Middleware for Telegram Auth
 * Supports:
 * 1. Dev Mock Auth (x-mock-user-id header)
 * 2. Production Telegram initData validation
 */
export async function telegramAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const initDataHeader = req.headers['x-telegram-init-data'] as string || req.query.initData as string;
  const mockUserIdHeader = req.headers['x-mock-user-id'] as string || req.query.mockUserId as string;
  const telegramUserHeader = req.headers['x-telegram-user'] as string;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

  // Debug: log headers (remove in production once fixed)
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log('[Auth] Headers:', {
      hasInitData: !!initDataHeader,
      initDataLength: initDataHeader?.length,
      hasMockUser: !!mockUserIdHeader,
      hasTelegramUser: !!telegramUserHeader,
      path: req.path,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
  }

  // ─── 1. Development Mock Auth Mode ────────────────────────────
  if (mockUserIdHeader) {
    let user = dbStore.findUserById(mockUserIdHeader);
    if (!user) {
      user = dbStore.findUserById('user_001');
    }
    if (user) {
      req.user = user;
      return next();
    }
  }

  // ─── 2. Telegram initData Authentication ────────────
  if (initDataHeader) {
    if (!botToken) {
      // Bot token o'rnatilmagan — initData'ni trust qilamiz (dev/yangi bot)
      try {
        const urlParams = new URLSearchParams(initDataHeader);
        const userDataStr = urlParams.get('user');
        if (userDataStr) {
          const tgUser = JSON.parse(userDataStr);
          const tgIdStr = String(tgUser.id);
          let user = await db.findUserByTelegramId(tgIdStr);
          if (!user) {
            user = await db.createUser({
              telegramId: tgIdStr,
              username: tgUser.username,
              firstName: tgUser.first_name || 'Foydalanuvchi',
              lastName: tgUser.last_name,
              photoUrl: tgUser.photo_url,
              ageConfirmed: false,
              onboardingDone: false,
            });
          }
          if (user.isBlocked) {
            res.status(403).json({
              success: false,
              error: { code: 'USER_BLOCKED', message: 'Sizning hisobingiz bloklangan.' }
            });
            return;
          }
          req.user = user;
          return next();
        }
      } catch (e) {
        console.error('Fallback auth parse error:', e);
      }
    } else {
      // Bot token bor — HMAC verify qilamiz
      const result = verifyTelegramInitData(initDataHeader, botToken);
      if (result.isValid && result.user) {
        const tgUser = result.user as {
          id: number; first_name: string; last_name?: string;
          username?: string; photo_url?: string;
        };
        const tgIdStr = String(tgUser.id);
        let user = await db.findUserByTelegramId(tgIdStr);
        if (!user) {
          user = await db.createUser({
            telegramId: tgIdStr, username: tgUser.username,
            firstName: tgUser.first_name || 'Foydalanuvchi',
            lastName: tgUser.last_name, photoUrl: tgUser.photo_url,
            ageConfirmed: false, onboardingDone: false,
          });
          if (result.startParam && result.startParam.startsWith('ref_')) {
            const parts = result.startParam.split('_');
            if (parts[1]) await db.registerReferral(parts[1], user.id, parts[2]);
          }
        }
        if (user.isBlocked) {
          res.status(403).json({
            success: false,
            error: { code: 'USER_BLOCKED', message: 'Sizning hisobingiz bloklangan.' }
          });
          return;
        }
        req.user = user;
        return next();
      }
      console.warn('[Auth] HMAC verification failed, trying fallback...');
    }
  }

  // ─── 3. Fallback: x-telegram-user header ────────────
  if (telegramUserHeader) {
    try {
      const tgUser = JSON.parse(telegramUserHeader);
      if (tgUser.id) {
        const tgIdStr = String(tgUser.id);
        let user = await db.findUserByTelegramId(tgIdStr);
        if (!user) {
          user = await db.createUser({
            telegramId: tgIdStr, username: tgUser.username,
            firstName: tgUser.first_name || 'Foydalanuvchi',
            lastName: tgUser.last_name, photoUrl: tgUser.photo_url,
            ageConfirmed: false, onboardingDone: false,
          });
        }
        if (user.isBlocked) {
          res.status(403).json({
            success: false,
            error: { code: 'USER_BLOCKED', message: 'Sizning hisobingiz bloklangan.' }
          });
          return;
        }
        req.user = user;
        return next();
      }
    } catch (e) {
      console.error('x-telegram-user parse error:', e);
    }
  }

  // ─── 4. No auth ────────────
  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Telegram initData topilmadi. Iltimos Telegram Mini App orqali kiring.'
    }
  });
}

/**
 * Admin Role Middleware
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Ushbu amalni bajarish uchun admin huquqi talab etiladi.'
      }
    });
    return;
  }
  next();
}
