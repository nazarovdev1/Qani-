import React, { useState, useEffect } from 'react';
import { Group, User } from '../../types';
import { Language, translations } from '../../i18n';
import { Plus, Key, Users, CheckCircle, Copy, Check } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface GroupManagerProps {
  user: User;
  lang: Language;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ user, lang }) => {
  const t = translations[lang];
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    const res = await apiRequest<{ groups: Group[] }>('/groups/my');
    setLoading(false);
    if (res.success && res.data?.groups) {
      setGroups(res.data.groups);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user.id]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorMsg('Guruh nomini kiriting.');
      return;
    }

    setErrorMsg(null);
    telegram.haptic('click');

    const res = await apiRequest<{ group: Group }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name: groupName, description: groupDesc })
    });

    if (res.success) {
      telegram.haptic('success');
      setShowCreateModal(false);
      setGroupName('');
      setGroupDesc('');
      fetchGroups();
    } else {
      setErrorMsg(res.error?.message || 'Guruh yaratishda xatolik.');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      setErrorMsg('Taklif kodini kiriting.');
      return;
    }

    setErrorMsg(null);
    telegram.haptic('click');

    const res = await apiRequest<{ group: Group; message?: string }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: inviteCode.trim() })
    });

    if (res.success) {
      telegram.haptic('success');
      setShowJoinModal(false);
      setInviteCode('');
      fetchGroups();
    } else {
      setErrorMsg(res.error?.message || 'Guruhga qo‘shilishda xatolik.');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    telegram.haptic('click');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-5 pb-20 max-w-lg mx-auto text-[#000000]">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between bg-[#00FF00] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#000000]">
          <Users className="w-5 h-5" />
          <span>Challenge Guruhlari</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              telegram.haptic('click');
              setShowJoinModal(true);
            }}
            className="py-1.5 px-3 bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] text-xs font-black uppercase text-[#000000] border-2 border-[#000000] shadow-[2px_2px_0px_#000000] flex items-center space-x-1 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </button>

          <button
            onClick={() => {
              telegram.haptic('click');
              setShowCreateModal(true);
            }}
            className="py-1.5 px-3 bg-[#000000] text-[#00FF00] hover:bg-[#FFFFFF] hover:text-[#000000] font-black text-xs uppercase border-2 border-[#000000] shadow-[2px_2px_0px_#000000] flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yaratish</span>
          </button>
        </div>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="h-32 bg-[#F0F0F0] border-4 border-[#000000] shadow-[6px_6px_0px_#000000] animate-pulse" />
      ) : groups.length === 0 ? (
        <div className="bg-[#FFFFFF] border-4 border-[#000000] p-8 text-center text-[#000000] space-y-3 shadow-[6px_6px_0px_#000000]">
          <Users className="w-12 h-12 text-[#000000] mx-auto" />
          <h3 className="font-black text-base uppercase">Guruhlarga qo‘shilmagansiz</h3>
          <p className="text-xs font-semibold">
            Yangi shaxsiy guruh yarating yoki do‘stlaringiz bergan taklif kodi orqali guruhga kiring!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.id} className="bg-[#FFFFFF] border-4 border-[#000000] p-4 shadow-[6px_6px_0px_#000000] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-base uppercase text-[#000000]">{group.name}</h3>
                  {group.description && <p className="text-xs font-semibold text-[#000000] mt-0.5">{group.description}</p>}
                </div>

                <button
                  onClick={() => copyCode(group.inviteCode)}
                  className="p-2 bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black text-[#000000] flex items-center space-x-1 border-2 border-[#000000] shadow-[2px_2px_0px_#000000] transition-colors"
                  title="Taklif kodini nusxalash"
                >
                  {copiedCode === group.inviteCode ? <Check className="w-3.5 h-3.5 text-[#000000]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-mono tracking-wider">{group.inviteCode}</span>
                </button>
              </div>

              {/* Progress bar of completed members */}
              <div className="bg-[#F0F0F0] p-3 border-2 border-[#000000] space-y-2 shadow-[2px_2px_0px_#000000]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#000000] font-black uppercase flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Bugun bajarganlar:</span>
                  </span>
                  <span className="font-black text-[#000000] bg-[#00FF00] px-2 py-0.5 border border-[#000000]">
                    {group.todayCompletedCount} / {group.memberCount} A‘ZO
                  </span>
                </div>

                <div className="w-full bg-[#FFFFFF] border-2 border-[#000000] h-3 overflow-hidden">
                  <div
                    className="bg-[#000000] h-full transition-all"
                    style={{ width: `${Math.round((group.todayCompletedCount / (group.memberCount || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 max-w-sm w-full space-y-4 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-black text-base uppercase text-[#000000] border-b-4 border-[#000000] pb-2">Yangi Guruh Yaratish</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#000000] font-black uppercase">Guruh Nomi:</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Masalan: Sinfdoshlar 2024"
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2.5 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div>
                <label className="text-[#000000] font-black uppercase">Tavsifi (ixtiyoriy):</label>
                <input
                  type="text"
                  value={groupDesc}
                  onChange={e => setGroupDesc(e.target.value)}
                  placeholder="Har kuni video topshiriq topshiramiz"
                  className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2.5 text-[#000000] font-bold mt-1 focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>

            {errorMsg && <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center">{errorMsg}</p>}

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000] shadow-[2px_2px_0px_#000000]">
                Bekor qilish
              </button>
              <button onClick={handleCreateGroup} className="flex-1 py-3 border-2 border-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black uppercase text-[#000000] shadow-[2px_2px_0px_#000000] transition-colors">
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Join Group */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 max-w-sm w-full space-y-4 shadow-[8px_8px_0px_#000000]">
            <h3 className="font-black text-base uppercase text-[#000000] border-b-4 border-[#000000] pb-2">Guruhga Kirish</h3>

            <div className="space-y-2 text-xs">
              <label className="text-[#000000] font-black uppercase">Taklif Kodini Kiriting:</label>
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Masalan: toshkent-creatives"
                className="w-full bg-[#F0F0F0] border-2 border-[#000000] p-2.5 text-[#000000] font-mono font-bold focus:bg-[#00FF00]/20 focus:outline-none shadow-[2px_2px_0px_#000000]"
              />
            </div>

            {errorMsg && <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center">{errorMsg}</p>}

            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => setShowJoinModal(false)} className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-xs font-black uppercase text-[#000000] shadow-[2px_2px_0px_#000000]">
                Bekor qilish
              </button>
              <button onClick={handleJoinGroup} className="flex-1 py-3 border-2 border-[#000000] bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] text-xs font-black uppercase text-[#000000] shadow-[2px_2px_0px_#000000] transition-colors">
                Kirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
