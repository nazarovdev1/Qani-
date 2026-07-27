import React, { useState, useEffect } from 'react';
import { Challenge, AdminAnalytics, FlaggedSubmission, ChallengeSchedule } from '../../types';
import { Language } from '../../i18n';
import { Shield, Users, Video, AlertTriangle, Plus, CheckCircle2, XCircle, Trash2, Ban, Bell, MessageSquare, MessageCircle, Star, Clock, Calendar } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface AdminDashboardProps {
  lang: Language;
  currentUser?: import('../../types').User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, currentUser }) => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [flaggedSubs, setFlaggedSubs] = useState<FlaggedSubmission[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Challenge Form Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [instruction, setInstruction] = useState('');
  const [example, setExample] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Schedule state
  const [schedule, setSchedule] = useState<ChallengeSchedule | null>(null);
  const [nextChallengeTime, setNextChallengeTime] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editInterval, setEditInterval] = useState(24);
  const [editNextTime, setEditNextTime] = useState('');

  // Scheduled challenge toggle
  const [useScheduledTime, setUseScheduledTime] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    const [analyticsRes, challengesRes, modRes, notifRes, scheduleRes] = await Promise.all([
      apiRequest<AdminAnalytics>('/admin/dashboard'),
      apiRequest<{ challenges: Challenge[] }>('/challenges'),
      apiRequest<{ flaggedSubmissions: FlaggedSubmission[] }>('/admin/moderation'),
      apiRequest<{ notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }> }>('/admin/notifications'),
      apiRequest<{ schedule: ChallengeSchedule; nextChallengeTime: string }>('/admin/schedule')
    ]);
    setLoading(false);

    if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    if (challengesRes.success && challengesRes.data?.challenges) setChallenges(challengesRes.data.challenges);
    if (modRes.success && modRes.data?.flaggedSubmissions) setFlaggedSubs(modRes.data.flaggedSubmissions);
    if (notifRes.success && notifRes.data?.notifications) setNotifications(notifRes.data.notifications);
    if (scheduleRes.success && scheduleRes.data) {
      setSchedule(scheduleRes.data.schedule);
      setNextChallengeTime(scheduleRes.data.nextChallengeTime);
    }
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

    const body: Record<string, any> = {
      title,
      description: desc,
      instruction,
      example,
      startTime,
      endTime,
      status: 'ACTIVE'
    };

    // If scheduled time is set, use it
    if (useScheduledTime && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      body.startTime = scheduledDate.toISOString();
      body.endTime = new Date(scheduledDate.getTime() + 24 * 3600 * 1000).toISOString();
      body.scheduledFor = scheduledDate.toISOString();
    }

    const res = await apiRequest('/challenges', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (res.success) {
      telegram.haptic('success');
      setShowCreateModal(false);
      setTitle('');
      setDesc('');
      setInstruction('');
      setExample('');
      setUseScheduledTime(false);
      setScheduledFor('');
      fetchAdminData();
    } else {
      setErrorMsg(res.error?.message || 'Challenge yaratishda xatolik.');
    }
  };

  const handleSaveSchedule = async () => {
    telegram.haptic('click');
    const body: Record<string, any> = {};
    if (editInterval) body.intervalHours = editInterval;
    if (editNextTime) body.nextChallengeTime = new Date(editNextTime).toISOString();

    const res = await apiRequest('/admin/schedule', {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (res.success) {
      telegram.haptic('success');
      setShowScheduleModal(false);
      fetchAdminData();
    } else {
      setErrorMsg(res.error?.message || 'Jadvalni saqlashda xatolik.');
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

  // Format next challenge time for display
  const formatNextTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
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

      {/* Super Admin Status Banner */}
      {currentUser?.role === 'SUPER_ADMIN' ? (
        <div className="bg-[#000000] border-4 border-[#00FF00] p-4 shadow-[6px_6px_0px_#00FF00] text-[#00FF00] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider">
              <Star className="w-5 h-5 text-[#00FF00] fill-[#00FF00]" />
              <span>⭐ SUPER ADMIN PANEL — BARCHA VAKOLATLAR FAOL</span>
            </div>
            <span className="text-[10px] bg-[#00FF00] text-[#000000] px-2 py-0.5 font-black uppercase border border-[#FFFFFF]">
              VIP ACCESS
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[#FFFFFF]/90 leading-tight">
            Siz Super Admin huquqiga egasiz. Barcha foydalanuvchilarning videolarini hamda kommentariyalarini o‘chirish, kelib tushgan shikoyat (report)larni boshqarish va foydalanuvchilarni bloklash vakolatingiz mavjud.
          </p>
        </div>
      ) : (
        <div className="bg-[#000000] border-4 border-[#00FF00] p-3 shadow-[6px_6px_0px_#00FF00] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-black uppercase text-[#00FF00]">
            <Star className="w-4 h-4 text-[#00FF00]" />
            <span>Super Admin huquqini olish</span>
          </div>
          <button
            onClick={async () => {
              telegram.haptic('click');
              const res = await apiRequest('/admin/make-super-admin', { method: 'POST' });
              if (res.success) {
                telegram.haptic('success');
                alert('Endi siz Super Admin ekansiz! Sahifani yangilang.');
                window.location.reload();
              } else {
                alert(res.error?.message || 'Xatolik yuz berdi.');
              }
            }}
            className="px-3 py-1.5 bg-[#00FF00] text-[#000000] border-2 border-[#FFFFFF] text-[10px] font-black uppercase hover:bg-[#FFFFFF] transition-colors shadow-[2px_2px_0px_#FFFFFF]"
          >
            Super Admin bo‘lish
          </button>
        </div>
      )}

      {/* Challenge Schedule Section (Super Admin only) */}
      {currentUser?.role === 'SUPER_ADMIN' && (
        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
          <h3 className="font-black text-xs uppercase text-[#000000] flex items-center space-x-1.5 border-b-2 border-[#000000] pb-2">
            <Calendar className="w-4 h-4 text-[#000000]" />
            <span>Challenge Jadvali</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F0F0F0] border-2 border-[#000000] p-3 space-y-1">
              <div className="text-[10px] font-black uppercase text-[#000000]">Interval</div>
              <div className="text-lg font-black text-[#000000]">
                {schedule ? `Har ${schedule.intervalHours} soat` : '—'}
              </div>
            </div>
            <div className="bg-[#F0F0F0] border-2 border-[#000000] p-3 space-y-1">
              <div className="text-[10px] font-black uppercase text-[#000000]">Keyingi Challenge</div>
              <div className="text-xs font-black text-[#000000] leading-tight">
                {nextChallengeTime ? formatNextTime(nextChallengeTime) : '—'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              telegram.haptic('click');
              if (schedule) {
                setEditInterval(schedule.intervalHours);
              }
              setEditNextTime('');
              setShowScheduleModal(true);
            }}
            className="w-full py-2.5 bg-[#000000] text-[#00FF00] hover:bg-[#00FF00] hover:text-[#000000] border-2 border-[#000000] text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_#000000]"
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Jadvalni Sozlash
          </button>
        </div>
      )}

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
                  ch.status === 'ACTIVE' ? 'bg-[#00FF00] text-[#000000] border-[#000000]' :
                  ch.status === 'SCHEDULED' ? 'bg-[#FFCC00] text-[#000000] border-[#000000]' :
                  'bg-[#FFFFFF] text-[#000000] border-[#000000]'
                }`}>
                  {ch.status === 'SCHEDULED' ? 'REJALASHTIRILGAN' : ch.status}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#000000]">{ch.description}</p>
              {ch.status === 'SCHEDULED' && (
                <p className="text-[10px] font-bold text-[#FF4D00]">
                  Boshlanishi: {formatNextTime(ch.startTime)}
                </p>
              )}
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
            {flaggedSubs.map(sub => {
              const reportReasonsList = sub.reports?.map(r => ({
                label: r.reason === 'OFFENSIVE_CONTENT' ? 'Haqoratli kontent' :
                       r.reason === 'INAPPROPRIATE_CONTENT' ? 'Nomaqbul kontent' :
                       r.reason === 'DANGEROUS_ACTION' ? 'Xavfli harakat' :
                       r.reason === 'SPAM_OR_AD' ? 'Spam yoki reklama' :
                       r.reason === 'PRIVACY_VIOLATION' ? 'Maxfiylik buzilishi' : 'Boshqa',
                reporter: r.reporter?.firstName || 'Foydalanuvchi',
                details: r.details
              })) || [];

              return (
              <div key={sub.id} className="bg-[#F0F0F0] border-2 border-[#000000] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black uppercase text-[#000000]">{sub.userName || 'Foydalanuvchi'}</span>
                  <span className="text-[#FF4D00] font-black">{sub.reportCount} ta report</span>
                </div>

                {/* Report Reasons */}
                {reportReasonsList.length > 0 && (
                  <div className="space-y-1">
                    {reportReasonsList.map((r, i) => (
                      <div key={i} className="bg-[#FFFFFF] border border-[#000000] p-1.5 text-[10px] font-semibold">
                        <span className="font-black uppercase text-[#FF4D00]">#{i + 1}:</span>{' '}
                        <span>{r.label}</span>
                        {r.details && <span className="text-[#000000]/70"> — {r.details}</span>}
                        <span className="text-[#000000]/50"> ({r.reporter} xabar qilgan)</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleModerationAction(sub.id, 'APPROVE')}
                    className="py-2 px-2 bg-[#00FF00] text-[#000000] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000] hover:bg-[#FFFFFF] transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tasdiqlash</span>
                  </button>

                  <button
                    onClick={() => handleModerationAction(sub.id, 'WARN_USER', 'Iltimos, qoidalarga rioya qiling. Keyingi safar ogohlantirishsiz o‘chiriladi.')}
                    className="py-2 px-2 bg-[#FFCC00] text-[#000000] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000] hover:bg-[#FFFFFF] transition-colors"
                    title="Foydalanuvchini ogohlantirish"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Ogohlantirish</span>
                  </button>

                  <button
                    onClick={() => handleModerationAction(sub.id, 'REMOVE')}
                    className="py-2 px-2 bg-[#FF4D00] text-[#FFFFFF] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000] hover:bg-[#000000] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>O‘chirish</span>
                  </button>

                  <button
                    onClick={() => handleModerationAction(sub.id, 'BLOCK_USER')}
                    className="py-2 px-2 bg-[#000000] text-[#FFFFFF] border-2 border-[#000000] text-[11px] font-black uppercase flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000000] hover:bg-[#FF4D00] transition-colors"
                    title="Foydalanuvchini bloklash"
                  >
                    <Ban className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Bloklash</span>
                  </button>
                </div>
              </div>
            )})}
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

      {/* Schedule Settings Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 max-w-sm w-full space-y-3 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-black text-base uppercase text-[#000000] border-b-4 border-[#000000] pb-2">Challenge Jadvalini Sozlash</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#000000] font-black uppercase">Interval (soat):</label>
                <select
                  value={editInterval}
                  onChange={e => setEditInterval(Number(e.target.value))}
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                >
                  <option value={6}>Har 6 soat</option>
                  <option value={12}>Har 12 soat</option>
                  <option value={24}>Har 24 soat (kunlik)</option>
                  <option value={48}>Har 48 soat (2 kun)</option>
                  <option value={72}>Har 72 soat (3 kun)</option>
                </select>
              </div>

              <div>
                <label className="text-[#000000] font-black uppercase">Keyingi Challenge vaqti (Toshkent):</label>
                <input
                  type="datetime-local"
                  value={editNextTime}
                  onChange={e => setEditNextTime(e.target.value)}
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
                <p className="text-[9px] text-[#000000]/60 mt-1">Agar belgilamasangiz, joriy jadval saqlanadi.</p>
              </div>
            </div>

            {errorMsg && <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center">{errorMsg}</p>}

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000]">
                Bekor qilish
              </button>
              <button onClick={handleSaveSchedule} className="flex-1 py-3 border-2 border-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black uppercase text-[#000000] transition-colors">
                Saqlash
              </button>
            </div>
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

              {/* Scheduled time toggle (Super Admin only) */}
              {currentUser?.role === 'SUPER_ADMIN' && (
                <div className="bg-[#000000] border-2 border-[#00FF00] p-3 space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useScheduledTime}
                      onChange={e => setUseScheduledTime(e.target.checked)}
                      className="w-4 h-4 accent-[#00FF00]"
                    />
                    <span className="text-[#00FF00] font-black uppercase text-[10px]">Rejalashtirilgan vaqtda chiqarish</span>
                  </label>

                  {useScheduledTime && (
                    <div>
                      <label className="text-[#00FF00] font-black uppercase text-[10px]">Qachon chiqsin? (Toshkent vaqti):</label>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={e => setScheduledFor(e.target.value)}
                        className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {errorMsg && <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center">{errorMsg}</p>}

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000]">
                Bekor qilish
              </button>
              <button onClick={handleCreateChallenge} className="flex-1 py-3 border-2 border-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black uppercase text-[#000000] transition-colors">
                {useScheduledTime ? 'Rejalashtirish' : 'Chiqarish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
