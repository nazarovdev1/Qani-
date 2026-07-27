import React, { useState, useEffect } from 'react';
import { Challenge, AdminAnalytics, Submission } from '../../types';
import { Language } from '../../i18n';
import { Shield, Users, Video, AlertTriangle, Plus, CheckCircle2, XCircle, Trash2, Ban, Bell, MessageSquare, MessageCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface AdminDashboardProps {
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang }) => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [flaggedSubs, setFlaggedSubs] = useState<Array<Submission & { userName: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Challenge Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [instruction, setInstruction] = useState('');
  const [example, setExample] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    const [analyticsRes, challengesRes, modRes, notifRes] = await Promise.all([
      apiRequest<AdminAnalytics>('/admin/dashboard'),
      apiRequest<{ challenges: Challenge[] }>('/challenges'),
      apiRequest<{ flaggedSubmissions: Array<Submission & { userName: string }> }>('/admin/moderation'),
      apiRequest<{ notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }> }>('/admin/notifications')
    ]);
    setLoading(false);

    if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    if (challengesRes.success && challengesRes.data?.challenges) setChallenges(challengesRes.data.challenges);
    if (modRes.success && modRes.data?.flaggedSubmissions) setFlaggedSubs(modRes.data.flaggedSubmissions);
    if (notifRes.success && notifRes.data?.notifications) setNotifications(notifRes.data.notifications);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateChallenge = async () => {
    if (!title || !desc || !instruction) {
      setErrorMsg('Sarlavha, tavsif va ko‘rsatmani kiriting.');
      return;
    }

    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

    telegram.haptic('click');

    const res = await apiRequest('/challenges', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: desc,
        instruction,
        example,
        startTime,
        endTime,
        status: 'ACTIVE'
      })
    });

    if (res.success) {
      telegram.haptic('success');
      setShowCreateModal(false);
      setTitle('');
      setDesc('');
      setInstruction('');
      setExample('');
      fetchAdminData();
    } else {
      setErrorMsg(res.error?.message || 'Challenge yaratishda xatolik.');
    }
  };

  const handleModerationAction = async (submissionId: string, action: 'APPROVE' | 'REJECT' | 'REMOVE' | 'BLOCK_USER' | 'WARN_USER', reason?: string) => {
    telegram.haptic('click');
    const res = await apiRequest('/admin/moderation/action', {
      method: 'POST',
      body: JSON.stringify({ submissionId, action, reason })
    });

    if (res.success) {
      telegram.haptic('success');
      fetchAdminData();
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await apiRequest(`/admin/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="space-y-5 pb-20 max-w-lg mx-auto text-[#000000]">
      {/* Header Banner */}
      <div className="bg-[#FF4D00] border-4 border-[#000000] p-4 flex items-center justify-between shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center space-x-2 text-xs font-black uppercase text-[#FFFFFF]">
          <Shield className="w-5 h-5 text-[#FFFFFF]" />
          <span>QANI? Admin Paneli</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notification Bell */}
          <div className="relative">
            <Bell className="w-5 h-5 text-[#FFFFFF]" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#000000] text-[#00FF00] text-[9px] font-black px-1 py-0.5 border border-[#FFFFFF]">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              telegram.haptic('click');
              setShowCreateModal(true);
            }}
            className="py-1.5 px-3 bg-[#000000] text-[#00FF00] hover:bg-[#FFFFFF] hover:text-[#000000] text-xs font-black uppercase border-2 border-[#000000] shadow-[2px_2px_0px_#000000] flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi Challenge</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      {loading ? (
        <div className="h-32 bg-[#F0F0F0] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] animate-pulse" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-3.5 space-y-1 shadow-[4px_4px_0px_#000000]">
            <div className="text-[11px] font-black uppercase text-[#000000]">Jami Foydalanuvchilar</div>
            <div className="text-2xl font-black text-[#000000]">{analytics?.totalUsers || 0}</div>
          </div>

          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-3.5 space-y-1 shadow-[4px_4px_0px_#000000]">
            <div className="text-[11px] font-black uppercase text-[#000000]">Bugungi Yangi / Faol</div>
            <div className="text-2xl font-black text-[#000000]">
              +{analytics?.newUsersToday || 0} / {analytics?.activeToday || 0}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-3.5 space-y-1 shadow-[4px_4px_0px_#000000]">
            <div className="text-[11px] font-black uppercase text-[#000000]">Jami Submissions</div>
            <div className="text-2xl font-black text-[#000000]">{analytics?.totalSubmissions || 0}</div>
          </div>

          <div className="bg-[#00FF00] border-4 border-[#000000] p-3.5 space-y-1 shadow-[4px_4px_0px_#000000]">
            <div className="text-[11px] font-black uppercase text-[#000000]">Queue Success</div>
            <div className="text-2xl font-black text-[#000000]">{analytics?.processingSuccessRate || 100}%</div>
          </div>
        </div>
      )}

      {/* Challenges Management List */}
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
        <h3 className="font-black text-xs uppercase text-[#000000] flex items-center space-x-1.5 border-b-2 border-[#000000] pb-2">
          <Video className="w-4 h-4 text-[#000000]" />
          <span>Mavjud Challenge'lar</span>
        </h3>

        <div className="space-y-2">
          {challenges.map(ch => (
            <div key={ch.id} className="bg-[#F0F0F0] border-2 border-[#000000] p-3 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-[#000000]">{ch.title}</h4>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                  ch.status === 'ACTIVE' ? 'bg-[#00FF00] text-[#000000] border-[#000000]' : 'bg-[#FFFFFF] text-[#000000] border-[#000000]'
                }`}>
                  {ch.status}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#000000]">{ch.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
        <h3 className="font-black text-xs uppercase text-[#FF4D00] flex items-center space-x-1.5 border-b-2 border-[#000000] pb-2">
          <AlertTriangle className="w-4 h-4 text-[#FF4D00]" />
          <span>Moderatsiya Navbati (Report qilinganlar: {flaggedSubs.length})</span>
        </h3>

        {flaggedSubs.length === 0 ? (
          <p className="text-xs font-bold text-[#000000] py-2 text-center">Xabar qilingan videolar mavjud emas.</p>
        ) : (
          <div className="space-y-3">
            {flaggedSubs.map(sub => (
              <div key={sub.id} className="bg-[#F0F0F0] border-2 border-[#000000] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black uppercase text-[#000000]">{sub.userName || 'Foydalanuvchi'}</span>
                  <span className="text-[#FF4D00] font-black">{sub.reportCount} ta report</span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => handleModerationAction(sub.id, 'APPROVE')}
                    className="flex-1 py-1.5 bg-[#00FF00] text-[#000000] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tasdiqlash</span>
                  </button>

                  <button
                    onClick={() => handleModerationAction(sub.id, 'WARN_USER', 'Iltimos, qoidalarga rioya qiling. Keyingi safar ogohlantirishsiz o‘chiriladi.')}
                    className="flex-1 py-1.5 bg-[#FFCC00] text-[#000000] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000]"
                    title="Foydalanuvchini ogohlantirish"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Ogohlantirish</span>
                  </button>

                  <button
                    onClick={() => handleModerationAction(sub.id, 'REMOVE')}
                    className="flex-1 py-1.5 bg-[#FF4D00] text-[#FFFFFF] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>O‘chirish</span>
                  </button>

                  <button
                    onClick={() => handleModerationAction(sub.id, 'BLOCK_USER')}
                    className="py-1.5 px-3 bg-[#000000] text-[#FFFFFF] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center shadow-[2px_2px_0px_#000000]"
                    title="Foydalanuvchini bloklash"
                  >
                    <Ban className="w-3.5 h-3.5 text-[#FF4D00]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
          <h3 className="font-black text-xs uppercase text-[#000000] flex items-center space-x-1.5 border-b-2 border-[#000000] pb-2">
            <Bell className="w-4 h-4 text-[#000000]" />
            <span>Xabarlar ({notifications.filter(n => !n.isRead).length} o‘qilmagan)</span>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-2.5 border-2 border-[#000000] text-xs ${n.isRead ? 'bg-[#F0F0F0]' : 'bg-[#00FF00]'} flex items-start justify-between space-x-2`}
              >
                <div className="flex-1">
                  <p className="font-black uppercase text-[#000000]">{n.title}</p>
                  <p className="text-[10px] font-semibold text-[#000000] mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-[#000000]/60 mt-1">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkNotificationRead(n.id)}
                    className="shrink-0 px-2 py-1 bg-[#000000] text-[#00FF00] text-[9px] font-black uppercase border border-[#000000] hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors"
                  >
                    O‘qildi
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 max-w-sm w-full space-y-3 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-black text-base uppercase text-[#000000] border-b-4 border-[#000000] pb-2">Yangi Daily Challenge Yaratish</h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[#000000] font-black uppercase">Sarlavha:</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Masalan: 10 soniyali reklama"
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div>
                <label className="text-[#000000] font-black uppercase">Tavsifi:</label>
                <input
                  type="text"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Uyda turgan oddiy buyumni reklama qil"
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div>
                <label className="text-[#000000] font-black uppercase">Instruksiya:</label>
                <textarea
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  placeholder="Kamerani yoq, VIP reklama ovozida gapir..."
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none h-16 resize-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div>
                <label className="text-[#000000] font-black uppercase">Misol (ixtiyoriy):</label>
                <input
                  type="text"
                  value={example}
                  onChange={e => setExample(e.target.value)}
                  placeholder="Bu oddiy paypoq emas..."
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>

            {errorMsg && <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center">{errorMsg}</p>}

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000]">
                Bekor qilish
              </button>
              <button onClick={handleCreateChallenge} className="flex-1 py-3 border-2 border-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black uppercase text-[#000000] transition-colors">
                Chiqarish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
