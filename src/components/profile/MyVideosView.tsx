import React, { useState, useEffect } from 'react';
import { FeedItem, Challenge, User } from '../../types';
import { Language, translations } from '../../i18n';
import { VideoCard } from '../feed/VideoCard';
import { apiRequest } from '../../lib/api';
import { Video, Clock, Calendar } from 'lucide-react';

interface MyVideosViewProps {
  lang: Language;
  currentUser: User;
}

interface VideoWithChallenge extends FeedItem {
  challenge: Challenge;
}

export const MyVideosView: React.FC<MyVideosViewProps> = ({ lang, currentUser }) => {
  const t = translations[lang];
  const [videos, setVideos] = useState<VideoWithChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchVideos = async (pageNum: number) => {
    setLoading(true);
    const res = await apiRequest<{
      submissions: VideoWithChallenge[];
      total: number;
      hasMore: boolean;
    }>(`/profile/my-videos?page=${pageNum}&limit=20`);

    setLoading(false);

    if (res.success && res.data) {
      setVideos(prev => pageNum === 1 ? res.data.submissions : [...prev, ...res.data.submissions]);
      setTotal(res.data.total);
      setHasMore(res.data.hasMore);
    }
  };

  useEffect(() => {
    fetchVideos(1);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchVideos(page + 1);
    }
  };

  const isToday = (challenge: Challenge) => {
    const now = new Date();
    const startTime = new Date(challenge.startTime);
    const endTime = new Date(challenge.endTime);
    return now >= startTime && now <= endTime;
  };

  if (loading && videos.length === 0) {
    return (
      <div className="space-y-4 py-8 max-w-lg mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-[#000000] border-4 border-[#00FF00] p-4 shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-[#00FF00]" />
            <h2 className="text-[#00FF00] font-black text-sm uppercase tracking-wider">
              {t.myVideos || 'Mening Videolarim'}
            </h2>
          </div>
          <span className="text-[#FFFFFF] text-xs font-bold bg-[#333] px-2 py-1 rounded">
            {total} ta
          </span>
        </div>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <div className="bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] p-8 text-center space-y-4">
          <Video className="w-16 h-16 text-[#666] mx-auto" />
          <h3 className="font-black text-lg text-[#000000]">
            Sizda hali videolar yo'q
          </h3>
          <p className="text-xs font-semibold text-[#666]">
            Bugungi challenge'da ishtirok etib, birinchi videongizni yuklang!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {videos.map((video, index) => (
            <div key={video.id} className="relative">
              <VideoCard
                item={video}
                isLocked={false}
                lang={lang}
                currentUser={currentUser}
                onUnlockClick={() => {}}
                onReportClick={() => {}}
              />
              {/* Challenge Info Badge */}
              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
                {isToday(video.challenge) ? (
                  <span className="bg-[#00FF00] text-[#000000] px-2 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-[#000000]">
                    Bugungi
                  </span>
                ) : (
                  <span className="bg-[#666] text-[#FFFFFF] px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-2 border-[#000000]">
                    {video.challenge.title.length > 20
                      ? video.challenge.title.substring(0, 20) + '...'
                      : video.challenge.title}
                  </span>
                )}
              </div>
              {/* Date Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-[#000000]/80 text-[#FFFFFF] px-2 py-1 text-[9px] font-bold flex items-center space-x-1 border border-[#333]">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(video.createdAt).toLocaleDateString('uz-UZ', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </span>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-[#000000] text-[#00FF00] border-4 border-[#00FF00] font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:bg-[#00FF00] hover:text-[#000000] transition-colors disabled:opacity-50"
              >
                {loading ? 'Yuklanmoqda...' : 'Ko'proq yuklash'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
