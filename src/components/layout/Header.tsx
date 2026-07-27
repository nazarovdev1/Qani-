import React, { useState } from 'react';
import { User } from '../../types';
import { Language, translations } from '../../i18n';
import { setMockUserId, apiRequest } from '../../lib/api';
import { Flame, Globe, UserCheck, ShieldAlert, LogOut, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { telegram } from '../../lib/telegram';

interface HeaderProps {
  user: User | null;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onRefreshUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, lang, onLanguageChange, onRefreshUser }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = translations[lang];

  const handleReturnToTelegram = () => {
    telegram.haptic('click');
    localStorage.removeItem('qani_mock_user_id');
    setMockUserId('');
    setShowUserMenu(false);
    onRefreshUser();
  };

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}`
    : '?';

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

      {/* Right Action Icons: Streak, Profile & Language */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Streak Counter */}
        {user && (
          <div className="flex items-center gap-1 bg-[#000000] text-[#00FF00] border-2 border-[#000000] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_#000000] flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#00FF00] fill-[#00FF00]" />
            <span>{user.currentStreak} {lang === 'uz' ? 'KUN' : 'ДНЕЙ'}</span>
          </div>
        )}

        {/* User Profile Avatar */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full border-2 border-[#000000] overflow-hidden shadow-[2px_2px_0px_#000000] hover:opacity-80 transition-opacity bg-[#FFFFFF] flex items-center justify-center"
            title={user ? `${user.firstName} ${user.lastName || ''}` : 'Profil'}
          >
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-black text-[#000000] uppercase">
                {userInitials}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && user && (
            <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] z-50 text-xs text-[#000000]">
              {/* User Info Header */}
              <div className="px-3 py-3 border-b-2 border-[#000000] bg-[#000000] text-[#FFFFFF]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[#00FF00] overflow-hidden flex-shrink-0 bg-[#FFFFFF] flex items-center justify-center">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-[#000000] uppercase">{userInitials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm truncate">
                      {user.firstName} {user.lastName || ''}
                    </p>
                    {user.username && (
                      <p className="text-[10px] text-[#00FF00] font-bold truncate">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-1.5">
                  {user.role === 'SUPER_ADMIN' && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#FF4D00] text-[#FFFFFF]">
                      SUPER ADMIN
                    </span>
                  )}
                  {user.role === 'ADMIN' && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#FF4D00] text-[#FFFFFF]">
                      ADMIN
                    </span>
                  )}
                  {user.region && (
                    <span className="text-[9px] font-bold text-[#00FF00]">
                      {user.region}
                    </span>
                  )}
                </div>
              </div>

              {/* Return to Telegram */}
              <button
                onClick={handleReturnToTelegram}
                className="w-full text-left px-3 py-2.5 flex items-center space-x-2 hover:bg-[#000000] hover:text-[#FFFFFF] font-bold text-[#000000] border-b-2 border-[#000000]"
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
