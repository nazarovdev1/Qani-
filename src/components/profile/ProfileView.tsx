import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Language, translations, regionsUzbekistan } from '../../i18n';
import { Flame, Trophy, CheckCircle, Users, MapPin, Trash2, FileText, Shield, LogOut } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface ProfileViewProps {
  user: User;
  lang: Language;
  onNavigateLegal: (page: 'privacy' | 'terms') => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  lang,
  onNavigateLegal,
  onUpdateUser
}) => {
  const t = translations[lang];
  const [stats, setStats] = useState<{ challengesCompleted: number; activeReferralsCount: number } | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(user.region || 'Toshkent shahri');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const res = await apiRequest<{ user: User; challengesCompleted: number; activeReferralsCount: number }>('/profile');
      if (res.success && res.data) {
        setStats({
          challengesCompleted: res.data.challengesCompleted,
          activeReferralsCount: res.data.activeReferralsCount
        });
      }
    }
    fetchProfile();
  }, [user.id]);

  const handleUpdateRegion = async () => {
    setLoading(true);
    telegram.haptic('click');

    const res = await apiRequest<{ user: User }>('/profile/region', {
      method: 'PUT',
      body: JSON.stringify({ region: selectedRegion })
    });

    setLoading(false);

    if (res.success && res.data?.user) {
      telegram.haptic('success');
      onUpdateUser(res.data.user);
      setShowRegionModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    telegram.haptic('click');

    const res = await apiRequest('/profile/delete-account', {
      method: 'POST'
    });

    setLoading(false);

    if (res.success) {
      telegram.haptic('success');
      alert('Hisobingiz o‘chirildi va ma‘lumotlar anonimlashtirildi.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-5 pb-20 max-w-lg mx-auto text-[#000000]">
      {/* User Header Profile Card */}
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-6 shadow-[8px_8px_0px_#000000] text-center space-y-4">
        <div className="relative inline-block mx-auto">
          <img
            src={user.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={user.firstName}
            className="w-24 h-24 object-cover border-4 border-[#000000] shadow-[4px_4px_0px_#000000]"
          />
          <div className="absolute -bottom-2 -right-2 bg-[#00FF00] text-[#000000] px-2 py-0.5 border-2 border-[#000000] text-xs font-black uppercase shadow-[2px_2px_0px_#000000]">
            🔥 {user.currentStreak}d
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black uppercase text-[#000000] tracking-tight">
            {user.firstName} {user.lastName || ''}
          </h2>
          {user.username && <p className="text-xs font-bold text-[#000000]">@{user.username}</p>}

          <button
            onClick={() => setShowRegionModal(true)}
            className="inline-flex items-center space-x-1.5 mt-3 text-xs font-black uppercase text-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] px-4 py-1.5 border-2 border-[#000000] shadow-[2px_2px_0px_#000000] transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>{user.region || 'Toshkent shahri'}</span>
          </button>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 space-y-1 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#000000]">
            <Flame className="w-4 h-4 text-[#FF4D00]" />
            <span>Hozirgi Streak</span>
          </div>
          <div className="text-2xl font-black text-[#000000]">{user.currentStreak} KUN</div>
        </div>

        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 space-y-1 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#000000]">
            <Trophy className="w-4 h-4 text-[#000000]" />
            <span>Eng Uzun Streak</span>
          </div>
          <div className="text-2xl font-black text-[#000000]">{user.longestStreak} KUN</div>
        </div>

        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 space-y-1 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#000000]">
            <CheckCircle className="w-4 h-4 text-[#000000]" />
            <span>Bajargan Challenge</span>
          </div>
          <div className="text-2xl font-black text-[#000000]">{stats?.challengesCompleted || 0} TA</div>
        </div>

        <div className="bg-[#00FF00] border-4 border-[#000000] p-4 space-y-1 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#000000]">
            <Users className="w-4 h-4 text-[#000000]" />
            <span>Aktiv Takliflar</span>
          </div>
          <div className="text-2xl font-black text-[#000000]">{stats?.activeReferralsCount || 0} TA</div>
        </div>
      </div>

      {/* Settings & Legal Links */}
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-2 space-y-2 shadow-[6px_6px_0px_#000000]">
        <button
          onClick={() => onNavigateLegal('privacy')}
          className="w-full p-3 border-2 border-[#000000] bg-[#F0F0F0] hover:bg-[#00FF00] flex items-center justify-between text-xs font-black uppercase text-[#000000] transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-[#000000]" />
            <span>Maxfiylik Siyosati (Privacy Policy)</span>
          </div>
          <span className="font-black">&rarr;</span>
        </button>

        <button
          onClick={() => onNavigateLegal('terms')}
          className="w-full p-3 border-2 border-[#000000] bg-[#F0F0F0] hover:bg-[#00FF00] flex items-center justify-between text-xs font-black uppercase text-[#000000] transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <FileText className="w-4 h-4 text-[#000000]" />
            <span>Foydalanish Shartlari (Terms)</span>
          </div>
          <span className="font-black">&rarr;</span>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full p-3 border-2 border-[#000000] bg-[#FF4D00] hover:bg-[#000000] hover:text-[#FF4D00] flex items-center justify-between text-xs font-black uppercase text-[#FFFFFF] transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Trash2 className="w-4 h-4" />
            <span>Hisobni O‘chirish</span>
          </div>
        </button>
      </div>

      {/* Modal: Update Region */}
      {showRegionModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 max-w-sm w-full space-y-4 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-black text-base uppercase border-b-4 border-[#000000] pb-2 text-[#000000]">Hududni O‘zgartirish</h3>

            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2.5 text-xs font-bold text-[#000000] focus:outline-none focus:bg-[#00FF00]/20 shadow-[2px_2px_0px_#000000]"
            >
              {regionsUzbekistan.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowRegionModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000]">
                Bekor qilish
              </button>
              <button onClick={handleUpdateRegion} disabled={loading} className="flex-1 py-3 border-2 border-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black uppercase text-[#000000] transition-colors">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 max-w-sm w-full space-y-4 shadow-[8px_8px_0px_#000000] text-center">
            <Trash2 className="w-12 h-12 text-[#FF4D00] mx-auto" />
            <h3 className="font-black text-base uppercase text-[#000000]">Hisobni o‘chirishni tasdiqlaysizmi?</h3>
            <p className="text-xs font-semibold text-[#000000]">
              Ushbu amal barcha shaxsiy ma'lumotlaringizni anonimlashtiradi va videolaringizni o‘chirib tashlaydi.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000]">
                Bekor qilish
              </button>
              <button onClick={handleDeleteAccount} disabled={loading} className="flex-1 py-3 border-2 border-[#000000] bg-[#FF4D00] text-xs font-black uppercase text-[#FFFFFF] hover:bg-[#000000] transition-colors">
                O‘chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
