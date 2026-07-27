import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
          <Shield className="w-5 h-5 text-[#000000]" />
          <span>Maxfiylik Siyosati (Privacy Policy)</span>
        </div>

        <p className="text-[11px] font-bold text-[#000000] italic bg-[#F0F0F0] p-2 border border-[#000000]">
          So‘nggi yangilanish: 2026-yil 26-iyul. Ushbu matn professional yuridik maslahat hisoblanmaydi, platforma va foydalanuvchilar o‘rtasidagi axborot munosabatlarini tartibga soladi.
        </p>

        <section className="space-y-1.5">
          <h3 className="font-black text-[#000000] text-sm uppercase">1. Qanday ma'lumotlar saqlanadi?</h3>
          <p className="font-semibold text-[#000000]">
            “QANI?” Telegram Mini App foydalanuvchining Telegram ID, ism-sharifi, profil rasmi va foydalanuvchi tomonidan tanlangan viloyat ma'lumotlarini saqlaydi.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-[#000000] text-sm uppercase">2. Videolar va Media Fayllar</h3>
          <p className="font-semibold text-[#000000]">
            Foydalanuvchining kamera orqali yozib yuborgan 3–15 soniyali videolardan faqat kunlik challenge doirasida foydalaniladi. Aniq GPS va geolokatsiya ma'lumotlari so‘ralmaydi va saqlanmaydi.
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-[#000000] text-sm uppercase">3. Ma'lumotlarni o‘chirish</h3>
          <p className="font-semibold text-[#000000]">
            Foydalanuvchi xohlagan vaqtda profil sozlamalari bo‘limida hisobini o‘chirish so‘rovini berishi mumkin. Hisob o‘chirilgach, shaxsiy ma'lumotlar va videolar platformadan xavfsiz tarzda anonimlashtiriladi.
          </p>
        </section>
      </div>
    </div>
  );
};
