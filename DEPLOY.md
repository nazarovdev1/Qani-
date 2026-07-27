# 🚀 Vercelga Bepul Deploy Qilish

Bu loyiha $0 (nol dollar) bilan to‘liq ishlashi mumkin. Quyidagi bepul xizmatlar ishlatiladi:

| Xizmat | Nima uchun | Bepul limit |
|--------|-----------|-------------|
| **Vercel** | Frontend + API hosting | Hobby plan (bepul) |
| **Neon** | PostgreSQL ma'lumotlar bazasi | 500 MB, cheksiz |
| **Supabase Storage** | Video fayllar | 1 GB |
| **Upstash** | Redis (navbat, kesh) | 10K command/kun |

---

## 1. Neon PostgreSQL ochish

1. [neon.tech](https://neon.tech) ga kirish
2. GitHub bilan ro‘yxatdan o‘tish (bepul)
3. **New Project** → nomi: `qani-db`
4. **Connection String** ni nusxalash:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/qani_db?sslmode=require
   ```

---

## 2. Supabase ochish

1. [supabase.com](https://supabase.com) ga kirish
2. **New Project** → nomi: `qani-storage`
3. Kutish (1-2 daqiqa)
4. Chap menyu → **Storage** → **New bucket**:
   - Bucket name: `videos`
   - Public bucket: ✅ (yoqish)
5. **Settings** → **API** dan quyidagilarni nusxalash:
   - Project URL: `https://xxxx.supabase.co`
   - service_role secret: `eyJ...`

> ⚠️ **Project API anon key** emas, aynan **service_role key** kerak!

---

## 3. Upstash Redis ochish

1. [upstash.com](https://upstash.com) ga kirish
2. **Create Database** → Redis
3. **REDIS_URL** ni nusxalash (TLS/SSL):
   ```
   rediss://default:xxx@xxx.upstash.io:6379
   ```

---

## 4. Vercelga Deploy

### 4.1 GitHubga push qilish

```bash
git add .
git commit -m "Vercel deployment ready"
git push -u origin main --force
```

### 4.2 Vercelda project yaratish

1. [vercel.com](https://vercel.com) ga kirish
2. **Add New Project** → GitHub bilan ulanish
3. `Qani-` reponi tanlash
4. **Framework Preset**: `Other`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: `npm install`

### 4.3 Environment Variables qo‘shish

Project → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/qani_db?sslmode=require
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
JWT_SECRET=bu_yerga_32_talik_kuchli_kalit_yozing
TELEGRAM_BOT_TOKEN=777888999:AAFF...
NODE_ENV=production
APP_URL=https://qani-xxx.vercel.app
```

> `JWT_SECRET` — tasodifiy 32 ta belgidan iborat kuchli kalit.

### 4.4 Deploy

**Deploy** tugmasini bosish. 2-3 daqiqa ichida tayyor bo‘ladi.

---

## 5. Birinchi sozlash (ma'lumotlar bazasi)

Deploy dan keyin terminal ochish (Vercel dashboard → Project → **Deployments** → **...** → **Open Build Logs** yo‘q, buning o‘rniga):

### Localda seed qilish

```bash
# .env faylni to‘ldirish
DATABASE_URL=postgresql://... npx prisma migrate deploy
DATABASE_URL=postgresql://... npm run db:seed
```

Yoki **Neon Dashboard** → SQL Editor da qo‘lda test ma'lumotlar qo‘shish.

---

## 6. Tekshirish

Deploy URL ga kirish:

- `https://qani-xxx.vercel.app` — Frontend
- `https://qani-xxx.vercel.app/health` — Health check
- `https://qani-xxx.vercel.app/api/challenges` — API

---

## ❗ Muammolar

### Video upload ishlamayapti?
- Supabase `videos` bucket **public** ekanligini tekshiring
- `SUPABASE_SERVICE_KEY` noto‘g‘ri nusxalangan bo‘lishi mumkin (anon emas, service_role)

### Database ulanmayapti?
- Neon connection string da `?sslmode=require` borligini tekshiring
- Prisma `binaryTargets` da `rhel-openssl-3.0.x` borligini tekshiring

### Redis ulanmayapti?
- `rediss://` (s bilan) emas `redis://` ekanligiga ishonch hosil qiling
- Upstash dashboard da **TLS** yoqilganligini tekshiring

---

## 🔄 Yangilash

Yangilangan kodni push qilganda Vercel avtomatik rebuild qiladi:

```bash
git add . && git commit -m "update" && git push
```
