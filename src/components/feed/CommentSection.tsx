import React, { useState, useEffect, useCallback } from 'react';
import { CommentWithUser, User } from '../../types';
import { Language } from '../../i18n';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';

interface CommentSectionProps {
  submissionId: string;
  currentUser: User | null;
  isLocked: boolean;
  lang: Language;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  submissionId,
  currentUser,
  isLocked,
  lang
}) => {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest<{ comments: CommentWithUser[] }>(`/submissions/${submissionId}/comments`);
    setLoading(false);
    if (res.success && res.data?.comments) {
      setComments(res.data.comments);
    }
  }, [submissionId]);

  useEffect(() => {
    if (expanded) {
      fetchComments();
    }
  }, [expanded, fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim() || !currentUser) return;
    setErrorMsg(null);
    telegram.haptic('click');
    setSubmitting(true);

    const res = await apiRequest<{ comment: CommentWithUser }>(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text: text.trim() })
    });

    setSubmitting(false);
    if (res.success && res.data?.comment) {
      telegram.haptic('success');
      setText('');
      setErrorMsg(null);
      setComments(prev => [res.data!.comment, ...prev]);
    } else {
      setErrorMsg(res.error?.message || 'Komment yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.');
      telegram.haptic('error');
    }
  };

  const handleDelete = async (commentId: string) => {
    telegram.haptic('click');
    const res = await apiRequest(`/comments/${commentId}`, { method: 'DELETE' });
    if (res.success) {
      telegram.haptic('success');
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  return (
    <div className="border-t-4 border-[#000000] bg-[#F0F0F0]">
      {/* Toggle Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#E0E0E0] transition-colors"
      >
        <div className="flex items-center space-x-2 text-xs font-black uppercase text-[#000000]">
          <MessageCircle className="w-4 h-4" />
          <span>Kommentariyalar ({comments.length})</span>
        </div>
        <span className="text-[10px] font-black text-[#000000]">
          {expanded ? 'Yopish' : 'Ochish'}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Comment Input */}
          {!isLocked && currentUser && (
            <div className="space-y-1.5">
              <div className="flex items-start space-x-2">
                <img
                  src={currentUser.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.firstName}
                  className="w-7 h-7 border-2 border-[#000000] object-cover flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Komment yozish..."
                    maxLength={500}
                    className="flex-1 bg-[#FFFFFF] border-2 border-[#000000] px-2 py-1.5 text-xs font-bold text-[#000000] placeholder-zinc-500 focus:outline-none focus:bg-[#00FF00]/20 shadow-[2px_2px_0px_#000000]"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || submitting}
                    className="p-1.5 bg-[#000000] text-[#00FF00] border-2 border-[#000000] shadow-[2px_2px_0px_#000000] hover:bg-[#00FF00] hover:text-[#000000] transition-colors disabled:opacity-40"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {errorMsg && (
                <p className="text-[10px] font-bold text-[#FFFFFF] bg-[#FF4D00] border-2 border-[#000000] px-2 py-1 shadow-[2px_2px_0px_#000000]">
                  {errorMsg}
                </p>
              )}
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="h-8 bg-[#FFFFFF] border-2 border-[#000000] animate-pulse" />
          ) : comments.length === 0 ? (
            <p className="text-[10px] font-bold text-[#000000]/60 text-center py-2">
              Hozircha kommentlar yo‘q. Birinchi bo‘lib yozing!
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map(comment => {
                const isMine = comment.userId === currentUser?.id;
                const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
                return (
                  <div key={comment.id} className="flex items-start space-x-2 bg-[#FFFFFF] border-2 border-[#000000] p-2 shadow-[2px_2px_0px_#000000]">
                    <img
                      src={comment.user?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={comment.user?.firstName || 'User'}
                      className="w-6 h-6 border border-[#000000] object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#000000]">
                          {comment.user?.firstName || 'Foydalanuvchi'}
                        </span>
                        <span className="text-[9px] text-[#000000]/50">
                          {new Date(comment.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-[#000000] mt-0.5 leading-snug break-words">
                        {comment.text}
                      </p>
                    </div>
                    {(isMine || isAdmin) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="shrink-0 p-0.5 text-[#000000]/40 hover:text-[#FF4D00] transition-colors"
                        title="O‘chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
