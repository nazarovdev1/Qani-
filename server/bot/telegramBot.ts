/**
 * Telegram Bot Service
 *
 * Sends proactive messages to users via the Telegram Bot API.
 * Uses TELEGRAM_BOT_TOKEN from environment variables.
 */

const BOT_API = 'https://api.telegram.org/bot';

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled');
    return '';
  }
  return token;
}

/**
 * Send a text message to a specific Telegram user by their telegramId.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendTelegramMessage(
  telegramId: string,
  text: string,
  options?: { parse_mode?: 'HTML' | 'Markdown' }
): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  try {
    const res = await fetch(`${BOT_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        parse_mode: options?.parse_mode || 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Telegram sendMessage error (${res.status}):`, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Telegram sendMessage fetch error:', err);
    return false;
  }
}

/**
 * Send a new challenge notification to a single user.
 */
export async function sendChallengeNotification(
  telegramId: string,
  challengeTitle: string,
  challengeDescription: string
): Promise<boolean> {
  const text = `
🎯 <b>Yangi Challenge boshlandi!</b>

<b>${escapeHtml(challengeTitle)}</b>

${escapeHtml(challengeDescription)}

📸 Kamerani ochib, videongizni yozing va do'stlaringiz bilan baham ko'ring!
  `.trim();

  return sendTelegramMessage(telegramId, text, { parse_mode: 'HTML' });
}

/**
 * Simple HTML escaping to prevent injection.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
