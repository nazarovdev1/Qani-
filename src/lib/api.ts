import { telegram } from './telegram';

// Mock user ID — faqat developer menyu orqali tanlanganda ishlatiladi
export let currentMockUserId: string = localStorage.getItem('qani_mock_user_id') || '';

export function setMockUserId(id: string) {
  currentMockUserId = id;
  localStorage.setItem('qani_mock_user_id', id);
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  // Wait for initData if in Telegram (handles race condition on app open)
  const initData = await telegram.waitForInitData(2000);

  if (initData) {
    headers['x-telegram-init-data'] = initData;
    console.log(`[API ${endpoint}] initData sent (length: ${initData.length})`);
  } else {
    console.warn(`[API ${endpoint}] No initData available`);
  }

  // Also send unsafe user data as fallback for debugging
  const tgUser = telegram.user;
  if (tgUser) {
    headers['x-telegram-user'] = JSON.stringify(tgUser);
  }

  // Mock user header — faqat developer menyu orqali tanlanganda va Telegram'da emas
  if (currentMockUserId && !initData && !tgUser) {
    headers['x-mock-user-id'] = currentMockUserId;
    console.log(`[API ${endpoint}] Using mock user:`, currentMockUserId);
  }

  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    const json = await res.json();
    if (!res.ok) {
      console.warn(`[API ${endpoint}] HTTP ${res.status}:`, json);
    }
    return json;
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Internet bilan aloqa yo‘qolgan bo‘lishi mumkin.'
      }
    };
  }
}
