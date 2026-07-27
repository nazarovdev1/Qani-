import { prisma } from './prisma';
import {
  User, Challenge, Submission, Reaction, Group,
  Role, ChallengeStatus, ProcessingStatus, ModerationStatus, ReportReason, ChallengeSchedule
} from './types';

// ─── Tashkent Timezone Helpers ───────────────────────────────────────

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function toTashkentDateString(date: Date = new Date()): string {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const tashkentDate = new Date(utc + TASHKENT_OFFSET_MS);
  return tashkentDate.toISOString().split('T')[0];
}

function toTashkentISOString(date: Date = new Date()): string {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + TASHKENT_OFFSET_MS).toISOString();
}

function nowInTashkent(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + TASHKENT_OFFSET_MS);
}

// ─── BigInt ↔ String Helpers ─────────────────────────────────────────

function bigIntToString(id: bigint): string {
  return String(id);
}

function stringToBigInt(id: string): bigint {
  return BigInt(id);
}

// ─── Prisma User → App User Mapper ───────────────────────────────────

function mapPrismaUser(u: any): User {
  return {
    id: u.id,
    telegramId: bigIntToString(u.telegramId),
    username: u.username ?? undefined,
    firstName: u.firstName,
    lastName: u.lastName ?? undefined,
    photoUrl: u.photoUrl ?? undefined,
    region: u.region ?? undefined,
    ageConfirmed: u.ageConfirmed,
    onboardingDone: u.onboardingDone,
    role: u.role as Role,
    isBlocked: u.isBlocked,
    referralCode: u.referralCode,
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak,
    lastActiveDate: u.lastActiveDate ? new Date(u.lastActiveDate).toISOString() : undefined,
    createdAt: new Date(u.createdAt).toISOString(),
    updatedAt: new Date(u.updatedAt).toISOString(),
  };
}

function mapPrismaChallenge(c: any): Challenge {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    instruction: c.instruction,
    example: c.example ?? undefined,
    startTime: new Date(c.startTime).toISOString(),
    endTime: new Date(c.endTime).toISOString(),
    minDurationSec: c.minDurationSec,
    maxDurationSec: c.maxDurationSec,
    status: c.status as ChallengeStatus,
    language: c.language,
    sponsorName: c.sponsorName ?? undefined,
    sponsorLogoUrl: c.sponsorLogoUrl ?? undefined,
    moderationLevel: c.moderationLevel,
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString(),
  };
}

function mapPrismaSubmission(s: any): Submission {
  return {
    id: s.id,
    userId: s.userId,
    challengeId: s.challengeId,
    groupId: s.groupId ?? undefined,
    videoUrl: s.videoUrl ?? undefined,
    thumbnailUrl: s.thumbnailUrl ?? undefined,
    durationSec: s.durationSec ?? undefined,
    processingStatus: s.processingStatus as ProcessingStatus,
    moderationStatus: s.moderationStatus as ModerationStatus,
    reportCount: s.reportCount,
    createdAt: new Date(s.createdAt).toISOString(),
    updatedAt: new Date(s.updatedAt).toISOString(),
  };
}

// ─── PrismaStore Class ─────────────────────────────────────────────

class PrismaStore {

  // ─── Users ─────────────────────────────────────────────────────

