/**
 * PostgreSQL Seed Script for QANI?
 * Run with: npx tsx server/db/seed.ts
 */

import { prisma } from './prisma';
import { getTashkentDateString } from './store';

async function seed() {
  console.log('🌱 Seeding PostgreSQL database...');

  const now = new Date();
  const today = getTashkentDateString(now);

  // ─── Users ─────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { telegramId: BigInt(999999999) },
    update: {},
    create: {
      id: 'user_admin_001',
      telegramId: BigInt(999999999),
      username: 'qani_admin',
      firstName: 'Azizbek',
      lastName: 'Qodirov',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      region: 'Toshkent shahri',
      ageConfirmed: true,
      onboardingDone: true,
      role: 'SUPER_ADMIN',
      referralCode: 'REF_ADMIN',
      currentStreak: 12,
      longestStreak: 25,
      lastActiveDate: now,
      settings: {
        create: {
          language: 'uz',
          theme: 'system',
          notificationsEnabled: true,
          autoplayVideos: true,
        },
      },
    },
  });

  const user1 = await prisma.user.upsert({
    where: { telegramId: BigInt(100000001) },
    update: {},
    create: {
      id: 'user_001',
      telegramId: BigInt(100000001),
      username: 'jasur_vines',
      firstName: 'Jasur',
      lastName: 'Mirzayev',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      region: 'Toshkent shahri',
      ageConfirmed: true,
      onboardingDone: true,
      role: 'USER',
      referralCode: 'REF_JASUR',
      currentStreak: 5,
      longestStreak: 14,
      lastActiveDate: now,
      settings: {
        create: {
          language: 'uz',
          theme: 'system',
          notificationsEnabled: true,
          autoplayVideos: true,
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { telegramId: BigInt(100000002) },
    update: {},
    create: {
      id: 'user_002',
      telegramId: BigInt(100000002),
      username: 'madina_tech',
      firstName: 'Madina',
      lastName: 'Aliyeva',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      region: 'Samarqand',
      ageConfirmed: true,
      onboardingDone: true,
      role: 'USER',
      referralCode: 'REF_MADINA',
      currentStreak: 3,
      longestStreak: 8,
      lastActiveDate: now,
      settings: {
        create: {
          language: 'uz',
          theme: 'system',
          notificationsEnabled: true,
          autoplayVideos: true,
        },
      },
    },
  });

  const user3 = await prisma.user.upsert({
    where: { telegramId: BigInt(100000003) },
    update: {},
    create: {
      id: 'user_003',
      telegramId: BigInt(100000003),
      username: 'sardor_fit',
      firstName: 'Sardor',
      lastName: 'Kamilov',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      region: "Farg'ona",
      ageConfirmed: true,
      onboardingDone: true,
      role: 'USER',
      referralCode: 'REF_SARDOR',
      currentStreak: 7,
      longestStreak: 19,
      lastActiveDate: now,
      settings: {
        create: {
          language: 'uz',
          theme: 'system',
          notificationsEnabled: true,
          autoplayVideos: true,
        },
      },
    },
  });

  // ─── Challenges ────────────────────────────────────────────

  const startTime = new Date(now.getTime() - 4 * 3600 * 1000);
  const endTime = new Date(now.getTime() + 20 * 3600 * 1000);
  const futureStart = new Date(now.getTime() + 24 * 3600 * 1000);
  const futureEnd = new Date(now.getTime() + 48 * 3600 * 1000);

  const activeChallenge = await prisma.challenge.upsert({
    where: { id: 'ch_today_01' },
    update: {},
    create: {
      id: 'ch_today_01',
      title: "10 Million so'mlik Mahsulot!",
      description: 'Uyda turgan oddiy buyumni 10 soniyada 10 million so\'mlik premium mahsulotdek reklama qil.',
      instruction: 'Kamerani yoq, istalgan oddiy buyumni (chashka, ruchka, kalit) olib, eng qimmat VIP reklama ovozida taqdim et!',
      example: '"Bu oddiy paypoq emas, bu nano-ipdan to\'qilgan qirollik tajribasi..."',
      startTime,
      endTime,
      minDurationSec: 3,
      maxDurationSec: 15,
      status: 'ACTIVE',
      language: 'uz',
      sponsorName: 'QANI? Community',
      moderationLevel: 'STANDARD',
    },
  });

  const scheduledChallenge = await prisma.challenge.upsert({
    where: { id: 'ch_tomorrow_02' },
    update: {},
    create: {
      id: 'ch_tomorrow_02',
      title: "Eski O'zbek Film Saxnasi",
      description: "Sevimli o'zbek filmlaringizdan biror mashhur frazani kameraga emotsiya bilan aytib ber.",
      instruction: '"Shum bola", "Maysaraning ishi" yoki "Mahallada duv-duv gap" kabi filmlardan 10 soniyalik rol o\'yna!',
      example: '"E, xolamning uyi qayoqda dedi-ya..."',
      startTime: futureStart,
      endTime: futureEnd,
      minDurationSec: 3,
      maxDurationSec: 15,
      status: 'SCHEDULED',
      language: 'uz',
      moderationLevel: 'STANDARD',
    },
  });

  // ─── Submissions ───────────────────────────────────────────

  await prisma.submission.deleteMany({
    where: { id: { in: ['sub_demo_01', 'sub_demo_02'] } },
  });

  const sub1 = await prisma.submission.create({
    data: {
      id: 'sub_demo_01',
      userId: user1.id,
      challengeId: activeChallenge.id,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationSec: 10,
      processingStatus: 'READY',
      moderationStatus: 'APPROVED',
    },
  });

  const sub2 = await prisma.submission.create({
    data: {
      id: 'sub_demo_02',
      userId: user2.id,
      challengeId: activeChallenge.id,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      durationSec: 12,
      processingStatus: 'READY',
      moderationStatus: 'APPROVED',
    },
  });

  // ─── Reactions ─────────────────────────────────────────────

  await prisma.reaction.deleteMany({
    where: { id: { in: ['react_1', 'react_2', 'react_3'] } },
  });

  await prisma.reaction.createMany({
    data: [
      { id: 'react_1', userId: user2.id, submissionId: sub1.id, emoji: '🔥' },
      { id: 'react_2', userId: user3.id, submissionId: sub1.id, emoji: '😂' },
      { id: 'react_3', userId: user1.id, submissionId: sub2.id, emoji: '👏' },
    ],
    skipDuplicates: true,
  });

  // ─── Group ─────────────────────────────────────────────────

  const group = await prisma.group.upsert({
    where: { id: 'group_001' },
    update: {},
    create: {
      id: 'group_001',
      name: 'Toshkent Kreativchilari 🚀',
      description: "Har kuni video topshiriqlarni birgalikda bajaradigan doʻstlar klubi",
      creatorId: user1.id,
      inviteCode: 'toshkent-creatives',
      maxMembers: 50,
    },
  });

  // Add group members
  await prisma.groupMember.deleteMany({ where: { groupId: group.id } });
  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: user1.id },
      { groupId: group.id, userId: user2.id },
      { groupId: group.id, userId: admin.id },
    ],
    skipDuplicates: true,
  });

  // ─── Referral ────────────────────────────────────────────

  await prisma.referral.deleteMany({
    where: { id: 'ref_1' },
  });
  await prisma.referral.create({
    data: {
      id: 'ref_1',
      inviterId: user1.id,
      invitedId: user2.id,
      challengeId: activeChallenge.id,
      isActivated: true,
    },
  });

  // ─── Daily Activities ──────────────────────────────────────

  await prisma.dailyActivity.deleteMany({
    where: { id: { in: ['da_1', 'da_2'] } },
  });
  await prisma.dailyActivity.createMany({
    data: [
      { id: 'da_1', userId: user1.id, date: today, completed: true },
      { id: 'da_2', userId: user2.id, date: today, completed: true },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Challenges: ${await prisma.challenge.count()}`);
  console.log(`   Submissions: ${await prisma.submission.count()}`);
  console.log(`   Groups: ${await prisma.group.count()}`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
