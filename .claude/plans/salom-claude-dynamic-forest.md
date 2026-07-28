# Reja: Yangi challenge yaratilganda userlarga xabar berish

## Kontekst

QANI? loyihasida admin yangi challenge (topshiriq) yaratganda, foydalanuvchilarga xabar borishi kerak. Hozirda:
- **In-app notification** tizimi mavjud (`Notification` modeli, `createNotification` metodi), faqat report va moderation uchun ishlatiladi
- **Telegram bot** orqali xabar yuborish mavjud (`sendChallengeNotification`), faqat SCHEDULED challenge avtomatik ACTIVE bo'lganda ishlaydi
- **Yangi challenge yaratilganda** (POST /challenges) **hech qanday xabar ketmaydi**

## Talab

- Admin yangi `ACTIVE` challenge yaratganda (POST /challenges):
  - Barcha bloklanmagan userlarga **in-app notification** + **Telegram xabar** yuborilsin
  - DRAFT yoki SCHEDULED challenge uchun xabar ketmasin
  - Challenge tahrirlanganda (PUT) xabar ketmasin (faqat yangi yaratilganda)

## O'zgartiriladigan fayllar

### 1. `server/api/router.ts`

`POST /challenges` endpointiga (171-193-qatorlar) notification logic qo'shish:

```typescript
// Challenge yaratilgandan keyin, agar ACTIVE bo'lsa xabar yuborish
if (newChallenge.status === 'ACTIVE') {
  try {
    const allUsers = await db.getAllUsers();
    const activeUsers = allUsers.filter((u: any) => !u.isBlocked);
    
    for (const user of activeUsers) {
      // In-app notification
      await db.createNotification(
        user.id,
        '🎯 Yangi Challenge!',
        `${newChallenge.title}\n${newChallenge.description}`,
        'NEW_CHALLENGE'
      );
      
      // Telegram xabar (fire-and-forget) - mavjud sendChallengeNotification orqali
      sendChallengeNotification(user.telegramId, newChallenge.title, newChallenge.description)
        .catch(err => console.error('Telegram notification failed for', user.telegramId, err));
    }
    console.log(`[Notifications] Sent to ${activeUsers.length} users for challenge "${newChallenge.title}"`);
  } catch (notifyErr) {
    console.error('Error sending challenge notifications:', notifyErr);
    // Response ni bloklamaslik uchun error'ni log qilamiz xolos
  }
}
```

**Mavjud pattern**: Report handlerda (392-405-qatorlar) xuddi shunday pattern ishlatilgan — `db.getAdminUsers()` → loop → `db.createNotification()`.

### 2. `server/db/types.ts` (agar kerak bo'lsa)

`NEW_CHALLENGE` notification type'ini qo'shish. `Notification` type'idagi `type` field hozirda `string` — yangi type qo'shish shart emas, faqat ishlatamiz.

### 3. `src/types/index.ts` (frontend — ixtiyoriy)

Agar frontendda `NEW_CHALLENGE` type'ini ko'rsatmoqchi bo'lsak, type'lar ro'yxatiga qo'shish mumkin. Hozircha `AdminDashboard` faqat adminlarga notification ko'rsatadi — bu alohida task.

## Ishlash prinsipi

1. Admin `POST /challenges` orqali yangi challenge yaratadi
2. Agar `status: 'ACTIVE'` bo'lsa:
   - `db.getAllUsers()` orqali barcha userlarni oladi
   - Bloklanmaganlarini filter qiladi
   - Har bir user uchun:
     - **In-app**: `db.createNotification()` — user profilida ko'rinadi
     - **Telegram**: `sendChallengeNotification()` — Telegram'ga push xabar
3. Response tez qaytadi — notification'lar fire-and-forget pattern'da ishlaydi

## Test qilish

1. Serverni ishga tushirish: `npm run dev`
2. Admin sifatida login qilish (mock auth yoki Telegram orqali)
3. `POST /api/challenges` ga yangi challenge yuborish:
   ```json
   {
     "title": "Test Challenge",
     "description": "Bu test uchun challenge",
     "instruction": "Video yozing",
     "startTime": "2026-07-28T00:00:00Z",
     "endTime": "2026-07-29T00:00:00Z",
     "status": "ACTIVE"
   }
   ```
4. Konsolda `[Notifications] Sent to N users...` log'ini tekshirish
5. `.qani_data.json` da `notifications` array'ida yangi entry'lar borligini tekshirish
6. `GET /admin/notifications` orqali admin panelida ko'rinishini tekshirish
