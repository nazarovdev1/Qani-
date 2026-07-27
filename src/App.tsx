import React, { useState, useEffect } from 'react';
import { User, Challenge, Submission } from './types';
import { Language } from './i18n';
import { Header } from './components/layout/Header';
import { Navbar, TabType } from './components/layout/Navbar';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { TodayChallengeCard } from './components/challenge/TodayChallengeCard';
import { CameraRecorder } from './components/camera/CameraRecorder';
import { VideoFeed } from './components/feed/VideoFeed';
import { GroupManager } from './components/groups/GroupManager';
import { ReferralCard } from './components/referral/ReferralCard';
import { ProfileView } from './components/profile/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
import { apiRequest } from './lib/api';
import { telegram } from './lib/telegram';
import { Clock, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | null>(null);
  const [lang, setLang] = useState<Language>('uz');

  // Active Challenge States
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [userSubmission, setUserSubmission] = useState<Submission | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Camera Overlay
  const [showCamera, setShowCamera] = useState(false);

  // Next Challenge Countdown
  const [nextChallengeTime, setNextChallengeTime] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });

  // Initialize App Data & Auth
  const loadUserData = async (attempt = 1) => {
    setLoading(true);
    telegram.ready();

    const authRes = await apiRequest<{ user: User }>('/auth/me');

    // Agar 401 kelib chiqsa va Telegram'da bo'lsak, retry qilamiz
    // (initData inject ketma-ketligi kechikishi mumkin)
    if (!authRes.success && authRes.error?.code === 'UNAUTHORIZED' && attempt < 3 && (telegram.user || telegram.webApp)) {
      console.log(`[App] Auth failed, retrying in ${attempt * 1.5}s (attempt ${attempt})`);
      setTimeout(() => loadUserData(attempt + 1), attempt * 1500);
      return;
    }

    if (authRes.success && authRes.data?.user) {
      setUser(authRes.data.user);
    }

    const challengeRes = await apiRequest<{ challenge: Challenge; userSubmission?: Submission }>('/challenges/active');
    if (challengeRes.success && challengeRes.data?.challenge) {
      setActiveChallenge(challengeRes.data.challenge);
      setUserSubmission(challengeRes.data.userSubmission);
      setNextChallengeTime(null);
    } else {
      // No active challenge — fetch next challenge time
      setActiveChallenge(null);
      const scheduleRes = await apiRequest<{ nextChallengeTime: string }>('/admin/schedule');
      if (scheduleRes.success && scheduleRes.data?.nextChallengeTime) {
        setNextChallengeTime(scheduleRes.data.nextChallengeTime);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Countdown timer for next challenge
  useEffect(() => {
    if (!nextChallengeTime) return;

    const calculateTime = () => {
      const target = new Date(nextChallengeTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextChallengeTime]);

  // Handler after Onboarding completion
  const handleOnboardingComplete = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Handler after Video Submission
  const handleCameraSuccess = () => {
    setShowCamera(false);
    loadUserData();
    setActiveTab('feed');
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FFFFFF] text-[#000000] font-sans antialiased selection:bg-[#00FF00] selection:text-[#000000]">
      {/* Top Header */}
      <Header
        user={user}
        lang={lang}
        onLanguageChange={setLang}
        onRefreshUser={loadUserData}
      />

      {/* Main Content Area */}
      <main className="w-full px-4 py-6 max-w-lg mx-auto pb-[calc(6rem+env(safe-area-inset-bottom))] overflow-x-hidden">
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="h-48 bg-[#F0F0F0] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] animate-pulse" />
            <div className="h-24 bg-[#F0F0F0] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] animate-pulse" />
          </div>
        ) : !user || !user.onboardingDone ? (
          /* Onboarding Modal */
          <OnboardingModal
            lang={lang}
            onComplete={handleOnboardingComplete}
          />
        ) : legalPage === 'privacy' ? (
          <PrivacyPolicy onBack={() => setLegalPage(null)} />
        ) : legalPage === 'terms' ? (
          <TermsOfService onBack={() => setLegalPage(null)} />
        ) : (
          /* Active Tab View */
          <>
            {activeTab === 'today' && (
              <div className="space-y-4 pb-20">
                {activeChallenge ? (
                  <TodayChallengeCard
                    challenge={activeChallenge}
                    submission={userSubmission}
                    lang={lang}
                    onStartClick={() => setShowCamera(true)}
                    onViewFeedClick={() => setActiveTab('feed')}
                  />
                ) : nextChallengeTime ? (
                  <div className="bg-[#000000] border-4 border-[#00FF00] p-6 shadow-[8px_8px_0px_#00FF00] text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-[#00FF00] font-black text-sm uppercase tracking-wider">
                      <Sparkles className="w-5 h-5" />
                      <span>Keyingi Challenge</span>
                    </div>
                    <div className="text-4xl font-black text-[#00FF00] font-mono tracking-wider">
                      {String(countdown.hours).padStart(2, '0')}:
                      {String(countdown.minutes).padStart(2, '0')}:
                      {String(countdown.seconds).padStart(2, '0')}
                    </div>
                    <div className="flex items-center justify-center space-x-1.5 text-[#FFFFFF]/80 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>dan so‘ng boshlanadi</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#000000] border-4 border-[#000000] p-8 text-center text-[#FFFFFF]/60 font-bold text-sm shadow-[6px_6px_0px_#000000]">
                    Hozircha faol topshiriq yo‘q. Tez orada kutib qoling!
                  </div>
                )}
              </div>
            )}

            {activeTab === 'feed' && (
              <VideoFeed
                lang={lang}
                currentUser={user}
                onNavigateToChallenge={() => setActiveTab('today')}
              />
            )}

            {activeTab === 'groups' && (
              <GroupManager user={user} lang={lang} />
            )}

            {activeTab === 'referral' && (
              <ReferralCard user={user} lang={lang} />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                lang={lang}
                onNavigateLegal={setLegalPage}
                onUpdateUser={setUser}
                onNavigateAdmin={() => setActiveTab('admin')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard lang={lang} currentUser={user} />
            )}
          </>
        )}
      </main>

      {/* In-App Camera Overlay */}
      {showCamera && activeChallenge && (
        <CameraRecorder
          challenge={activeChallenge}
          lang={lang}
          onSuccess={handleCameraSuccess}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Bottom Mobile Navigation */}
      {user && user.onboardingDone && !legalPage && (
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          lang={lang}
        />
      )}
    </div>
  );
}
