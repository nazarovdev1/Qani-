import React, { useState, useRef, useEffect } from 'react';
import { FeedItem } from '../../types';
import { Language } from '../../i18n';
import { MapPin, Flag, EyeOff, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface VideoCardProps {
  item: FeedItem;
  isLocked: boolean;
  lang: Language;
  currentUser: import('../../types').User | null;
  onUnlockClick: () => void;
  onReportClick: (submissionId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  item,
  isLocked,
  lang,
  currentUser,
  onUnlockClick,
  onReportClick
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [reactions, setReactions] = useState(item.reactionsCount || {});
  const [userReaction, setUserReaction] = useState<string | undefined>(item.userReaction);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Toggle Video Play/Pause
  const togglePlay = () => {
    if (!videoRef.current || isLocked) return;
    telegram.haptic('click');

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Toggle Mute/Unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    telegram.haptic('click');
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle Reaction Toggle
  const handleReaction = async (emoji: '😂' | '🔥' | '👏' | '❤️') => {
    if (isLocked) return;
    telegram.haptic('click');

    // Optimistic UI update
    const prevReaction = userReaction;
    const prevCounts = { ...reactions };

    const newCounts = { ...reactions };
    if (prevReaction === emoji) {
      // Remove reaction
      setUserReaction(undefined);
      newCounts[emoji] = Math.max(0, (newCounts[emoji] || 0) - 1);
    } else {
      // Swap or add
      if (prevReaction) {
        newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] || 0) - 1);
      }
      setUserReaction(emoji);
      newCounts[emoji] = (newCounts[emoji] || 0) + 1;
    }
    setReactions(newCounts);

    const res = await apiRequest('/reactions/toggle', {
      method: 'POST',
      body: JSON.stringify({
        submissionId: item.id,
        emoji
      })
    });

    if (!res.success) {
      // Rollback on failure
      setUserReaction(prevReaction);
      setReactions(prevCounts);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border-4 border-[#000000] shadow-[8px_8px_0px_#000000] relative text-[#000000] overflow-hidden">
      {/* Top Header: User Info & Region */}
      <div className="p-3.5 flex items-center justify-between border-b-4 border-[#000000] bg-[#00FF00]">
        <div className="flex items-center space-x-2.5">
          <img
            src={item.user.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={item.user.firstName}
            className="w-10 h-10 object-cover border-2 border-[#000000]"
          />
          <div>
            <h4 className="font-black text-xs text-[#000000] uppercase tracking-tight">
              {item.user.firstName} {item.user.lastName || ''}
            </h4>
            <div className="flex items-center space-x-1.5 text-[10px] text-[#000000] font-bold">
              {item.user.username && <span>@{item.user.username}</span>}
              <span>•</span>
              <span className="flex items-center space-x-0.5 font-extrabold uppercase">
                <MapPin className="w-3 h-3 text-[#000000]" />
                <span>{item.user.region || 'O‘zbekiston'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Report Button */}
        <button
          onClick={() => onReportClick(item.id)}
          className="text-[#000000] hover:text-[#FF4D00] p-1.5 border-2 border-[#000000] bg-[#FFFFFF] shadow-[2px_2px_0px_#000000] transition-colors"
          title="Xabar qilish"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Main Media Player / Locked Blur Screen */}
      <div
        className="relative w-full aspect-[9/16] max-h-[480px] bg-[#000000] flex items-center justify-center cursor-pointer overflow-hidden border-b-4 border-[#000000]"
        onClick={togglePlay}
      >
        {isLocked ? (
          /* Locked Overlay */
          <div className="absolute inset-0 bg-[#000000] flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 text-[#FFFFFF]">
            <div className="w-14 h-14 bg-[#00FF00] text-[#000000] flex items-center justify-center border-4 border-[#FFFFFF] shadow-[4px_4px_0px_#FFFFFF]">
              <EyeOff className="w-7 h-7" />
            </div>
            <h3 className="font-black text-base uppercase text-[#00FF00] tracking-wider">Video Qulflangan!</h3>
            <p className="text-xs font-semibold text-[#FFFFFF] leading-relaxed max-w-xs">
              Do‘stlaringizning videolarini tomosha qilish uchun avval bugungi challenge topshirig‘ini bajaring.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlockClick();
              }}
              className="py-3 px-6 bg-[#00FF00] text-[#000000] font-black text-xs uppercase border-2 border-[#FFFFFF] shadow-[4px_4px_0px_#FFFFFF] hover:bg-[#FFFFFF] transition-colors"
            >
              Topshiriqni Bajarish
            </button>
          </div>
        ) : (
          /* Active Video Player */
          <>
            <video
              ref={videoRef}
              src={item.videoUrl}
              playsInline
              loop
              preload="metadata"
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause Center Indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-[#000000]/40 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#00FF00] border-4 border-[#000000] flex items-center justify-center text-[#000000] shadow-[4px_4px_0px_#000000]">
                  <Play className="w-8 h-8 fill-[#000000] ml-1" />
                </div>
              </div>
            )}

            {/* Mute/Unmute Overlay Toggle */}
            <button
              onClick={toggleMute}
              className="absolute top-3 right-3 p-2 bg-[#000000] text-[#00FF00] border-2 border-[#00FF00] shadow-[2px_2px_0px_#000000] hover:bg-[#00FF00] hover:text-[#000000] z-10 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>

      {/* Bottom Footer: Reactions Bar */}
      <div className="p-3 bg-[#F0F0F0] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {(['😂', '🔥', '👏', '❤️'] as const).map(emoji => {
            const count = reactions[emoji] || 0;
            const isSelected = userReaction === emoji;
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={isLocked}
                className={`flex items-center space-x-1 px-3 py-1.5 border-2 border-[#000000] text-xs font-black transition-all ${
                  isSelected
                    ? 'bg-[#00FF00] text-[#000000] shadow-[2px_2px_0px_#000000] scale-105'
                    : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#00FF00] shadow-[2px_2px_0px_#000000]'
                } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="text-[11px] font-black">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection
        submissionId={item.id}
        currentUser={currentUser}
        isLocked={isLocked}
        lang={lang}
      />
    </div>
  );
};
