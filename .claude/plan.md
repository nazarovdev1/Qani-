# QANI? — Production Ready Plan

## Problem
Current system uses JSON file store (`.qani_data.json`) for everything. This is:
- Not persistent across deploys
- Not thread-safe
- Can't scale horizontally
- No ACID guarantees

## Solution: Dual-Mode Database Layer

### Architecture
Create a new `PrismaStore` class that implements the SAME interface as `StoreAdapter` (from `server/db/store.ts`). This allows the router and auth middleware to switch between JSON store and PostgreSQL seamlessly.

```
router.ts ──► dbStore (StoreAdapter) ──► .qani_data.json
           or
           ──► prismaStore (PrismaStore) ──► PostgreSQL (Render)
```

### Implementation Strategy

#### Phase 1: Create PrismaStore Service (`server/db/prismaStore.ts`)
Implement ALL methods from `StoreAdapter` using Prisma:

**User Management:**
- `findUserByTelegramId(telegramId)` → `prisma.user.findUnique({ where: { telegramId } })`
- `findUserById(id)` → `prisma.user.findUnique({ where: { id } })`
- `createUser(data)` → `prisma.user.create()` + `prisma.userSettings.create()`
- `updateUser(id, updates)` → `prisma.user.update()`

**Challenge Management:**
- `getActiveChallenge()` → `prisma.challenge.findFirst({ where: { status: 'ACTIVE', startTime <= now, endTime >= now } })`
- `getAllChallenges()` → `prisma.challenge.findMany({ orderBy: { startTime: 'desc' } })`
- `createChallenge(data)` → `prisma.challenge.create()`
- `updateChallenge(id, data)` → `prisma.challenge.update()`

**Submission Management:**
- `getUserSubmissionForChallenge(userId, challengeId)` → `prisma.submission.findFirst()`
- `createSubmission(data)` → `prisma.submission.create()` with transaction (also update DailyActivity, User streak)
- `updateSubmissionStatus(id, status, videoUrl, thumbnailUrl)` → `prisma.submission.update()`

**Feed:**
- `getFeedForChallenge(challengeId, currentUserId)` → Complex Prisma query with `include: { user: true, reactions: true }`

**Reactions:**
- `toggleReaction(userId, submissionId, emoji)` → `prisma.reaction.upsert()` with delete logic

**Reports:**
- `createReport(reporterId, submissionId, reason, details)` → `prisma.report.create()` + update submission reportCount

**Referrals:**
- `registerReferral(inviterId, invitedId, challengeId)` → `prisma.referral.create()`
- `getReferralStats(inviterId)` → Aggregate query with `prisma.referral.findMany()`

**Groups:**
- `createGroup(creatorId, name, description, maxMembers)` → Transaction: `prisma.group.create()` + `prisma.groupMember.create()`
- `joinGroup(userId, inviteCode)` → `prisma.groupMember.create()`
- `getUserGroups(userId)` → Query with member counts and today's completion stats

**Analytics:**
- `logAnalytics(eventName, userId, challengeId, metadata)` → `prisma.analyticsEvent.create()`
- `getDashboardAnalytics()` → Multiple `prisma.count()` + `prisma.findMany()` queries

**Critical Timezone Handling:**
All date comparisons must use Asia/Tashkent timezone. Prisma stores `DateTime` in UTC, so queries need:
```typescript
const now = new Date();
const tashkentNow = new Date(now.getTime() + (now.getTimezoneOffset() + 300) * 60000);
```

#### Phase 2: Update Auth Middleware (`server/middleware/telegramAuth.ts`)
- Make auth middleware use Prisma when DB is connected
- Keep mock auth fallback for development
- Handle `BigInt` vs `string` conversion (Prisma `telegramId` is `BigInt`, but headers are strings)

#### Phase 3: Add Rate Limiting
- Wire up `express-rate-limit` in `server.ts`
- Different limits for auth (strict) vs other endpoints (moderate)

#### Phase 4: Update Server Entry
- Graceful fallback: if PostgreSQL fails, use JSON store
- Add connection pooling for Prisma
- Add proper error handling middleware

#### Phase 5: Environment Configuration
- `.env` already has Render PostgreSQL and Upstash Redis
- Need to add `USE_POSTGRES=true` flag to enable Prisma mode

## Files to Create/Modify

### New Files:
1. `server/db/prismaStore.ts` — Full Prisma data layer (~500 lines)
2. `server/middleware/rateLimit.ts` — Rate limiting config

### Modified Files:
1. `server.ts` — Add error middleware, rate limiting, graceful startup
2. `server/api/router.ts` — Switch from `dbStore` to dynamic store
3. `server/middleware/telegramAuth.ts` — Prisma user lookups
4. `server/db/prisma.ts` — Add connection pooling config

## Rollback Strategy
If Prisma fails, the app should automatically fall back to `dbStore` (JSON). Controlled by `USE_POSTGRES` env var.

## Testing Plan
1. Start server → verify PostgreSQL connection
2. Test mock auth → verify user lookup works
3. Test `/health` → verify DB status
4. Test challenge creation → verify Prisma writes
5. Test submission → verify transactions work
6. Test feed → verify relations work
7. Test Redis → verify video queue works
