# QANI? - Architectural & Engineering Decisions Log (DECISIONS.md)

This document records the architectural, technical, and product decisions made during the development of the "QANI?" Telegram Mini App MVP.

---

## 1. Local Development Database Adapter & Hybrid Prisma Architecture
* **Decision**: Implemented an in-memory & file-persisted JSON database adapter alongside the full Prisma PostgreSQL schema.
* **Rationale**: Enables seamless, zero-config local development and testing in Cloud Run container sandboxes without requiring an external PostgreSQL instance to be pre-provisioned, while supplying production-ready Prisma schema and migration scripts (`prisma/schema.prisma` & `prisma/migrations/`).
* **Production Impact**: When `DATABASE_URL` is supplied in production, the system automatically uses Prisma Client with PostgreSQL.

## 2. Dual-Mode Authentication (Telegram `initData` + Dev Mock Auth)
* **Decision**: All production endpoints validate the cryptographic HMAC-SHA256 signature of Telegram WebApp `initData` using `BOT_TOKEN`. For local/staging development, a toggleable Dev Mock Auth mode allows instant switching between mock users (Standard User, Admin, Super Admin) directly from the header without opening Telegram.
* **Rationale**: Enables rapid UI/API iteration in web browsers while maintaining strict security for Telegram Mini App deployment.

## 3. Video Upload Strategy: Direct S3 Presigned URL Abstraction
* **Decision**: Videos are uploaded directly to Object Storage via signed upload endpoints (or local storage adapter in dev), rather than proxying raw video bytes through the Express API server.
* **Rationale**: Protects server bandwidth and memory from video streaming overhead.

## 4. Background Queue & Video Processing (FFmpeg Abstraction)
* **Decision**: Video processing (transcoding to 720p max, extracting JPEG thumbnail, duration verification) is handled asynchronously via a background task queue abstraction (`videoWorker.ts`).
* **Rationale**: Keeps the upload response instant. Users receive a `PROCESSING` status and poll or receive SSE/updates when the video turns `READY`.

## 5. Asia/Tashkent Timezone & Streak Rule
* **Decision**: All challenge reset times, countdowns, and daily streaks are explicitly calculated using `Asia/Tashkent` UTC+5 timezone offset.
* **Rationale**: "QANI?" target audience is in Uzbekistan. Using local midnight guarantees fair streak calculations regardless of server UTC time.

## 6. Feed Locking & Anti-Peeking Rule
* **Decision**: A user's friends feed, group feeds, and reactions remain locked (blurred with a call-to-action) until the user successfully submits today's video challenge.
* **Rationale**: Core product engine incentive: "You must participate before you can watch others."

## 7. Camera Recording & Browser Fallback
* **Decision**: Primary video capture uses standard HTML5 `MediaRecorder` with stream constraints (front/rear camera switch, 3-15 sec timer). If camera permissions are blocked or WebGL/MediaRecorder fails in restricted WebViews, a graceful file uploader fallback is provided.
* **Rationale**: Guarantees 100% device compatibility across low-end Android WebView devices and Telegram iOS/Android clients.

## 8. Referral Deep-Linking via Telegram `startapp`
* **Decision**: Deep-links format: `https://t.me/qani_app_bot/app?startapp=ref_USERID_CHALLENGEID`.
* **Rationale**: Standard Telegram WebApp parameter parsing (`Telegram.WebApp.initDataUnsafe.start_param`) extracts inviter ID and binds referrals upon account creation.
