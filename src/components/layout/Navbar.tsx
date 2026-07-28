import React from 'react';
import { User } from '../../types';
import { Language, translations } from '../../i18n';
import { Video, Users, Share2, User as UserIcon, Film } from 'lucide-react';
import { telegram } from '../../lib/telegram';

export type TabType = 'today' | 'feed' | 'groups' | 'referral' | 'profile' | 'myVideos';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  lang: Language;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, user, lang }) => {
  const t = translations[lang];

  const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'today', label: t.today, icon: <Video className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { id: 'feed', label: t.feed, icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { id: 'groups', label: t.groups, icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { id: 'referral', label: t.referral, icon: <Share2 className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { id: 'profile', label: t.profile, icon: <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { id: 'myVideos', label: 'Video', icon: <Film className="w-5 h-5 sm:w-6 sm:h-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full bg-[#000000] border-t border-[#333]">
      <div className="max-w-lg mx-auto px-0.5 sm:px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  telegram.haptic('click');
                  onTabChange(item.id);
                }}
                className="flex flex-col items-center justify-center py-1 px-0.5 sm:py-1.5 sm:px-1 transition-all duration-150 uppercase tracking-wider font-black flex-1"
              >
                <div className={`${isActive ? 'text-[#00FF00]' : 'text-[#888888]'} mb-0.5`}>
                  {item.icon}
                </div>
                <span className={`text-[7px] sm:text-[8px] leading-tight font-bold text-center whitespace-nowrap ${
                  isActive ? 'text-[#00FF00]' : 'text-[#888888]'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
