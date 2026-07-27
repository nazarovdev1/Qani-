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
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

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
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
                    Bugun aktiv topshiriq e’lon qilinmagan. Tez orada kutib qoling!
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
