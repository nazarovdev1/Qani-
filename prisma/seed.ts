// @ts-ignore
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding QANI? database...');

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { telegramId: BigInt(999999999) },
    update: {},
    create: {
      telegramId: BigInt(999999999),
      username: 'qani_admin',
      firstName: 'Azizbek',
      lastName: 'Qodirov',
      region: 'Toshkent shahri',
      ageConfirmed: true,
      onboardingDone: true,
      role: 'SUPER_ADMIN',
      referralCode: 'REF_ADMIN',
      currentStreak: 10,
      longestStreak: 20
    }
  });

  // Create Today's Active Challenge
  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 3600 * 1000);
  const endTime = new Date(now.getTime() + 22 * 3600 * 1000);

  const activeChallenge = await prisma.challenge.create({
    data: {
      title: '10 Million so‘mlik Mahsulot!',
      description: 'Uyda turgan oddiy buyumni 10 soniyada 10 million so‘mlik premium mahsulotdek reklama qil.',
      instruction: 'Kamerani yoq, istalgan oddiy buyumni olib, VIP reklama ovozida taqdim et!',
      example: '“Bu oddiy paypoq emas, nano-ipdan to‘qilgan qirollik tajribasi...”',
      startTime,
      endTime,
      minDurationSec: 3,
      maxDurationSec: 15,
      status: 'ACTIVE',
      language: 'uz'
    }
  });

  console.log(`Database seeded! Admin: ${admin.id}, Active Challenge: ${activeChallenge.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
