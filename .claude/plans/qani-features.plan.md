# QANI? Mini App — Yangi Funcksiyalar Rejasi

## Foydalanuvchi So'rovlari (7 ta)
1. **"Aktiv Foydalanuvchilar" matni chiqib ketgan** — statistik kartochkalar
2. **Ulashish bo'limida bot linki** — `@qaniisbotlabot`
3. **Super admin roli** — o'z akkauntiga SUPER_ADMIN
4. **Video report → admin xabar** — report qilinganda adminga notification
5. **Admin videoni o'chirish/ogohlantirish** — WARN_USER action
6. **Faol userlar sonini simulyatsiya** — 100+ suniy foydalanuvchi ko'rinishi
7. **Videoga kommentariya** — comment tizimi

---

## 1. Statistik Kartochkalar CSS Tuzatish (Tez, 1 fayl)
**Fayl:** `src/components/referral/ReferralCard.tsx:90-108`
**Muammo:** `grid-cols-3 gap-3` juda kichik, `text-[10px]` uzilib qolgan
**Yechim:**
- `grid-cols-3 gap-2` → `gap-2`
- Har bir kartochkaga `min-h-[100px]` qo'shish
- Matn: `text-[10px]` → `text-[9px] leading-tight` va `break-words`
- Kichik ekranlarda (`sm:`) moslashuvchan grid

---

## 2. Ulashish Bo'limida Bot Linki (Tez, 1 fayl)
**Fayl:** `src/components/referral/ReferralCard.tsx:65-86`
**Yechim:**
- Share tugmasi ostiga yangi qator: `@qaniisbotlabot` linki
- `https://t.me/qaniisbotlabot` → Telegram WebApp orqali ochiladi
- Stil: kichik, yashil fon, monospace shrift

---

## 3. Faol Userlar Sonini Simulyatsiya (Tez, 3 fayl)
**Fayllar:**
- `server/db/store.ts:588` — `getReferralStats` (JSON store)
- `server/db/prismaStore.ts:464` — `getReferralStats` (Prisma)
- `src/components/referral/ReferralCard.tsx:105` — UI

**Yechim:**
- `activated` qiymatiga `+127` qo'shish (konstanta `SIMULATED_BASE = 127`)
- Bu faqat UI/statistikada ko'rinadi, real DB o'zgarmaydi
- `linkOpens` ham `* 3 + 42` katta raqam qilish
- Sabab: "Odamlar o'ylashi 100 dan oshib suniy odam bo'ladi"

---

## 4. Super Admin Roli (O'rtacha, 2 fayl)
**Fayllar:**
- `server/db/store.ts:54-72` — `adminUser` allaqachon `SUPER_ADMIN`
- `server/middleware/telegramAuth.ts:58-91` — Dev mock auth
- `src/components/layout/Header.tsx:60-128` — Dev menyu

**Yechim:**
- Dev menuda "Make Me Super Admin" tugmasi qo'shish
- `db.updateUser(user.id, { role: 'SUPER_ADMIN' })` chaqirish
- Yoki telegram auth'da agar `tgUser.id === 'YOUR_ID'` bo'lsa auto SUPER_ADMIN
- Eng oson: Dev menuda tugma

---

## 5. Report → Admin Notification (O'rtacha, 6 fayl)
**Fayllar:**
- `prisma/schema.prisma:259-268` — `Notification` model allaqachon bor
- `server/api/router.ts:371-396` — POST `/api/reports`
- `server/db/prismaStore.ts:399-439` — `createReport`
- `server/db/store.ts:531-559` — `createReport`
- `server/db/index.ts:156-161` — unified interface
- `src/components/admin/AdminDashboard.tsx` — admin UI

**Yechim:**
- `createReport` ichida adminlarga notification yaratish
- `db.getAdminUsers()` yordamchi method (yangi)
- Har bir report uchun `Notification` yozuvi yaratish
- Admin dashboard'da "Notifications" bo'limi qo'shish
- API: `GET /api/admin/notifications`
- API: `POST /api/admin/notifications/:id/read`

**Prisma:**
```prisma
// Notification model allaqachon bor, ishlatish kerak
// Yangi type: 'REPORT' qo'shish
```

---

## 6. Admin Videoni O'chirish/Ogohlantirish (O'rtacha, 2 fayl)
**Fayllar:**
- `server/api/router.ts:575-608` — POST `/admin/moderation/action`
- `src/components/admin/AdminDashboard.tsx:82-93` — `handleModerationAction`

**Yechim:**
- `action` enum'ga `WARN_USER` qo'shish
- Ogohlantirishda `reason` maydoni bilan xabar yuborish
- Admin panel'da "Ogohlantirish" tugmasi (sariq rang)
- Foydalanuvchiga notification yuborish: "Videongiz ogohlantirish oldi"

---

## 7. Comment Tizimi (Katta, 10+ fayl)
**Database:**
- `prisma/schema.prisma` — `Comment` model qo'shish (User, Submission bilan relation)

**Backend:**
- `server/db/types.ts` — `Comment` interface
- `server/db/store.ts` — JSON implementation (comments array)
- `server/db/prismaStore.ts` — Prisma implementation
- `server/db/index.ts` — unified interface methods
- `server/api/router.ts` — API endpoints:
  - `GET /api/submissions/:id/comments`
  - `POST /api/submissions/:id/comments`
  - `DELETE /api/comments/:id`

**Frontend:**
- `src/types/index.ts` — `Comment`, `CommentWithUser` types
- `src/components/feed/VideoCard.tsx` — comment bo'limi qo'shish
- **Yangi:** `src/components/feed/CommentSection.tsx` — alohida komponent

**UI Dizayni:**
- VideoCard ostida "Comments (3)" accordion
- Kichik input + yuborish tugmasi
- Kommentlar ro'yxati: avatar, ism, vaqt, matn
- O'z kommentini o'chirish (❌)

---

## Implementatsiya Tartibi (Prioritet)

| # | Vazifa | Fayllar | Vaqt |
|---|---|---|---|
| 1 | CSS kartochkalar tuzatish | `ReferralCard.tsx` | 15 min |
| 2 | Bot linki qo'shish | `ReferralCard.tsx` | 10 min |
| 3 | User simulyatsiya | `store.ts`, `prismaStore.ts`, `ReferralCard.tsx` | 20 min |
| 4 | Super admin tugmasi | `Header.tsx`, `telegramAuth.ts` | 15 min |
| 5 | Admin notification | `schema.prisma`, `router.ts`, `prismaStore.ts`, `AdminDashboard.tsx` | 45 min |
| 6 | Warn user action | `router.ts`, `AdminDashboard.tsx` | 20 min |
| 7 | Comment tizimi | 10+ fayl | 90 min |

**Jami:** ~4 soat, 15+ fayl

---

## Texnik Eslatmalar

- **Dual DB:** Har bir yangi method JSON store (`store.ts`) va Prisma store (`prismaStore.ts`)'da implement qilinishi kerak
- **DB unified interface:** `server/db/index.ts` orqali chaqiriladi
- **Types:** Backend `server/db/types.ts`, Frontend `src/types/index.ts`
- **Migration:** Prisma schema o'zgarsa, `npx prisma migrate dev` kerak
- **No breaking changes:** Mavjud API endpointlar va UI o'zgarmaydi
