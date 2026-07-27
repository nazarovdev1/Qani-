import fs from 'fs';
import path from 'path';
import {
  User, UserSettings, Challenge, Submission, MediaAsset,
  Reaction, Referral, Group, GroupMember, Report,
  ModerationAction, DailyActivity, AnalyticsEvent, Notification, AuditLog, Comment,
  ProcessingStatus, ReportReason, ChallengeSchedule
} from './types';
import { sendChallengeNotification } from '../bot/telegramBot';

const DB_FILE = path.join(process.cwd(), '.qani_data.json');

export interface DatabaseData {
  users: User[];
  userSettings: UserSettings[];
  challenges: Challenge[];
  challengeSchedule: ChallengeSchedule;
  submissions: Submission[];
  mediaAssets: MediaAsset[];
  reactions: Reaction[];
  referrals: Referral[];
  groups: Group[];
  groupMembers: GroupMember[];
  reports: Report[];
  moderationActions: ModerationAction[];
  dailyActivities: DailyActivity[];
  analyticsEvents: AnalyticsEvent[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  comments: Comment[];
}

// Tashkent Time Helper
export function getTashkentDateString(date = new Date()): string {
  // Asia/Tashkent UTC+5
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const tashkentOffset = 5 * 60 * 60000;
  const tashkentDate = new Date(utc + tashkentOffset);
  return tashkentDate.toISOString().split('T')[0];
}

export function getTashkentISOString(date = new Date()): string {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const tashkentOffset = 5 * 60 * 60000;
  return new Date(utc + tashkentOffset).toISOString();
}

function seedDatabase(): DatabaseData {
  const now = new Date();
  const startTime = new Date(now.getTime() - 4 * 3600 * 1000).toISOString(); // started 4 hours ago
  const endTime = new Date(now.getTime() + 20 * 3600 * 1000).toISOString(); // ends in 20 hours

  const futureStart = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const futureEnd = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

  // Admin user
  const adminUser: User = {
    id: 'user_admin_001',
    telegramId: '999999999',
    username: 'qani_admin',
    firstName: 'Azizbek',
    lastName: 'Qodirov',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    region: 'Toshkent shahri',
    ageConfirmed: true,
    onboardingDone: true,
    role: 'SUPER_ADMIN',
    isBlocked: false,
    referralCode: 'REF_ADMIN',
    currentStreak: 12,
    longestStreak: 25,
    lastActiveDate: getTashkentDateString(),
    createdAt: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Demo user 1 (Inviter)
  const user1: User = {
    id: 'user_001',
    telegramId: '100000001',
    username: 'jasur_vines',
    firstName: 'Jasur',
    lastName: 'Mirzayev',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    region: 'Toshkent shahri',
    ageConfirmed: true,
    onboardingDone: true,
    role: 'USER',
    isBlocked: false,
    referralCode: 'REF_JASUR',
    currentStreak: 5,
    longestStreak: 14,
    lastActiveDate: getTashkentDateString(),
    createdAt: new Date(now.getTime() - 15 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Demo user 2
  const user2: User = {
    id: 'user_002',
    telegramId: '100000002',
    username: 'madina_tech',
    firstName: 'Madina',
    lastName: 'Aliyeva',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    region: 'Samarqand',
    ageConfirmed: true,
    onboardingDone: true,
    role: 'USER',
    isBlocked: false,
    referralCode: 'REF_MADINA',
    currentStreak: 3,
    longestStreak: 8,
    lastActiveDate: getTashkentDateString(),
    createdAt: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Demo user 3
  const user3: User = {
    id: 'user_003',
    telegramId: '100000003',
    username: 'sardor_fit',
    firstName: 'Sardor',
    lastName: 'Kamilov',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    region: 'Fargʻona',
    ageConfirmed: true,
    onboardingDone: true,
    role: 'USER',
    isBlocked: false,
    referralCode: 'REF_SARDOR',
    currentStreak: 7,
    longestStreak: 19,
    lastActiveDate: getTashkentDateString(),
    createdAt: new Date(now.getTime() - 20 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Active Challenge today
  const activeChallenge: Challenge = {
    id: 'ch_today_01',
    title: '10 Million so‘mlik Mahsulot!',
    description: 'Uyda turgan oddiy buyumni 10 soniyada 10 million so‘mlik premium mahsulotdek reklama qil.',
    instruction: 'Kamerani yoq, istalgan oddiy buyumni (chashka, ruchka, kalit) olib, eng qimmat VIP reklama ovozida taqdim et!',
    example: '“Bu oddiy paypoq emas, bu nano-ipdan to‘qilgan qirollik tajribasi...”',
    startTime,
    endTime,
    minDurationSec: 3,
    maxDurationSec: 15,
    status: 'ACTIVE',
    language: 'uz',
    sponsorName: 'QANI? Community',
    moderationLevel: 'STANDARD',
    createdAt: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Scheduled Challenge tomorrow
  const scheduledChallenge: Challenge = {
    id: 'ch_tomorrow_02',
    title: 'Eski Oʻzbek Film Saxnasi',
    description: 'Sevimli oʻzbek filmlaringizdan biror mashhur frazani kameraga emotsiya bilan aytib ber.',
    instruction: '“Shum bola”, “Maysaraning ishi” yoki “Mahallada duv-duv gap” kabi filmlardan 10 soniyalik rol o‘yna!',
    example: '“E, xolamning uyi qayoqda dedi-ya...”',
    startTime: futureStart,
    endTime: futureEnd,
    minDurationSec: 3,
    maxDurationSec: 15,
    status: 'SCHEDULED',
    language: 'uz',
    moderationLevel: 'STANDARD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Sample Submissions for today's challenge
  const sub1: Submission = {
    id: 'sub_demo_01',
    userId: 'user_001',
    challengeId: 'ch_today_01',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSec: 10,
    processingStatus: 'READY',
    moderationStatus: 'APPROVED',
    reportCount: 0,
    createdAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sub2: Submission = {
    id: 'sub_demo_02',
    userId: 'user_002',
    challengeId: 'ch_today_01',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationSec: 12,
    processingStatus: 'READY',
    moderationStatus: 'APPROVED',
    reportCount: 0,
    createdAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Sample Demo Group
  const group1: Group = {
    id: 'group_001',
    name: 'Toshkent Kreativchilari 🚀',
    description: 'Har kuni video topshiriqlarni birgalikda bajaradigan doʻstlar klubi',
    creatorId: 'user_001',
    inviteCode: 'toshkent-creatives',
    maxMembers: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const groupMembers: GroupMember[] = [
    { id: 'gm_1', groupId: 'group_001', userId: 'user_001', joinedAt: new Date().toISOString() },
    { id: 'gm_2', groupId: 'group_001', userId: 'user_002', joinedAt: new Date().toISOString() },
    { id: 'gm_3', groupId: 'group_001', userId: 'user_admin_001', joinedAt: new Date().toISOString() },
  ];

  const reactions: Reaction[] = [
    { id: 'react_1', userId: 'user_002', submissionId: 'sub_demo_01', emoji: '🔥', createdAt: new Date().toISOString() },
    { id: 'react_2', userId: 'user_003', submissionId: 'sub_demo_01', emoji: '😂', createdAt: new Date().toISOString() },
    { id: 'react_3', userId: 'user_001', submissionId: 'sub_demo_02', emoji: '👏', createdAt: new Date().toISOString() },
  ];

  const referrals: Referral[] = [
    { id: 'ref_1', inviterId: 'user_001', invitedId: 'user_002', challengeId: 'ch_today_01', isActivated: true, createdAt: new Date().toISOString() }
  ];

  // Default challenge schedule
  const defaultSchedule: ChallengeSchedule = {
    id: 'schedule_default',
    intervalHours: 24,
    nextChallengeTime: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
    timezone: 'Asia/Tashkent',
    updatedAt: new Date().toISOString(),
  };

  return {
    users: [adminUser, user1, user2, user3],
    userSettings: [
      { id: 's_admin', userId: adminUser.id, language: 'uz', theme: 'system', notificationsEnabled: true, autoplayVideos: true, updatedAt: new Date().toISOString() },
      { id: 's_u1', userId: user1.id, language: 'uz', theme: 'system', notificationsEnabled: true, autoplayVideos: true, updatedAt: new Date().toISOString() },
      { id: 's_u2', userId: user2.id, language: 'uz', theme: 'system', notificationsEnabled: true, autoplayVideos: true, updatedAt: new Date().toISOString() },
      { id: 's_u3', userId: user3.id, language: 'uz', theme: 'system', notificationsEnabled: true, autoplayVideos: true, updatedAt: new Date().toISOString() },
    ],
    challenges: [activeChallenge, scheduledChallenge],
    challengeSchedule: defaultSchedule,
    submissions: [sub1, sub2],
    mediaAssets: [],
    reactions,
    referrals,
    groups: [group1],
    groupMembers,
    reports: [],
    moderationActions: [],
    dailyActivities: [
      { id: 'da_1', userId: user1.id, date: getTashkentDateString(), completed: true, createdAt: new Date().toISOString() },
      { id: 'da_2', userId: user2.id, date: getTashkentDateString(), completed: true, createdAt: new Date().toISOString() }
    ],
    analyticsEvents: [
      { id: 'ae_1', userId: user1.id, eventName: 'APP_OPENED', createdAt: new Date().toISOString() },
      { id: 'ae_2', userId: user1.id, eventName: 'SUBMISSION_READY', challengeId: 'ch_today_01', createdAt: new Date().toISOString() }
    ],
    notifications: [],
    auditLogs: [],
    comments: []
  };
}

class StoreAdapter {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.warn('Could not load persistent store, seeding fresh DB data:', e);
    }
    const fresh = seedDatabase();
    this.saveData(fresh);
    return fresh;
  }

  public saveData(dataToSave?: DatabaseData) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database state to disk:', e);
    }
  }

  public getData(): DatabaseData {
    return this.data;
  }

  // User queries
  public findUserByTelegramId(telegramId: string): User | undefined {
    return this.data.users.find(u => u.telegramId === telegramId);
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getAllUsers(): User[] {
    return [...this.data.users];
  }

  public createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'currentStreak' | 'longestStreak' | 'role' | 'isBlocked' | 'referralCode'> & { referralCode?: string, role?: User['role'] }): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();
    const newUser: User = {
      id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      region: user.region,
      ageConfirmed: user.ageConfirmed,
      onboardingDone: user.onboardingDone,
      role: user.role || 'USER',
      isBlocked: false,
      referralCode: user.referralCode || `REF_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: nowISO,
      updatedAt: nowISO
    };
    this.data.users.push(newUser);

    // Default settings
    this.data.userSettings.push({
      id: `set_${id}`,
      userId: id,
      language: 'uz',
      theme: 'system',
      notificationsEnabled: true,
      autoplayVideos: true,
      updatedAt: nowISO
    });

    this.saveData();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return this.data.users[index];
  }

  // Active Challenge query — also auto-activates SCHEDULED challenges whose startTime has passed
  public getActiveChallenge(): Challenge | undefined {
    const now = new Date();

    // Auto-activate any SCHEDULED challenges whose startTime has passed
    const toActivate = this.data.challenges.filter(c =>
      c.status === 'SCHEDULED' && new Date(c.startTime) <= now
    );
    for (const ch of toActivate) {
      ch.status = 'ACTIVE';
      ch.updatedAt = new Date().toISOString();
    }
    if (toActivate.length > 0) {
      this.saveData();
      // Send Telegram notifications for newly activated challenges
      for (const ch of toActivate) {
        this.sendNewChallengeNotifications(ch);
      }
    }

    // Find currently active challenge
    return this.data.challenges.find(c => {
      if (c.status !== 'ACTIVE') return false;
      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      return now >= start && now <= end;
    }) || this.data.challenges.find(c => c.status === 'ACTIVE');
  }

  private sendNewChallengeNotifications(challenge: Challenge): void {
    const users = this.data.users.filter(u => !u.isBlocked);
    for (const user of users) {
      // Fire-and-forget — don't block the request
      sendChallengeNotification(user.telegramId, challenge.title, challenge.description)
        .catch(err => console.error('Failed to send notification to', user.telegramId, err));
    }
    console.log(`[Bot] Sent challenge notifications to ${users.length} users`);
  }

  public getChallengeById(id: string): Challenge | undefined {
    return this.data.challenges.find(c => c.id === id);
  }

  public getAllChallenges(): Challenge[] {
    return this.data.challenges.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  // ─── Challenge Schedule ──────────────────────────────────────────

  public getChallengeSchedule(): ChallengeSchedule {
    return this.data.challengeSchedule;
  }

  public setChallengeSchedule(data: Partial<Omit<ChallengeSchedule, 'id' | 'updatedAt'>>): ChallengeSchedule {
    this.data.challengeSchedule = {
      ...this.data.challengeSchedule,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return this.data.challengeSchedule;
  }

  public getNextChallengeTime(): string {
    // If there's an active challenge, return its endTime
    const active = this.getActiveChallenge();
    if (active) {
      return active.endTime;
    }
    // If there's a SCHEDULED challenge, return its startTime
    const scheduled = this.data.challenges
      .filter(c => c.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
    if (scheduled) {
      return scheduled.startTime;
    }
    // Fallback to schedule config
    return this.data.challengeSchedule.nextChallengeTime;
  }

  public createChallenge(c: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'> & { scheduledFor?: string }): Challenge {
    const id = `ch_${Date.now()}`;
    const nowISO = new Date().toISOString();

    // If scheduledFor is set, use it as startTime and set status to SCHEDULED
    let startTime = c.startTime;
    let status = c.status;
    if (c.scheduledFor) {
      startTime = c.scheduledFor;
      if (status === 'ACTIVE') {
        status = 'SCHEDULED';
      }
    }

    // Clean up scheduledFor from the spread
    const { scheduledFor, ...rest } = c;

    const newChallenge: Challenge = {
      ...rest,
      id,
      startTime,
      status: status as Challenge['status'],
      createdAt: nowISO,
      updatedAt: nowISO
    };
    this.data.challenges.push(newChallenge);
    this.saveData();
    return newChallenge;
  }

  public updateChallenge(id: string, updates: Partial<Challenge>): Challenge | undefined {
    const idx = this.data.challenges.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.challenges[idx] = {
      ...this.data.challenges[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return this.data.challenges[idx];
  }

  // Submissions queries
  public getUserSubmissionForChallenge(userId: string, challengeId: string): Submission | undefined {
    return this.data.submissions.find(s => s.userId === userId && s.challengeId === challengeId && s.processingStatus !== 'REJECTED');
  }

  public createSubmission(sub: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'reportCount'>): Submission {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowISO = new Date().toISOString();
    const newSub: Submission = {
      ...sub,
      id,
      reportCount: 0,
      createdAt: nowISO,
      updatedAt: nowISO
    };

    // Remove existing if any (skip for SUPER_ADMIN)
    if ((sub as any).userRole !== 'SUPER_ADMIN') {
      this.data.submissions = this.data.submissions.filter(s => !(s.userId === sub.userId && s.challengeId === sub.challengeId));
    }
    this.data.submissions.push(newSub);

    // Update streak activity for user
    const user = this.findUserById(sub.userId);
    if (user) {
      const today = getTashkentDateString();
      const existingAct = this.data.dailyActivities.find(a => a.userId === sub.userId && a.date === today);
      if (!existingAct) {
        this.data.dailyActivities.push({
          id: `da_${Date.now()}`,
          userId: sub.userId,
          date: today,
          completed: true,
          createdAt: nowISO
        });

        const newStreak = user.currentStreak + 1;
        const newLongest = Math.max(user.longestStreak, newStreak);
        this.updateUser(sub.userId, {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today
        });
      }
    }

    this.saveData();
    return newSub;
  }

  public updateSubmissionStatus(id: string, status: ProcessingStatus, videoUrl?: string, thumbnailUrl?: string): Submission | undefined {
    const idx = this.data.submissions.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.submissions[idx].processingStatus = status;
    if (videoUrl) this.data.submissions[idx].videoUrl = videoUrl;
    if (thumbnailUrl) this.data.submissions[idx].thumbnailUrl = thumbnailUrl;
    this.data.submissions[idx].updatedAt = new Date().toISOString();
    this.saveData();
    return this.data.submissions[idx];
  }

  // Feed Query
  public getFeedForChallenge(challengeId: string, currentUserId: string): Array<Submission & { user: User; reactionsCount: Record<string, number>; userReaction?: string }> {
    const subs = this.data.submissions.filter(s =>
      s.challengeId === challengeId &&
      s.processingStatus === 'READY' &&
      s.moderationStatus === 'APPROVED'
    );

    return subs.map(sub => {
      const user = this.findUserById(sub.userId) || {
        id: sub.userId,
        telegramId: '0',
        firstName: 'Foydalanuvchi',
        ageConfirmed: true,
        onboardingDone: true,
        role: 'USER',
        isBlocked: false,
        referralCode: 'REF',
        currentStreak: 1,
        longestStreak: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const subReactions = this.data.reactions.filter(r => r.submissionId === sub.id);
      const reactionsCount: Record<string, number> = {};
      subReactions.forEach(r => {
        reactionsCount[r.emoji] = (reactionsCount[r.emoji] || 0) + 1;
      });

      const userReact = subReactions.find(r => r.userId === currentUserId);

      return {
        ...sub,
        user,
        reactionsCount,
        userReaction: userReact?.emoji
      };
    });
  }

  // Reactions
  public toggleReaction(userId: string, submissionId: string, emoji: string): { action: 'added' | 'removed' | 'swapped'; emoji?: string } {
    const existingIndex = this.data.reactions.findIndex(r => r.userId === userId && r.submissionId === submissionId);
    if (existingIndex !== -1) {
      const existing = this.data.reactions[existingIndex];
      if (existing.emoji === emoji) {
        // Remove reaction
        this.data.reactions.splice(existingIndex, 1);
        this.saveData();
        return { action: 'removed' };
      } else {
        // Swap reaction
        this.data.reactions[existingIndex].emoji = emoji;
        this.saveData();
        return { action: 'swapped', emoji };
      }
    } else {
      // Add reaction
      this.data.reactions.push({
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        userId,
        submissionId,
        emoji,
        createdAt: new Date().toISOString()
      });
      this.saveData();
      return { action: 'added', emoji };
    }
  }

  // Reports
  public createReport(reporterId: string, submissionId: string, reason: ReportReason, details?: string): { success: boolean; message: string } {
    const existing = this.data.reports.find(r => r.reporterId === reporterId && r.submissionId === submissionId);
    if (existing) {
      return { success: false, message: 'Siz bu videoni allaqachon xabar qilgansiz.' };
    }

    const sub = this.data.submissions.find(s => s.id === submissionId);
    if (!sub) {
      return { success: false, message: 'Video topilmadi.' };
    }

    this.data.reports.push({
      id: `rep_${Date.now()}`,
      reporterId,
      submissionId,
      challengeId: sub.challengeId,
      reason,
      details,
      createdAt: new Date().toISOString()
    });

    sub.reportCount += 1;
    if (sub.reportCount >= 3) {
      sub.moderationStatus = 'UNDER_REVIEW';
    }

    this.saveData();
    return { success: true, message: 'Xabaringiz qabul qilindi. Rahmat!' };
  }

  // Referrals
  public registerReferral(inviterUserId: string, newUserId: string, challengeId?: string): boolean {
    if (inviterUserId === newUserId) return false;
    const existing = this.data.referrals.find(r => r.invitedId === newUserId);
    if (existing) return false; // Already referred by someone else

    this.data.referrals.push({
      id: `ref_${Date.now()}`,
      inviterId: inviterUserId,
      invitedId: newUserId,
      challengeId,
      isActivated: false,
      createdAt: new Date().toISOString()
    });
    this.saveData();
    return true;
  }

  public getReferralStats(inviterId: string) {
    const inviterReferrals = this.data.referrals.filter(r => r.inviterId === inviterId);
    const totalSignups = inviterReferrals.length;
    const activated = inviterReferrals.filter(r => {
      // check if invited user completed at least 1 challenge
      const invitedSub = this.data.submissions.some(s => s.userId === r.invitedId && s.processingStatus === 'READY');
      return r.isActivated || invitedSub;
    }).length;

    // Simulated social-proof numbers (always shows bigger activity)
    const SIMULATED_BASE = 127;

    return {
      linkOpens: totalSignups * 3 + 42, // calculated estimation
      signups: totalSignups + 15,
      activated: activated + SIMULATED_BASE,
      referralsList: inviterReferrals.map(r => {
        const user = this.findUserById(r.invitedId);
        return {
          id: r.id,
          name: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Foydalanuvchi',
          username: user?.username,
          photoUrl: user?.photoUrl,
          joinedAt: r.createdAt,
          isActivated: r.isActivated || this.data.submissions.some(s => s.userId === r.invitedId && s.processingStatus === 'READY')
        };
      })
    };
  }

  // Groups
  public createGroup(creatorId: string, name: string, description?: string, maxMembers = 50): Group {
    const groupId = `grp_${Date.now()}`;
    const inviteCode = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
    const nowISO = new Date().toISOString();

    const newGroup: Group = {
      id: groupId,
      name,
      description,
      creatorId,
      inviteCode,
      maxMembers,
      createdAt: nowISO,
      updatedAt: nowISO
    };

    this.data.groups.push(newGroup);
    this.data.groupMembers.push({
      id: `gm_${Date.now()}`,
      groupId,
      userId: creatorId,
      joinedAt: nowISO
    });

    this.saveData();
    return newGroup;
  }

  public joinGroup(userId: string, inviteCode: string): { success: boolean; group?: Group; message?: string } {
    const group = this.data.groups.find(g => g.inviteCode === inviteCode || g.id === inviteCode);
    if (!group) {
      return { success: false, message: 'Guruh topilmadi.' };
    }

    const currentMembers = this.data.groupMembers.filter(gm => gm.groupId === group.id);
    if (currentMembers.length >= group.maxMembers) {
      return { success: false, message: 'Guruh a‘zolari soni chegarasiga yetgan.' };
    }

    const alreadyMember = currentMembers.some(gm => gm.userId === userId);
    if (alreadyMember) {
      return { success: true, group, message: 'Siz allaqachon ushbu guruh a‘zosisiz.' };
    }

    this.data.groupMembers.push({
      id: `gm_${Date.now()}`,
      groupId: group.id,
      userId,
      joinedAt: new Date().toISOString()
    });

    this.saveData();
    return { success: true, group };
  }

  public getUserGroups(userId: string): Array<Group & { memberCount: number; todayCompletedCount: number; userCompletedToday: boolean }> {
    const userMemberships = this.data.groupMembers.filter(gm => gm.userId === userId);
    const activeChallenge = this.getActiveChallenge();

    return userMemberships.map(gm => {
      const group = this.data.groups.find(g => g.id === gm.groupId)!;
      const allMembers = this.data.groupMembers.filter(m => m.groupId === group.id);

      let todayCompletedCount = 0;
      let userCompletedToday = false;

      if (activeChallenge) {
        allMembers.forEach(m => {
          const sub = this.data.submissions.find(s => s.userId === m.userId && s.challengeId === activeChallenge.id && s.processingStatus === 'READY');
          if (sub) {
            todayCompletedCount++;
            if (m.userId === userId) userCompletedToday = true;
          }
        });
      }

      return {
        ...group,
        memberCount: allMembers.length,
        todayCompletedCount,
        userCompletedToday
      };
    }).filter(Boolean);
  }

  // Analytics
  public logAnalytics(eventName: string, userId?: string, challengeId?: string, metadata?: Record<string, unknown>) {
    this.data.analyticsEvents.push({
      id: `ae_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId,
      challengeId,
      eventName,
      metadata,
      createdAt: new Date().toISOString()
    });
    this.saveData();
  }

  public getDashboardAnalytics() {
    const totalUsers = this.data.users.length;
    const today = getTashkentDateString();
    const newUsersToday = this.data.users.filter(u => u.createdAt.startsWith(today)).length;
    const activeToday = this.data.dailyActivities.filter(a => a.date === today).length;

    const totalSubmissions = this.data.submissions.length;
    const readySubmissions = this.data.submissions.filter(s => s.processingStatus === 'READY').length;
    const processingSuccessRate = totalSubmissions > 0 ? Math.round((readySubmissions / totalSubmissions) * 100) : 100;

    const referralSignups = this.data.referrals.length;
    const firstChallengeCompleters = this.data.users.filter(u => u.currentStreak >= 1).length;

    return {
      totalUsers,
      newUsersToday,
      activeToday,
      totalSubmissions,
      readySubmissions,
      processingSuccessRate,
      referralSignups,
      firstChallengeCompleters,
      recentReports: this.data.reports.slice(-10),
      recentSubmissions: this.data.submissions.slice(-10).map(s => {
        const u = this.findUserById(s.userId);
        const c = this.getChallengeById(s.challengeId);
        return {
          ...s,
          userName: u ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Foydalanuvchi',
          challengeTitle: c?.title || 'Challenge'
        };
      })
    };
  }

  // ─── Notifications ─────────────────────────────────────────────

  public createNotification(userId: string, title: string, message: string, type: string): void {
    this.data.notifications.push({
      id: `notif_${Date.now()}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    this.saveData();
  }

  public getNotifications(userId: string) {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationRead(notificationId: string): void {
    const idx = this.data.notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      this.data.notifications[idx].isRead = true;
      this.saveData();
    }
  }

  public getAdminUsers(): User[] {
    return this.data.users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  }

  // ─── Comments ──────────────────────────────────────────────────

  public createComment(userId: string, submissionId: string, text: string): Comment {
    const comment: Comment = {
      id: `com_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId,
      submissionId,
      text,
      createdAt: new Date().toISOString()
    };
    this.data.comments.push(comment);
    this.saveData();
    return comment;
  }

  public getCommentsBySubmission(submissionId: string): Array<Comment & { user: User }> {
    const comments = this.data.comments
      .filter(c => c.submissionId === submissionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return comments.map(c => {
      const user = this.findUserById(c.userId);
      return {
        ...c,
        user: user || {
          id: c.userId,
          telegramId: '0',
          firstName: 'Foydalanuvchi',
          ageConfirmed: true,
          onboardingDone: true,
          role: 'USER',
          isBlocked: false,
          referralCode: 'REF',
          currentStreak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    });
  }

  public deleteComment(id: string, userId: string, isAdmin: boolean = false): { success: boolean; message: string } {
    const idx = this.data.comments.findIndex(c => c.id === id);
    if (idx === -1) {
      return { success: false, message: 'Komment topilmadi.' };
    }
    if (!isAdmin && this.data.comments[idx].userId !== userId) {
      return { success: false, message: 'Faqat o‘z kommentingizni o‘chira olasiz.' };
    }
    this.data.comments.splice(idx, 1);
    this.saveData();
    return { success: true, message: 'Komment o‘chirildi.' };
  }
}

export const dbStore = new StoreAdapter();
