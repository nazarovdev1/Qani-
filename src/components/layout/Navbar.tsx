import React from 'react';
import { User } from '../../types';
import { Language, translations } from '../../i18n';
import { Video, Users, Share2, User as UserIcon, Shield } from 'lucide-react';
import { telegram } from '../../lib/telegram';

export type TabType = 'today' | 'feed' | 'groups' | 'referral' | 'profile' | 'admin';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  lang: Language;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, user, lang }) => {
  const t = translations[lang];
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'today', label: t.today, icon: <Video className="w-5 h-5" /> },
    { id: 'feed', label: t.feed, icon: <Users className="w-5 h-5" /> },
    { id: 'groups', label: t.groups, icon: <Users className="w-5 h-5" /> },
    { id: 'referral', label: t.referral, icon: <Share2 className="w-5 h-5" /> },
    { id: 'profile', label: t.profile, icon: <UserIcon className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: t.admin, icon: <Shield className="w-5 h-5 text-red-400" /> });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full bg-[#000000] border-t-4 border-[#000000] shadow-[0_-4px_0_#000000]">
      <div className="max-w-lg mx-auto px-2 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
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
              className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all duration-150 uppercase tracking-wider font-black ${
                isActive
                  ? 'bg-[#00FF00] text-[#000000] border-2 border-[#FFFFFF] shadow-[2px_2px_0px_#FFFFFF] scale-105'
                  : 'text-[#FFFFFF] hover:text-[#00FF00]'
              }`}
            >
              <div className={isActive ? 'text-[#000000]' : 'text-current'}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 font-bold">
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
