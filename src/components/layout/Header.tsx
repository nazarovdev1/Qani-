import React, { useState } from 'react';
import { User } from '../../types';
import { Language, translations } from '../../i18n';
import { setMockUserId, currentMockUserId } from '../../lib/api';
import { Flame, Globe, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { telegram } from '../../lib/telegram';

interface HeaderProps {
  user: User | null;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onRefreshUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, lang, onLanguageChange, onRefreshUser }) => {
  const [showDevMenu, setShowDevMenu] = useState(false);
  const t = translations[lang];

  const handleSwitchMockUser = (mockId: string) => {
    telegram.haptic('click');
    setMockUserId(mockId);
    setShowDevMenu(false);
    onRefreshUser();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#00FF00] text-[#000000] border-b-4 border-[#000000] px-4 py-3 flex items-center justify-between shadow-[0_4px_0_#000000]">
      {/* Brand Logo & Slogan */}
      <div className="flex items-center space-x-2.5">
        <div className="w-10 h-10 bg-[#000000] text-[#00FF00] border-2 border-[#000000] flex items-center justify-center font-black text-2xl tracking-tighter">
          Q?
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-black text-xl tracking-tighter uppercase italic text-[#000000]">
              QANI?
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#000000] text-[#FFFFFF]">
              MVP
            </span>
          </div>
          <p className="text-[10px] text-[#000000] font-bold uppercase tracking-wider hidden sm:block">
            {t.slogan}
          </p>
        </div>
      </div>

      {/* Right Action Icons: Streak, Dev Switcher & Language */}
      <div className="flex items-center space-x-2">
        {/* Streak Counter */}
        {user && (
          <div className="flex items-center space-x-1.5 bg-[#000000] text-[#00FF00] border-2 border-[#000000] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_#000000]">
            <Flame className="w-4 h-4 text-[#00FF00] fill-[#00FF00]" />
            <span>{user.currentStreak} {lang === 'uz' ? 'KUN' : 'ДНЕЙ'}</span>
          </div>
        )}

        {/* Dev Mock User Switcher Modal Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowDevMenu(!showDevMenu)}
            className="flex items-center space-x-1 bg-[#FFFFFF] text-[#000000] text-xs px-2.5 py-1 border-2 border-[#000000] font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors"
            title="Dev Mock User"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span className="font-mono text-[11px] truncate max-w-[70px]">
              {user?.role === 'SUPER_ADMIN' ? 'Admin' : user?.firstName || 'Dev'}
            </span>
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
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="flex bg-[#000000] p-0.5 border-2 border-[#000000] text-[11px] font-black uppercase">
          {(['uz', 'ru', 'en'] as Language[]).map(l => (
            <button
              key={l}
              onClick={() => {
                telegram.haptic('click');
                onLanguageChange(l);
              }}
              className={`px-2 py-0.5 transition-colors ${lang === l ? 'bg-[#00FF00] text-[#000000] font-black' : 'text-[#FFFFFF] hover:text-[#00FF00]'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
