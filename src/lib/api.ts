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

  const initData = telegram.initData;
  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  // Mock user header — faqat developer menyu orqali tanlanganda
  if (currentMockUserId && !initData) {
    headers['x-mock-user-id'] = currentMockUserId;
  }

  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    const json = await res.json();
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
