import React, { useState } from 'react';
import { User } from '../../types';
import { Language, translations } from '../../i18n';
import { setMockUserId, currentMockUserId, apiRequest } from '../../lib/api';
import { Flame, Globe, UserCheck, ShieldAlert, Sparkles, LogOut, Crown } from 'lucide-react';
import { telegram } from '../../lib/telegram';

interface HeaderProps {
  user: User | null;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onRefreshUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, lang, onLanguageChange, onRefreshUser }) => {
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = translations[lang];

  const handleSwitchMockUser = (mockId: string) => {
    telegram.haptic('click');
    setMockUserId(mockId);
    setShowDevMenu(false);
    onRefreshUser();
  };

  const handleMakeSuperAdmin = async () => {
    telegram.haptic('click');
    const res = await apiRequest('/admin/make-super-admin', { method: 'POST' });
    if (res.success) {
      telegram.haptic('success');
      setShowDevMenu(false);
      onRefreshUser();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#00FF00] text-[#000000] border-b-4 border-[#000000] shadow-[0_4px_0_#000000]">
      <div className="max-w-lg mx-auto px-4 pt-4 sm:pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
      {/* Brand Logo & Slogan */}
      <div className="flex items-center space-x-2.5">
        <img
          src="/logo.png"
          alt="QANI?"
          className="h-12 w-auto object-contain"
        />
        <div className="hidden sm:block">
          <div className="flex items-center space-x-1.5">
            <h1 className="font-black text-xl tracking-tighter uppercase italic text-[#000000]">
              QANI?
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#000000] text-[#FFFFFF]">
              MVP
            </span>
          </div>
          <p className="text-[10px] text-[#000000] font-bold uppercase tracking-wider">
            {t.slogan}
          </p>
        </div>
      </div>

      {/* Right Action Icons: Streak, Dev Switcher & Language */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Streak Counter */}
        {user && (
          <div className="flex items-center gap-1 bg-[#000000] text-[#00FF00] border-2 border-[#000000] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_#000000] flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#00FF00] fill-[#00FF00]" />
            <span>{user.currentStreak} {lang === 'uz' ? 'KUN' : 'ДНЕЙ'}</span>
          </div>
        )}

        {/* Dev Mock User Switcher Modal Trigger */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowDevMenu(!showDevMenu)}
            className="flex items-center justify-center bg-[#FFFFFF] text-[#000000] px-1.5 py-1 border-2 border-[#000000] font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors"
            title="Dev Mock User"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
          </button>

          {/* Dev Mock User Dropdown */}
          {showDevMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] py-2 z-50 text-xs text-[#000000]">
              <div className="px-3 py-1.5 border-b-2 border-[#000000] font-black uppercase text-[#000000] bg-[#00FF00] flex items-center justify-between">
                <span>Dev Mock Auth</span>
                <span className="text-[10px] bg-[#000000] text-[#FFFFFF] px-1.5 py-0.5 font-mono">
                  {currentMockUserId}
                </span>
              </div>

              <button
                onClick={() => handleSwitchMockUser('user_001')}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#00FF00] font-bold ${currentMockUserId === 'user_001' ? 'bg-[#000000] text-[#00FF00]' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Jasur (Standart User)</span>
                </div>
              </button>

              <button
                onClick={() => handleSwitchMockUser('user_002')}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#00FF00] font-bold ${currentMockUserId === 'user_002' ? 'bg-[#000000] text-[#00FF00]' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Madina (Samarqand User)</span>
                </div>
              </button>

              <button
                onClick={() => handleSwitchMockUser('user_admin_001')}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#FF4D00] hover:text-[#FFFFFF] font-bold ${currentMockUserId === 'user_admin_001' ? 'bg-[#000000] text-[#FF4D00]' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Azizbek (Super Admin)</span>
                </div>
              </button>

              <div className="border-t-2 border-[#000000] my-1"></div>

              {/* Make Me Super Admin (only if not already) */}
              {user?.role !== 'SUPER_ADMIN' && (
                <button
                  onClick={handleMakeSuperAdmin}
                  className="w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-[#000000] hover:text-[#00FF00] font-bold text-[#000000]"
                >
                  <Crown className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>Make Me Super Admin</span>
                </button>
              )}

              <button
                onClick={() => {
                  localStorage.removeItem('qani_mock_user_id');
                  setMockUserId('');
                  setShowDevMenu(false);
                  onRefreshUser();
                }}
                className="w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-[#000000] hover:text-[#FFFFFF] font-bold text-[#000000]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Telegram foydalanuvchisiga qaytish</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center justify-center bg-[#000000] text-[#FFFFFF] text-[11px] font-black uppercase px-2 py-1 border-2 border-[#000000] shadow-[2px_2px_0px_#000000] hover:text-[#00FF00] transition-colors min-w-[2.5rem]"
          >
            {lang.toUpperCase()}
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 bg-[#000000] border-2 border-[#000000] shadow-[4px_4px_0px_#000000] z-50 flex flex-col">
              {(['uz', 'ru', 'en'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => {
                    telegram.haptic('click');
                    onLanguageChange(l);
                    setShowLangMenu(false);
                  }}
                  className={`px-3 py-1.5 text-[11px] font-black uppercase transition-colors text-left ${lang === l ? 'bg-[#00FF00] text-[#000000]' : 'text-[#FFFFFF] hover:bg-[#1a1a1a] hover:text-[#00FF00]'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
  );
};