  async findUserByTelegramId(telegramId: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: stringToBigInt(telegramId) },
      });
      return user ? mapPrismaUser(user) : undefined;
    } catch (err) {
      console.error('Prisma findUserByTelegramId error:', err);
      return undefined;
    }
  }

  async findUserById(id: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? mapPrismaUser(user) : undefined;
    } catch (err) {
      console.error('Prisma findUserById error:', err);
      return undefined;
    }
  }

  async createUser(data: {
    telegramId: string;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
    region?: string;
    ageConfirmed: boolean;
    onboardingDone: boolean;
    referralCode?: string;
    role?: Role;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        telegramId: stringToBigInt(data.telegramId),
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.photoUrl,
        region: data.region,
        ageConfirmed: data.ageConfirmed,
        onboardingDone: data.onboardingDone,
        role: data.role || 'USER',
        referralCode: data.referralCode,
        currentStreak: 0,
        longestStreak: 0,
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
    return mapPrismaUser(user);
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updates,
        telegramId: updates.telegramId ? stringToBigInt(updates.telegramId) : undefined,
      },
    });
    return mapPrismaUser(user);
  }

  // ─── Challenges ────────────────────────────────────────────────

  async getActiveChallenge(): Promise<Challenge | undefined> {
    const now = nowInTashkent();
    const challenge = await prisma.challenge.findFirst({
      where: {
        status: 'ACTIVE',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { startTime: 'desc' },
    });
    // Fallback: if no time-matching challenge, just get any ACTIVE
    if (!challenge) {
      const fallback = await prisma.challenge.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { startTime: 'desc' },
      });
      return fallback ? mapPrismaChallenge(fallback) : undefined;
    }
    return mapPrismaChallenge(challenge);
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    return challenge ? mapPrismaChallenge(challenge) : undefined;
  }

  async getAllChallenges(): Promise<Challenge[]> {
    const challenges = await prisma.challenge.findMany({
      orderBy: { startTime: 'desc' },
    });
    return challenges.map(mapPrismaChallenge);
  }

  // ─── Challenge Schedule ──────────────────────────────────────────

  async getChallengeSchedule(): Promise<ChallengeSchedule> {
    let schedule = await prisma.challengeSchedule.findFirst();
    if (!schedule) {
      // Create default schedule
      schedule = await prisma.challengeSchedule.create({
        data: {
          intervalHours: 24,
          nextChallengeTime: new Date(Date.now() + 24 * 3600 * 1000),
          timezone: 'Asia/Tashkent',
        },
      });
    }
    return {
      id: schedule.id,
      intervalHours: schedule.intervalHours,
      nextChallengeTime: schedule.nextChallengeTime.toISOString(),
      timezone: schedule.timezone,
      updatedAt: schedule.updatedAt.toISOString(),
    };
  }

  async setChallengeSchedule(data: Partial<Omit<ChallengeSchedule, 'id' | 'updatedAt'>>): Promise<ChallengeSchedule> {
    let schedule = await prisma.challengeSchedule.findFirst();
    if (!schedule) {
      schedule = await prisma.challengeSchedule.create({
        data: {
          intervalHours: data.intervalHours ?? 24,
          nextChallengeTime: data.nextChallengeTime ? new Date(data.nextChallengeTime) : new Date(Date.now() + 24 * 3600 * 1000),
          timezone: data.timezone ?? 'Asia/Tashkent',
        },
      });
    } else {
      schedule = await prisma.challengeSchedule.update({
        where: { id: schedule.id },
        data: {
          ...(data.intervalHours !== undefined ? { intervalHours: data.intervalHours } : {}),
          ...(data.nextChallengeTime ? { nextChallengeTime: new Date(data.nextChallengeTime) } : {}),
          ...(data.timezone ? { timezone: data.timezone } : {}),
        },
      });
    }
    return {
      id: schedule.id,
      intervalHours: schedule.intervalHours,
      nextChallengeTime: schedule.nextChallengeTime.toISOString(),
      timezone: schedule.timezone,
      updatedAt: schedule.updatedAt.toISOString(),
    };
  }

  async getNextChallengeTime(): Promise<string> {
    // Check for active challenge
    const active = await this.getActiveChallenge();
    if (active) return active.endTime;

    // Check for scheduled challenge
    const scheduled = await prisma.challenge.findFirst({
      where: { status: 'SCHEDULED' },
      orderBy: { startTime: 'asc' },
    });
    if (scheduled) return scheduled.startTime.toISOString();

    // Fallback to schedule config
    const schedule = await this.getChallengeSchedule();
    return schedule.nextChallengeTime;
  }

  async createChallenge(data: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'> & { scheduledFor?: string }): Promise<Challenge> {
    // If scheduledFor is set, use it as startTime and set status to SCHEDULED
    let startTime = data.startTime;
    let status = data.status;
    if (data.scheduledFor) {
      startTime = data.scheduledFor;
      if (status === 'ACTIVE') {
        status = 'SCHEDULED';
      }
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        instruction: data.instruction,
        example: data.example,
        startTime: new Date(startTime),
        endTime: new Date(data.endTime),
        minDurationSec: data.minDurationSec,
        maxDurationSec: data.maxDurationSec,
        status: status as ChallengeStatus,
        language: data.language,
        sponsorName: data.sponsorName,
        sponsorLogoUrl: data.sponsorLogoUrl,
        moderationLevel: data.moderationLevel,
      },
    });
    return mapPrismaChallenge(challenge);
  }

  async updateChallenge(id: string, updates: Partial<Omit<Challenge, 'id' | 'createdAt'>>): Promise<Challenge | undefined> {
    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        ...updates,
        startTime: updates.startTime ? new Date(updates.startTime) : undefined,
        endTime: updates.endTime ? new Date(updates.endTime) : undefined,
      },
    });
    return mapPrismaChallenge(challenge);
  }

  // ─── Submissions ───────────────────────────────────────────────

  async getUserSubmissionForChallenge(userId: string, challengeId: string): Promise<Submission | undefined> {
    const submission = await prisma.submission.findFirst({
      where: {
        userId,
        challengeId,
        processingStatus: { not: 'REJECTED' },
      },
    });
    return submission ? mapPrismaSubmission(submission) : undefined;
  }

  async createSubmission(data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'reportCount'> & { userRole?: string }): Promise<Submission> {
    return prisma.$transaction(async (tx) => {
      // SUPER_ADMIN can post unlimited videos — don't delete existing submissions
      if (data.userRole !== 'SUPER_ADMIN') {
        // Delete any existing submission for this user+challenge
        await tx.submission.deleteMany({
          where: { userId: data.userId, challengeId: data.challengeId },
        });
      }

      const submission = await tx.submission.create({
        data: {
          userId: data.userId,
          challengeId: data.challengeId,
          groupId: data.groupId,
          videoUrl: data.videoUrl,
          durationSec: data.durationSec,
          processingStatus: data.processingStatus,
          moderationStatus: data.moderationStatus,
        },
      });

      // Update streak
      const today = toTashkentDateString();
      const existingActivity = await tx.dailyActivity.findUnique({
        where: { userId_date: { userId: data.userId, date: today } },
      });

      if (!existingActivity) {
        await tx.dailyActivity.create({
          data: {
            userId: data.userId,
            date: today,
            completed: true,
          },
        });

        const user = await tx.user.findUnique({ where: { id: data.userId } });
        if (user) {
          const newStreak = user.currentStreak + 1;
          const newLongest = Math.max(user.longestStreak, newStreak);
          await tx.user.update({
            where: { id: data.userId },
            data: {
              currentStreak: newStreak,
              longestStreak: newLongest,
              lastActiveDate: new Date(),
            },
          });
        }
      }

      return mapPrismaSubmission(submission);
    });
  }

  async updateSubmissionStatus(
    id: string,
    status: ProcessingStatus,
    videoUrl?: string,
    thumbnailUrl?: string
  ): Promise<Submission | undefined> {
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        processingStatus: status,
        videoUrl: videoUrl || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
      },
    });
    return mapPrismaSubmission(submission);
  }

  // ─── Feed ──────────────────────────────────────────────────────

  async getFeedForChallenge(
    challengeId: string,
    currentUserId: string
  ): Promise<Array<Submission & { user: User; reactionsCount: Record<string, number>; userReaction?: string }>> {
    const submissions = await prisma.submission.findMany({
      where: {
        challengeId,
        processingStatus: 'READY',
        moderationStatus: 'APPROVED',
      },
      include: {
        user: true,
        reactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map((s) => {
      const user = mapPrismaUser(s.user);
      const reactionsCount: Record<string, number> = {};
      s.reactions.forEach((r: any) => {
        reactionsCount[r.emoji] = (reactionsCount[r.emoji] || 0) + 1;
      });
      const userReaction = s.reactions.find((r: any) => r.userId === currentUserId)?.emoji;

      return {
        ...mapPrismaSubmission(s),
        user,
        reactionsCount,
        userReaction,
      };
    });
  }

  // ─── Reactions ─────────────────────────────────────────────────

  async toggleReaction(
    userId: string,
    submissionId: string,
    emoji: string
  ): Promise<{ action: 'added' | 'removed' | 'swapped'; emoji?: string }> {
    const existing = await prisma.reaction.findUnique({
      where: { userId_submissionId: { userId, submissionId } },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await prisma.reaction.delete({
          where: { id: existing.id },
        });
        return { action: 'removed' };
      } else {
        await prisma.reaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
        return { action: 'swapped', emoji };
      }
    } else {
      await prisma.reaction.create({
        data: { userId, submissionId, emoji },
      });
      return { action: 'added', emoji };
    }
  }

  // ─── Reports ───────────────────────────────────────────────────

  async createReport(
    reporterId: string,
    submissionId: string,
    reason: ReportReason,
    details?: string
  ): Promise<{ success: boolean; message: string }> {
    const existing = await prisma.report.findUnique({
      where: { reporterId_submissionId: { reporterId, submissionId } },
    });
    if (existing) {
      return { success: false, message: 'Siz bu videoni allaqachon xabar qilgansiz.' };
    }

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      return { success: false, message: 'Video topilmadi.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.report.create({
        data: {
          reporterId,
          submissionId,
          challengeId: submission.challengeId,
          reason,
          details,
        },
      });

      const newCount = submission.reportCount + 1;
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          reportCount: newCount,
          moderationStatus: newCount >= 3 ? 'UNDER_REVIEW' : submission.moderationStatus,
        },
      });
    });

    return { success: true, message: 'Xabaringiz qabul qilindi. Rahmat!' };
  }

  // ─── Referrals ─────────────────────────────────────────────────

  async registerReferral(inviterUserId: string, newUserId: string, challengeId?: string): Promise<boolean> {
    if (inviterUserId === newUserId) return false;
    const existing = await prisma.referral.findFirst({
      where: { invitedId: newUserId },
    });
    if (existing) return false;

    try {
      await prisma.referral.create({
        data: {
          inviterId: inviterUserId,
          invitedId: newUserId,
          challengeId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getReferralStats(inviterId: string) {
    const referrals = await prisma.referral.findMany({
      where: { inviterId },
      include: { invited: { select: { id: true, firstName: true, lastName: true, username: true, photoUrl: true } } },
    });

    const totalSignups = referrals.length;

    // Check activation (invited user has at least 1 READY submission)
    let activated = 0;
    for (const ref of referrals) {
      const hasSubmission = await prisma.submission.findFirst({
        where: { userId: ref.invitedId, processingStatus: 'READY' },
      });
      if (ref.isActivated || hasSubmission) {
        activated++;
      }
    }

    // Simulated social-proof numbers (always shows bigger activity)
    const SIMULATED_BASE = 127;

    return {
      linkOpens: totalSignups * 3 + 42,
      signups: totalSignups + 15,
      activated: activated + SIMULATED_BASE,
      referralsList: referrals.map((r) => {
        const user = r.invited;
        return {
          id: r.id,
          name: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Foydalanuvchi',
          username: user?.username,
          photoUrl: user?.photoUrl,
          joinedAt: new Date(r.createdAt).toISOString(),
          isActivated: r.isActivated,
        };
      }),
    };
  }

  // ─── Groups ────────────────────────────────────────────────────

  async createGroup(creatorId: string, name: string, description?: string, maxMembers = 50): Promise<Group> {
    const inviteCode = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name,
          description,
          creatorId,
          inviteCode,
          maxMembers,
        },
      });

      await tx.groupMember.create({
        data: { groupId: g.id, userId: creatorId },
      });

      return g;
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description ?? undefined,
      creatorId: group.creatorId,
      inviteCode: group.inviteCode,
      maxMembers: group.maxMembers,
      createdAt: new Date(group.createdAt).toISOString(),
      updatedAt: new Date(group.updatedAt).toISOString(),
    };
  }

  async joinGroup(userId: string, inviteCode: string): Promise<{ success: boolean; group?: Group; message?: string }> {
    const group = await prisma.group.findFirst({
      where: { OR: [{ inviteCode }, { id: inviteCode }] },
      include: { members: true },
    });

    if (!group) {
      return { success: false, message: 'Guruh topilmadi.' };
    }

    if (group.members.length >= group.maxMembers) {
      return { success: false, message: "Guruh a'zolari soni chegarasiga yetgan." };
    }

    const alreadyMember = group.members.some((m) => m.userId === userId);
    if (alreadyMember) {
      return {
        success: true,
        group: {
          id: group.id,
          name: group.name,
          description: group.description ?? undefined,
          creatorId: group.creatorId,
          inviteCode: group.inviteCode,
          maxMembers: group.maxMembers,
          createdAt: new Date(group.createdAt).toISOString(),
          updatedAt: new Date(group.updatedAt).toISOString(),
        },
        message: "Siz allaqachon ushbu guruh a'zosisiz.",
      };
    }

    await prisma.groupMember.create({
      data: { groupId: group.id, userId },
    });

    return {
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description ?? undefined,
        creatorId: group.creatorId,
        inviteCode: group.inviteCode,
        maxMembers: group.maxMembers,
        createdAt: new Date(group.createdAt).toISOString(),
        updatedAt: new Date(group.updatedAt).toISOString(),
      },
    };
  }

  async getUserGroups(userId: string): Promise<
    Array<Group & { memberCount: number; todayCompletedCount: number; userCompletedToday: boolean }>
  > {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: { include: { members: true } },
      },
    });

    const activeChallenge = await this.getActiveChallenge();

    // If there's an active challenge, get all relevant submissions in one query
    let memberSubmissions: Map<string, boolean> = new Map();
    if (activeChallenge) {
      const allMemberIds = memberships.flatMap(m => m.group.members.map(mem => mem.userId));
      const uniqueMemberIds = [...new Set(allMemberIds)];

      const submissions = await prisma.submission.findMany({
        where: {
          userId: { in: uniqueMemberIds },
          challengeId: activeChallenge.id,
          processingStatus: 'READY',
        },
        select: { userId: true },
      });

      submissions.forEach(s => memberSubmissions.set(s.userId, true));
    }

    return memberships.map((m) => {
      const group = m.group;
      let todayCompletedCount = 0;
      let userCompletedToday = false;

      if (activeChallenge) {
        group.members.forEach((member) => {
          if (memberSubmissions.has(member.userId)) {
            todayCompletedCount++;
            if (member.userId === userId) userCompletedToday = true;
          }
        });
      }

      return {
        id: group.id,
        name: group.name,
        description: group.description ?? undefined,
        creatorId: group.creatorId,
        inviteCode: group.inviteCode,
        maxMembers: group.maxMembers,
        createdAt: new Date(group.createdAt).toISOString(),
        updatedAt: new Date(group.updatedAt).toISOString(),
        memberCount: group.members.length,
        todayCompletedCount,
        userCompletedToday,
      };
    });
  }

  // ─── Analytics ─────────────────────────────────────────────────

  async logAnalytics(
    eventName: string,
    userId?: string,
    challengeId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId,
          challengeId,
          eventName,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (err) {
      console.error('Analytics logging error:', err);
    }
  }

  async getDashboardAnalytics() {
    const today = toTashkentDateString();
    const todayStart = new Date(`${today}T00:00:00.000Z`);
    const todayEnd = new Date(`${today}T23:59:59.999Z`);

    const [
      totalUsers,
      totalSubmissions,
      readySubmissions,
      referralSignups,
      newUsersToday,
      activeToday,
      firstChallengeCompleters,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { processingStatus: 'READY' } }),
      prisma.referral.count(),
      prisma.user.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.dailyActivity.count({
        where: { date: today },
      }),
      prisma.user.count({
        where: { currentStreak: { gte: 1 } },
      }),
    ]);

    const recentReports = await prisma.report.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        submission: { select: { id: true } },
        reporter: { select: { firstName: true, lastName: true } },
      },
    });

    const recentSubmissions = await prisma.submission.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        challenge: { select: { title: true } },
      },
    });

    return {
      totalUsers,
      newUsersToday,
      activeToday,
      totalSubmissions,
      readySubmissions,
      processingSuccessRate: totalSubmissions > 0
        ? Math.round((readySubmissions / totalSubmissions) * 100)
        : 100,
      referralSignups,
      firstChallengeCompleters,
      recentReports,
      recentSubmissions: recentSubmissions.map((s) => ({
        ...mapPrismaSubmission(s),
        userName: `${s.user.firstName} ${s.user.lastName || ''}`.trim(),
        challengeTitle: s.challenge?.title || 'Challenge',
      })),
    };
  }

  // ─── Admin Helpers ───────────────────────────────────────────

  async getFlaggedSubmissions() {
    const submissions = await prisma.submission.findMany({
      where: {
        AND: [
          {
            OR: [
              { reportCount: { gt: 0 } },
              { moderationStatus: 'UNDER_REVIEW' },
            ],
          },
          {
            moderationStatus: {
              notIn: ['REMOVED', 'REJECTED'],
            },
          },
        ],
      },
      include: {
        user: true,
        reports: { include: { reporter: { select: { firstName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map((s: any) => ({
      ...mapPrismaSubmission(s),
      userName: `${s.user.firstName} ${s.user.lastName || ''}`.trim(),
      reports: s.reports.map((r: any) => ({
        id: r.id,
        reporterId: r.reporterId,
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter ? { firstName: r.reporter.firstName } : undefined,
      })),
    }));
  }

  async updateSubmissionModeration(submissionId: string, status: ModerationStatus): Promise<void> {
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        moderationStatus: status,
        reportCount: 0,
      },
    });
  }

  // ─── Notifications ─────────────────────────────────────────────

  async createNotification(userId: string, title: string, message: string, type: string): Promise<void> {
    await prisma.notification.create({
      data: { userId, title, message, type, isRead: false },
    });
  }

  async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async getAdminUsers() {
    return prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });
  }

  // ─── Comments ──────────────────────────────────────────────────

  async createComment(userId: string, submissionId: string, text: string) {
    return prisma.comment.create({
      data: { userId, submissionId, text },
      include: { user: true },
    });
  }

  async getCommentsBySubmission(submissionId: string) {
    return prisma.comment.findMany({
      where: { submissionId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteComment(id: string, userId: string, isAdmin: boolean = false): Promise<{ success: boolean; message: string }> {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return { success: false, message: 'Komment topilmadi.' };
    }
    if (!isAdmin && comment.userId !== userId) {
      return { success: false, message: 'Faqat o‘z kommentingizni o‘chira olasiz.' };
    }
    await prisma.comment.delete({ where: { id } });
    return { success: true, message: 'Komment o‘chirildi.' };
  }

  // ─── Compatibility: getData (returns minimal structure for dev) ─

  getData() {
    // This is used in some endpoints that iterate over all data
    // In Prisma mode, this returns an empty structure
    // Endpoints should be rewritten to use Prisma directly
    return {
      users: [],
      userSettings: [],
      challenges: [],
      submissions: [],
      mediaAssets: [],
      reactions: [],
      referrals: [],
      groups: [],
      groupMembers: [],
      reports: [],
      moderationActions: [],
      dailyActivities: [],
      analyticsEvents: [],
      notifications: [],
      auditLogs: [],
    };
  }
}

export const prismaStore = new PrismaStore();
