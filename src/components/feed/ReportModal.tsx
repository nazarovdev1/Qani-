import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { telegram } from '../../lib/telegram';

interface ReportModalProps {
  submissionId: string;
  onClose: () => void;
}

const reportReasons = [
  { id: 'OFFENSIVE_CONTENT', label: 'Haqoratli kontent' },
  { id: 'INAPPROPRIATE_CONTENT', label: 'Nomaqbul kontent' },
  { id: 'DANGEROUS_ACTION', label: 'Xavfli harakat' },
  { id: 'SPAM_OR_AD', label: 'Spam yoki reklama' },
  { id: 'PRIVACY_VIOLATION', label: 'Boshqa shaxsning maxfiyligi buzilgan' },
  { id: 'OTHER', label: 'Boshqa sabab' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ submissionId, onClose }) => {
  const [selectedReason, setSelectedReason] = useState<string>('OFFENSIVE_CONTENT');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    telegram.haptic('click');

    const res = await apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({
        submissionId,
        reason: selectedReason,
        details: details || undefined
      })
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      telegram.haptic('success');
      setTimeout(() => onClose(), 1500);
    } else {
      setErrorMsg(res.error?.message || 'Xabar yuborishda xatolik.');
      telegram.haptic('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-6 max-w-sm w-full shadow-[8px_8px_0px_#000000] text-[#000000] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-[#000000] pb-3 bg-[#FF4D00] -mx-6 -mt-6 p-4 text-[#FFFFFF]">
          <div className="flex items-center space-x-2 font-black text-sm uppercase tracking-wider">
            <Flag className="w-5 h-5" />
            <span>Videoni Xabar Qilish</span>
          </div>
          <button onClick={onClose} className="text-[#FFFFFF] hover:text-[#000000] font-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-[#00FF00] bg-[#000000] p-1 border-2 border-[#000000] mx-auto" />
            <h3 className="font-black text-base uppercase">Xabaringiz qabul qilindi</h3>
            <p className="text-xs font-semibold text-[#000000]">Moderatorlarimiz qisqa vaqt ichida ko‘rib chiqishadi.</p>
          </div>
        ) : (
          <>
            {/* Reason Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-black uppercase text-[#000000]">Sababni tanlang:</label>
              <div className="space-y-2">
                {reportReasons.map(r => (
                  <label
                    key={r.id}
                    onClick={() => setSelectedReason(r.id)}
                    className={`flex items-center space-x-3 p-3 border-2 border-[#000000] text-xs font-bold cursor-pointer transition-all ${
                      selectedReason === r.id
                        ? 'bg-[#00FF00] text-[#000000] shadow-[2px_2px_0px_#000000]'
                        : 'bg-[#F0F0F0] text-[#000000] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="accent-[#000000]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Details */}
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-[#000000]">Qo‘shimcha izoh (ixtiyoriy):</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Batafsil ma'lumot..."
                className="w-full bg-[#FFFFFF] border-2 border-[#000000] p-2.5 text-xs font-bold text-[#000000] placeholder-zinc-500 focus:outline-none focus:bg-[#00FF00]/20 h-16 resize-none shadow-[2px_2px_0px_#000000]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-[#FFFFFF] bg-[#FF4D00] p-2 border-2 border-[#000000] text-center shadow-[2px_2px_0px_#000000]">
                {errorMsg}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-[#000000] bg-[#F0F0F0] text-[#000000] font-black text-xs uppercase hover:bg-[#FFFFFF] shadow-[2px_2px_0px_#000000]"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 border-2 border-[#000000] bg-[#FF4D00] text-[#FFFFFF] font-black text-xs uppercase hover:bg-[#000000] hover:text-[#FF4D00] shadow-[2px_2px_0px_#000000] transition-colors"
              >
                {loading ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
