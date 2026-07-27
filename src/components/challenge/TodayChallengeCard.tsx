import React, { useState, useEffect } from 'react';
import { Challenge, Submission } from '../../types';
import { Language, translations } from '../../i18n';
import { Flame, Clock, Sparkles, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { telegram } from '../../lib/telegram';

interface TodayChallengeCardProps {
  challenge: Challenge;
  submission?: Submission;
  lang: Language;
  onStartClick: () => void;
  onViewFeedClick: () => void;
}

export const TodayChallengeCard: React.FC<TodayChallengeCardProps> = ({
  challenge,
  submission,
  lang,
  onStartClick,
  onViewFeedClick
}) => {
  const t = translations[lang];
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const end = new Date(challenge.endTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [challenge.endTime]);

  const isCompleted = submission && submission.processingStatus === 'READY';
  const isProcessing = submission && submission.processingStatus === 'PROCESSING';

  return (
    <div className="bg-[#FFFFFF] border-4 border-[#000000] p-6 shadow-[8px_8px_0px_#000000] relative text-[#000000] space-y-5">
      {/* Top Badge & Countdown Header */}
      <div className="flex items-center justify-between border-b-4 border-[#000000] pb-4">
        <div className="flex items-center space-x-2 bg-[#000000] text-[#00FF00] px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
          <Flame className="w-4 h-4 fill-[#00FF00]" />
          <span>Bugungi Challenge</span>
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-1.5 text-xs font-mono font-black text-[#000000] bg-[#00FF00] px-3 py-1.5 border-2 border-[#000000] shadow-[2px_2px_0px_#000000]">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Challenge Content */}
      <div className="space-y-4">
        <h2 className="text-3xl sm:text-4xl font-black text-[#000000] tracking-tighter uppercase leading-[0.95] break-words">
          {challenge.title}
        </h2>

        <p className="text-sm text-[#000000] leading-relaxed font-semibold">
          {challenge.description}
        </p>

        {/* Detailed Instruction box */}
        <div className="bg-[#F0F0F0] border-3 border-[#000000] p-4 space-y-2 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#000000]">
            <Sparkles className="w-4 h-4 text-[#FF4D00]" />
            <span>Ko‘rsatma:</span>
          </div>
          <p className="text-xs text-[#000000] font-medium leading-normal">
            {challenge.instruction}
          </p>

          {challenge.example && (
            <p className="text-[11px] text-[#000000] italic pt-2 border-t-2 border-[#000000] font-bold">
              Misol: {challenge.example}
            </p>
          )}
        </div>
      </div>

      {/* Actions / Status */}
      {isCompleted ? (
        <div className="space-y-3">
          <div className="bg-[#00FF00] border-3 border-[#000000] p-4 text-center space-y-1 shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center justify-center space-x-2 text-[#000000] font-black text-sm uppercase">
              <CheckCircle className="w-5 h-5" />
              <span>Bugungi topshiriq muvaffaqiyatli bajarildi!</span>
            </div>
            <p className="text-xs font-bold text-[#000000]">
              Endi do‘stlaringiz videolarini to‘liq tomosha qilishingiz mumkin.
            </p>
          </div>

          <button
            onClick={() => {
              telegram.haptic('click');
              onViewFeedClick();
            }}
            className="w-full py-4 bg-[#000000] text-[#FFFFFF] hover:bg-[#00FF00] hover:text-[#000000] border-3 border-[#000000] font-black text-sm uppercase tracking-wider transition-colors shadow-[4px_4px_0px_#000000] flex items-center justify-center space-x-2"
          >
            <span>Do‘stlar videosini ko‘rish</span>
          </button>
        </div>
      ) : isProcessing ? (
        <div className="bg-[#FF4D00] text-[#FFFFFF] border-3 border-[#000000] p-4 text-center space-y-2 shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center justify-center space-x-2 font-black text-xs uppercase">
            <AlertCircle className="w-5 h-5 animate-spin" />
            <span>Videongiz ishlanmoqda (720p HD optimizatsiya)...</span>
          </div>
          <p className="text-xs font-bold">
            Bir necha soniyadan so‘ng video tayyor bo‘ladi.
          </p>
        </div>
      ) : (
        <button
          onClick={() => {
            telegram.haptic('click');
            onStartClick();
          }}
          className="w-full py-5 bg-[#000000] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#000000] border-4 border-[#000000] font-black text-base uppercase tracking-tight shadow-[6px_6px_0px_#000000] flex items-center justify-center space-x-3 transition-colors active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Video className="w-6 h-6" />
          <span>Kamerani Ochish (Video Yozish)</span>
        </button>
      )}
    </div>
  );
};
