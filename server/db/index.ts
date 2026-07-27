/**
 * Unified Database Layer
 *
 * Automatically uses PostgreSQL (Prisma) if connected,
 * otherwise falls back to JSON file store (dbStore).
 *
 * Set USE_POSTGRES=true in env to force Prisma mode.
 */

import { dbStore } from './store';
import { prismaStore } from './prismaStore';
import { testConnection } from './prisma';

// Global flag: is PostgreSQL available?
let postgresAvailable = false;

export async function initDatabase(): Promise<boolean> {
  if (process.env.USE_POSTGRES === 'false') {
    console.log('📦 Using JSON file store (USE_POSTGRES=false)');
    postgresAvailable = false;
    return false;
  }

  const connected = await testConnection();
  if (connected) {
    console.log('🐘 Using PostgreSQL via Prisma');
    postgresAvailable = true;
    return true;
  }

  console.warn('⚠️  PostgreSQL unavailable — falling back to JSON file store');
  postgresAvailable = false;
  return false;
}

export function isPostgresEnabled(): boolean {
  return postgresAvailable;
}

/**
 * Unified DB interface that delegates to Prisma or JSON store.
 * All methods are async and return the same types.
 */
export const db = {

  // ─── Users ────────────────────────────────────────────────────

  async findUserByTelegramId(telegramId: string) {
    if (postgresAvailable) {
      return prismaStore.findUserByTelegramId(telegramId);
    }
    return dbStore.findUserByTelegramId(telegramId);
  },

  async findUserById(id: string) {
    if (postgresAvailable) {
      return prismaStore.findUserById(id);
    }
    return dbStore.findUserById(id);
  },

  async getAllUsers() {
    if (postgresAvailable) {
      return prismaStore.getAllUsers();
    }
    return dbStore.getAllUsers();
  },

  async createUser(data: any) {
    if (postgresAvailable) {
      return prismaStore.createUser(data);
    }
    return dbStore.createUser(data);
  },

  async updateUser(id: string, updates: any) {
    if (postgresAvailable) {
      return prismaStore.updateUser(id, updates);
    }
    return dbStore.updateUser(id, updates);
  },

  // ─── Challenges ───────────────────────────────────────────────

  async getActiveChallenge() {
    if (postgresAvailable) {
      return prismaStore.getActiveChallenge();
    }
    return dbStore.getActiveChallenge();
  },

  async getChallengeById(id: string) {
    if (postgresAvailable) {
      return prismaStore.getChallengeById(id);
    }
    return dbStore.getChallengeById(id);
  },

  async getAllChallenges() {
    if (postgresAvailable) {
      return prismaStore.getAllChallenges();
    }
    return dbStore.getAllChallenges();
  },

  // ─── Challenge Schedule ──────────────────────────────────────────

  async getChallengeSchedule() {
    if (postgresAvailable) {
      return prismaStore.getChallengeSchedule();
    }
    return dbStore.getChallengeSchedule();
  },

  async setChallengeSchedule(data: any) {
    if (postgresAvailable) {
      return prismaStore.setChallengeSchedule(data);
    }
    return dbStore.setChallengeSchedule(data);
  },

  async getNextChallengeTime() {
    if (postgresAvailable) {
      return prismaStore.getNextChallengeTime();
    }
    return dbStore.getNextChallengeTime();
  },

  async createChallenge(data: any) {
    if (postgresAvailable) {
      return prismaStore.createChallenge(data);
    }
    return dbStore.createChallenge(data);
  },

  async updateChallenge(id: string, updates: any) {
    if (postgresAvailable) {
      return prismaStore.updateChallenge(id, updates);
    }
    return dbStore.updateChallenge(id, updates);
  },

  // ─── Submissions ──────────────────────────────────────────────

  async getUserSubmissionForChallenge(userId: string, challengeId: string) {
    if (postgresAvailable) {
      return prismaStore.getUserSubmissionForChallenge(userId, challengeId);
    }
    return dbStore.getUserSubmissionForChallenge(userId, challengeId);
  },

  async createSubmission(data: any) {
    if (postgresAvailable) {
      return prismaStore.createSubmission(data);
    }
    return dbStore.createSubmission(data);
  },

  async updateSubmissionStatus(id: string, status: any, videoUrl?: string, thumbnailUrl?: string) {
    if (postgresAvailable) {
      return prismaStore.updateSubmissionStatus(id, status, videoUrl, thumbnailUrl);
    }
    return dbStore.updateSubmissionStatus(id, status, videoUrl, thumbnailUrl);
  },

  // ─── Feed ─────────────────────────────────────────────────────

  async getFeedForChallenge(challengeId: string, currentUserId: string) {
    if (postgresAvailable) {
      return prismaStore.getFeedForChallenge(challengeId, currentUserId);
    }
    return dbStore.getFeedForChallenge(challengeId, currentUserId);
  },

  // ─── Reactions ────────────────────────────────────────────────

  async toggleReaction(userId: string, submissionId: string, emoji: string) {
    if (postgresAvailable) {
      return prismaStore.toggleReaction(userId, submissionId, emoji);
    }
    return dbStore.toggleReaction(userId, submissionId, emoji);
  },

  // ─── Reports ──────────────────────────────────────────────────

  async createReport(reporterId: string, submissionId: string, reason: any, details?: string) {
    if (postgresAvailable) {
      return prismaStore.createReport(reporterId, submissionId, reason, details);
    }
    return dbStore.createReport(reporterId, submissionId, reason, details);
  },

  // ─── Referrals ────────────────────────────────────────────────

  async registerReferral(inviterId: string, invitedId: string, challengeId?: string) {
    if (postgresAvailable) {
      return prismaStore.registerReferral(inviterId, invitedId, challengeId);
    }
    return dbStore.registerReferral(inviterId, invitedId, challengeId);
  },

  async getReferralStats(inviterId: string) {
    if (postgresAvailable) {
      return prismaStore.getReferralStats(inviterId);
    }
    return dbStore.getReferralStats(inviterId);
  },

  // ─── Groups ───────────────────────────────────────────────────

  async createGroup(creatorId: string, name: string, description?: string, maxMembers?: number) {
    if (postgresAvailable) {
      return prismaStore.createGroup(creatorId, name, description, maxMembers);
    }
    return dbStore.createGroup(creatorId, name, description, maxMembers);
  },

  async joinGroup(userId: string, inviteCode: string) {
    if (postgresAvailable) {
      return prismaStore.joinGroup(userId, inviteCode);
    }
    return dbStore.joinGroup(userId, inviteCode);
  },

  async getUserGroups(userId: string) {
    if (postgresAvailable) {
      return prismaStore.getUserGroups(userId);
    }
    return dbStore.getUserGroups(userId);
  },

  // ─── Analytics ────────────────────────────────────────────────

  async logAnalytics(eventName: string, userId?: string, challengeId?: string, metadata?: any) {
    if (postgresAvailable) {
      return prismaStore.logAnalytics(eventName, userId, challengeId, metadata);
    }
    return dbStore.logAnalytics(eventName, userId, challengeId, metadata);
  },

  async getDashboardAnalytics() {
    if (postgresAvailable) {
      return prismaStore.getDashboardAnalytics();
    }
    return dbStore.getDashboardAnalytics();
  },

  // ─── Admin helpers ────────────────────────────────────────────

  async getFlaggedSubmissions() {
    if (postgresAvailable) {
      return prismaStore.getFlaggedSubmissions();
    }
    // Fallback: manual filter from JSON store with user info
    const data = dbStore.getData();
    return data.submissions
      .filter(
        (s: any) =>
          (s.reportCount > 0 || s.moderationStatus === 'UNDER_REVIEW') &&
          s.moderationStatus !== 'APPROVED' &&
          s.moderationStatus !== 'REMOVED' &&
          s.moderationStatus !== 'REJECTED'
      )
      .map((s: any) => {
        const user = dbStore.findUserById(s.userId);
        const reports = data.reports
          .filter((r: any) => r.submissionId === s.id)
          .map((r: any) => {
            const reporter = dbStore.findUserById(r.reporterId);
            return {
              id: r.id,
              reporterId: r.reporterId,
              reason: r.reason,
              details: r.details,
              createdAt: r.createdAt,
              reporter: reporter ? { firstName: reporter.firstName } : undefined,
            };
          });
        return {
          ...s,
          userName: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Foydalanuvchi',
          reports,
        };
      });
  },

  async updateSubmissionModeration(submissionId: string, status: any) {
    if (postgresAvailable) {
      return prismaStore.updateSubmissionModeration(submissionId, status);
    }
    const sub = dbStore.getData().submissions.find((s) => s.id === submissionId);
    if (sub) {
      sub.moderationStatus = status;
      sub.reportCount = 0;
      sub.updatedAt = new Date().toISOString();
      dbStore.saveData();
    }
  },

  // ─── Notifications ───────────────────────────────────────────

  async createNotification(userId: string, title: string, message: string, type: string) {
    if (postgresAvailable) {
      return prismaStore.createNotification(userId, title, message, type);
    }
    return dbStore.createNotification(userId, title, message, type);
  },

  async getNotifications(userId: string) {
    if (postgresAvailable) {
      return prismaStore.getNotifications(userId);
    }
    return dbStore.getNotifications(userId);
  },

  async markNotificationRead(notificationId: string) {
    if (postgresAvailable) {
      return prismaStore.markNotificationRead(notificationId);
    }
    return dbStore.markNotificationRead(notificationId);
  },

  async getAdminUsers() {
    if (postgresAvailable) {
      return prismaStore.getAdminUsers();
    }
    return dbStore.getAdminUsers();
  },

  // ─── Comments ─────────────────────────────────────────────────

  async createComment(userId: string, submissionId: string, text: string) {
    if (postgresAvailable) {
      return prismaStore.createComment(userId, submissionId, text);
    }
    return dbStore.createComment(userId, submissionId, text);
  },

  async getCommentsBySubmission(submissionId: string) {
    if (postgresAvailable) {
      return prismaStore.getCommentsBySubmission(submissionId);
    }
    return dbStore.getCommentsBySubmission(submissionId);
  },

  async deleteComment(id: string, userId: string, isAdmin: boolean = false) {
    if (postgresAvailable) {
      return prismaStore.deleteComment(id, userId, isAdmin);
    }
    return dbStore.deleteComment(id, userId, isAdmin);
  },

  // ─── Legacy compatibility ─────────────────────────────────────

  getData() {
    if (postgresAvailable) {
      return prismaStore.getData();
    }
    return dbStore.getData();
  },
};
