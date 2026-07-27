import React, { useState, useEffect } from 'react';
import { User, ReferralStats } from '../../types';
import { Language, translations } from '../../i18n';
import { Share2, Copy, Check, Users, Sparkles, UserCheck, Eye } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface ReferralCardProps {
  user: User;
  lang: Language;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ user, lang }) => {
  const t = translations[lang];
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralLink = `https://t.me/qani_app_bot/app?startapp=ref_${user.id}`;
  const shareText = `“Men bugungi QANI? topshirig‘ini bajardim. Sen ham qila olasanmi? Kamerada ko‘rsat!”`;

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const res = await apiRequest<{ referralCode: string; referralLink: string; stats: ReferralStats }>('/referrals/stats');
      setLoading(false);
      if (res.success && res.data?.stats) {
        setStats(res.data.stats);
      }
    }
    fetchStats();
  }, [user.id]);

  const handleCopy = () => {
    telegram.haptic('click');
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    telegram.haptic('click');
    telegram.shareUrl(referralLink, shareText);
  };

  return (
    <div className="space-y-5 pb-20 max-w-lg mx-auto text-[#000000]">
      {/* Invite Hero Card */}
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-6 shadow-[8px_8px_0px_#000000] relative space-y-4">
        <div className="flex items-center space-x-2 text-xs font-black uppercase text-[#000000] bg-[#00FF00] px-3 py-1 border-2 border-[#000000] shadow-[2px_2px_0px_#000000] w-max">
          <Sparkles className="w-4 h-4" />
          <span>Do‘stlarni Taklif Qiling</span>
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#000000] tracking-tighter uppercase leading-tight">
            “Gap bilan emas, kamerada ko‘rsat.”
          </h2>
          <p className="text-xs font-bold text-[#000000] mt-2 leading-relaxed">
            Do‘stlaringizni taklif qiling, ularning kundalik videolarini tomosha qiling va birgalikda streak yig‘ing!
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleShareTelegram}
            className="w-full py-4 bg-[#000000] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#000000] border-4 border-[#000000] font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000000] flex items-center justify-center space-x-2 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Telegram‘da Ulashish</span>
          </button>

          <div className="flex items-center space-x-2 bg-[#F0F0F0] border-2 border-[#000000] p-2 pl-3 shadow-[2px_2px_0px_#000000]">
            <span className="text-[11px] font-mono font-bold text-[#000000] truncate flex-1">
              {referralLink}
            </span>
            <button
              onClick={handleCopy}
              className="py-1.5 px-3 bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black text-[#000000] uppercase border-2 border-[#000000] flex items-center space-x-1 shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#000000]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxalandi!' : 'Nusxalash'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inviter Stats Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-3 text-center space-y-1 shadow-[4px_4px_0px_#000000]">
          <Eye className="w-5 h-5 text-[#000000] mx-auto" />
          <div className="text-2xl font-black text-[#000000]">{stats?.linkOpens || 0}</div>
          <div className="text-[10px] font-black uppercase text-[#000000]">Link ochganlar</div>
        </div>

        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-3 text-center space-y-1 shadow-[4px_4px_0px_#000000]">
          <Users className="w-5 h-5 text-[#000000] mx-auto" />
          <div className="text-2xl font-black text-[#000000]">{stats?.signups || 0}</div>
          <div className="text-[10px] font-black uppercase text-[#000000]">Ro‘yxatdan o‘tgan</div>
        </div>

        <div className="bg-[#00FF00] border-4 border-[#000000] p-3 text-center space-y-1 shadow-[4px_4px_0px_#000000]">
          <UserCheck className="w-5 h-5 text-[#000000] mx-auto" />
          <div className="text-2xl font-black text-[#000000]">{stats?.activated || 0}</div>
          <div className="text-[10px] font-black uppercase text-[#000000]">Aktiv Foydalanuvchilar</div>
        </div>
      </div>

      {/* Invited Friends List */}
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
        <h3 className="font-black text-xs uppercase text-[#000000] flex items-center space-x-1.5 border-b-2 border-[#000000] pb-2">
          <Users className="w-4 h-4 text-[#000000]" />
          <span>Taklif Qilingan Do‘stlar ({stats?.referralsList?.length || 0})</span>
        </h3>

        {loading ? (
          <div className="h-20 bg-[#F0F0F0] border-2 border-[#000000] animate-pulse" />
        ) : !stats?.referralsList || stats.referralsList.length === 0 ? (
          <p className="text-xs font-bold text-[#000000] py-3 text-center">
            Hozircha hech kim taklif qilinmagan. Birinchi bo‘lib ulashing!
          </p>
        ) : (
          <div className="space-y-2">
            {stats.referralsList.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-[#F0F0F0] p-3 border-2 border-[#000000]">
                <div className="flex items-center space-x-2.5">
                  <img
                    src={item.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={item.name}
                    className="w-8 h-8 border border-[#000000] object-cover"
                  />
                  <div>
                    <h5 className="font-black text-xs uppercase text-[#000000]">{item.name}</h5>
                    {item.username && <p className="text-[10px] font-bold text-[#000000]">@{item.username}</p>}
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                  item.isActivated
                    ? 'bg-[#00FF00] text-[#000000] border-[#000000]'
                    : 'bg-[#FFFFFF] text-[#000000] border-[#000000]'
                }`}>
                  {item.isActivated ? 'Aktiv' : 'Kutilmoqda'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
