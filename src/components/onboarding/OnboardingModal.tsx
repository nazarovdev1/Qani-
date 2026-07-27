import React, { useState } from 'react';
import { Language, translations, regionsUzbekistan } from '../../i18n';
import { Camera, Calendar, EyeOff, CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { User } from '../../types';
import { telegram } from '../../lib/telegram';

interface OnboardingModalProps {
  lang: Language;
  onComplete: (user: User) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ lang, onComplete }) => {
  const t = translations[lang];
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [region, setRegion] = useState('Toshkent shahri');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!ageConfirmed) {
      setErrorMsg('Iltimos, 18 yoshdan katta ekanligingizni tasdiqlang.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    telegram.haptic('click');

    const res = await apiRequest<{ user: User }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        ageConfirmed: true,
        region
      })
    });

    setLoading(false);

    if (res.success && res.data?.user) {
      telegram.haptic('success');
      onComplete(res.data.user);
    } else {
      setErrorMsg(res.error?.message || 'Xatolik yuz berdi. Qayta urinib ko‘ring.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-6 max-w-md w-full shadow-[10px_10px_0px_#000000] text-[#000000] space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-[#00FF00] border-2 border-[#000000] px-3 py-1 text-xs font-black uppercase text-[#000000] shadow-[2px_2px_0px_#000000]">
            <Sparkles className="w-4 h-4 text-[#000000]" />
            <span>QANI? Qo‘shiling!</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#000000]">
            “Gap bilan emas, kamerada ko‘rsat.”
          </h2>
          <p className="text-xs font-bold text-[#000000]">
            QANI? platformasida ishtirok etish uchun 3 ta asosiy qoida bilan tanishing:
          </p>
        </div>

        {/* 3 Core Rules */}
        <div className="space-y-3">
          {/* Rule 1 */}
          <div className="flex items-start space-x-3.5 p-3.5 bg-[#F0F0F0] border-2 border-[#000000] shadow-[2px_2px_0px_#000000]">
            <div className="p-2 bg-[#00FF00] border border-[#000000] text-[#000000] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase text-[#000000]">{t.rule1Title}</h3>
              <p className="text-xs font-semibold text-[#000000] leading-relaxed mt-0.5">{t.rule1Desc}</p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start space-x-3.5 p-3.5 bg-[#F0F0F0] border-2 border-[#000000] shadow-[2px_2px_0px_#000000]">
            <div className="p-2 bg-[#00FF00] border border-[#000000] text-[#000000] shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase text-[#000000]">{t.rule2Title}</h3>
              <p className="text-xs font-semibold text-[#000000] leading-relaxed mt-0.5">{t.rule2Desc}</p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start space-x-3.5 p-3.5 bg-[#F0F0F0] border-2 border-[#000000] shadow-[2px_2px_0px_#000000]">
            <div className="p-2 bg-[#FF4D00] border border-[#000000] text-[#FFFFFF] shrink-0">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase text-[#000000]">{t.rule3Title}</h3>
              <p className="text-xs font-semibold text-[#000000] leading-relaxed mt-0.5">{t.rule3Desc}</p>
            </div>
          </div>
        </div>

        {/* Region & 18+ Confirmation */}
        <div className="space-y-4 pt-2 border-t-4 border-[#000000]">
          {/* Region Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#000000] flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#000000]" />
              <span>{t.selectRegion}</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-[#F0F0F0] border-2 border-[#000000] px-3 py-2.5 text-xs font-bold text-[#000000] focus:outline-none focus:bg-[#00FF00]/20 shadow-[2px_2px_0px_#000000]"
            >
              {regionsUzbekistan.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Age 18+ Checkbox */}
          <label className="flex items-center space-x-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="w-5 h-5 border-2 border-[#000000] accent-[#00FF00]"
            />
            <span className="text-xs font-bold text-[#000000] uppercase">
              {t.ageConfirmLabel}
            </span>
          </label>
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center">
            {errorMsg}
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !ageConfirmed}
          className="w-full py-4 bg-[#000000] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#000000] border-4 border-[#000000] font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000000] flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{loading ? 'YUKLANMOQDA...' : t.finishOnboarding}</span>
        </button>
      </div>
    </div>
  );
};
