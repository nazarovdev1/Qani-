import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="space-y-4 pb-20 max-w-lg mx-auto text-[#000000]">
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#000000] bg-[#00FF00] border-2 border-[#000000] px-4 py-2 hover:bg-[#000000] hover:text-[#00FF00] shadow-[2px_2px_0px_#000000] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Orqaga</span>
      </button>

      <div className="bg-[#FFFFFF] border-4 border-[#000000] p-5 space-y-4 text-xs leading-relaxed shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center space-x-2 text-[#000000] font-black text-base uppercase border-b-4 border-[#000000] pb-3">
          <FileText className="w-5 h-5 text-[#000000]" />
          <span>Foydalanish Shartlari (Terms of Service)</span>
        </div>

        <p className="text-[11px] font-bold text-[#000000] italic bg-[#F0F0F0] p-2 border border-[#000000]">
          So‘nggi yangilanish: 2026-yil 26-iyul. Ushbu shartlar “QANI?” Mini App platformasidan foydalanish qoidalarini belgilaydi.
        </p>

        <section className="space-y-1.5">
          <h3 className="font-black text-[#000000] text-sm uppercase">1. Yosh chegarasi va Qoidalar</h3>
          <p className="font-semibold text-[#000000]">
            Platformadan faqat 18 yoshdan oshgan shaxslar foydalanishi mumkin. Har bir foydalanuvchi odob-ahloq va jamiyat qoidalariga rioya qilishi shart.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-[#000000] text-sm uppercase">2. Taqiqlangan Kontent</h3>
          <p className="font-semibold text-[#000000]">
            Haqoratli, nomaqbul, spamerlik, reklama va boshqalarning huquqlarini buzuvchi videolarni yuborish qat'iyan man etiladi. Moderatsiya va avtomatlashtirilgan filtr tizimi qoidalarni buzgan foydalanuvchilarni bloklash huquqiga ega.
          </p>
        </section>
      </div>
    </div>
  );
};
