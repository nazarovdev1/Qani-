declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

export const telegram = {
  get webApp() {
    return window.Telegram?.WebApp;
  },

  get initData() {
    return window.Telegram?.WebApp?.initData || '';
  },

  get user() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user;
  },

  get startParam() {
    return window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  },

  haptic(type: 'success' | 'warning' | 'error' | 'click' = 'click') {
    try {
      if (type === 'click') {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
      } else {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
      }
    } catch {
      // Ignore if not inside Telegram client
    }
  },

  shareUrl(url: string, text: string) {
    const fullShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(fullShareUrl);
    } else {
      window.open(fullShareUrl, '_blank');
    }
  },

  ready() {
    try {
      window.Telegram?.WebApp?.ready();
      window.Telegram?.WebApp?.expand();
    } catch {
      // Browser dev mode
    }
  },

  /**
   * Waits for Telegram initData to be available (handles race condition)
   */
  async waitForInitData(timeoutMs = 3000): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const data = window.Telegram?.WebApp?.initData;
      if (data) {
        console.log('[Telegram] initData available after', Date.now() - start, 'ms');
        return data;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    console.warn('[Telegram] initData not available after', timeoutMs, 'ms');
    return '';
  }
};
