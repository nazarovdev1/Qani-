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
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

  // ─── 1. Development Mock Auth Mode ────────────────────────────
  if (mockUserIdHeader || (!botToken && process.env.NODE_ENV !== 'production')) {
    const targetUserId = mockUserIdHeader || 'user_001';

    // In dev, always use JSON store for mock users (they're seeded there)
    let user = dbStore.findUserById(targetUserId);

    if (!user) {
      if (targetUserId === 'user_admin_001' || targetUserId === 'admin') {
        user = dbStore.findUserById('user_admin_001');
      } else {
        user = dbStore.findUserById('user_001');
      }
    }

    if (user) {
      req.user = user;
      return next();
    }
  }

  // ─── 2. Production Telegram initData Authentication ────────────
  if (!initDataHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Telegram initData topilmadi. Iltimos Telegram Mini App orqali kiring.'
      }
    });
    return;
  }

  if (!botToken) {
    // Fallback: auto-login default mock user
    req.user = dbStore.findUserById('user_001');
    return next();
  }

  const result = verifyTelegramInitData(initDataHeader, botToken);
  if (!result.isValid || !result.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_INIT_DATA',
        message: 'Telegram autentifikatsiyasi muvaffaqiyatsiz yakunlandi.'
      }
    });
    return;
  }

  const tgUser = result.user as {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  const tgIdStr = String(tgUser.id);

  // Find or create user using unified DB layer
  let user = await db.findUserByTelegramId(tgIdStr);

  if (!user) {
    // Auto-create user on first login
    user = await db.createUser({
      telegramId: tgIdStr,
      username: tgUser.username,
      firstName: tgUser.first_name || 'Foydalanuvchi',
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      ageConfirmed: false,
      onboardingDone: false,
    });

    // Check referral start_param
    if (result.startParam && result.startParam.startsWith('ref_')) {
      const parts = result.startParam.split('_');
      const inviterId = parts[1];
      const challengeId = parts[2];
      if (inviterId) {
        await db.registerReferral(inviterId, user.id, challengeId);
      }
    }
  }

  if (user.isBlocked) {
    res.status(403).json({
      success: false,
      error: {
        code: 'USER_BLOCKED',
        message: 'Sizning hisobingiz bloklangan. Administrator bilan bog‘laning.'
      }
    });
    return;
  }

  req.user = user;
  next();
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
