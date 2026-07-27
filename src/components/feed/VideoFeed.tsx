import React, { useState, useEffect } from 'react';
import { FeedItem, Challenge, User } from '../../types';
import { Language, translations } from '../../i18n';
import { VideoCard } from './VideoCard';
import { ReportModal } from './ReportModal';
import { apiRequest } from '../../lib/api';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';

interface VideoFeedProps {
  lang: Language;
  currentUser: User | null;
  onNavigateToChallenge: () => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ lang, currentUser, onNavigateToChallenge }) => {
  const t = translations[lang];
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportSubmissionId, setReportSubmissionId] = useState<string | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    const res = await apiRequest<{ isLocked: boolean; feed: FeedItem[]; challenge: Challenge }>('/feed/today');
    setLoading(false);

    if (res.success && res.data) {
      setFeed(res.data.feed || []);
      setIsLocked(res.data.isLocked);
      setChallenge(res.data.challenge);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 py-4 max-w-lg mx-auto">
        {[1, 2].map(i => (
          <div key={i} className="bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] h-96 animate-pulse p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#000000]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-[#000000] w-1/3" />
                <div className="h-2 bg-[#000000]/60 w-1/4" />
              </div>
            </div>
            <div className="w-full h-64 bg-[#F0F0F0] border-2 border-[#000000]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 max-w-lg mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-[#00FF00] border-4 border-[#000000] p-4 text-[#000000] shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider">
          <Users className="w-5 h-5" />
          <span>Do‘stlar va Guruhlar Feed</span>
        </div>

        <button
          onClick={fetchFeed}
          className="text-[#000000] p-1.5 border-2 border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#00FF00] transition-colors"
          title="Yangilash"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Feed List */}
      {feed.length === 0 ? (
        <div className="bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] p-8 text-center text-[#000000] space-y-4">
          <AlertCircle className="w-12 h-12 text-[#FF4D00] mx-auto" />
          <h3 className="font-black text-lg uppercase">Hozircha videolar yo‘q</h3>
          <p className="text-xs font-semibold text-[#000000]">
            Birinchi bo‘lib bugungi challenge videosini yuklang va do‘stlaringizni taklif qiling!
          </p>
          <button
            onClick={onNavigateToChallenge}
            className="py-3 px-6 bg-[#000000] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#000000] border-3 border-[#000000] font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000000] transition-colors"
          >
            Topshiriqqa O‘tish
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {feed.map(item => (
            <VideoCard
              key={item.id}
              item={item}
              isLocked={isLocked}
              lang={lang}
              currentUser={currentUser}
              onUnlockClick={onNavigateToChallenge}
              onReportClick={(id) => setReportSubmissionId(id)}
            />
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportSubmissionId && (
        <ReportModal
          submissionId={reportSubmissionId}
          onClose={() => setReportSubmissionId(null)}
        />
      )}
    </div>
  );
};
