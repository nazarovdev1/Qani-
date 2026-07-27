export type Role = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type ProcessingStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'REJECTED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'UNDER_REVIEW';

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  region?: string;
  ageConfirmed: boolean;
  onboardingDone: boolean;
  role: Role;
  isBlocked: boolean;
  referralCode: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  instruction: string;
  example?: string;
  startTime: string;
  endTime: string;
  minDurationSec: number;
  maxDurationSec: number;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  language: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
}

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  groupId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  processingStatus: ProcessingStatus;
  moderationStatus: ModerationStatus;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedItem extends Submission {
  user: User;
  reactionsCount: Record<string, number>;
  userReaction?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  todayCompletedCount: number;
  userCompletedToday: boolean;
  createdAt: string;
}

export interface ReferralStats {
  linkOpens: number;
  signups: number;
  activated: number;
  referralsList: Array<{
    id: string;
    name: string;
    username?: string;
    photoUrl?: string;
    joinedAt: string;
    isActivated: boolean;
  }>;
}

export interface AdminAnalytics {
  totalUsers: number;
  newUsersToday: number;
  activeToday: number;
  totalSubmissions: number;
  readySubmissions: number;
  processingSuccessRate: number;
  referralSignups: number;
  firstChallengeCompleters: number;
  recentSubmissions: Array<Submission & { userName: string; challengeTitle: string }>;
}

export interface Comment {
  id: string;
  userId: string;
  submissionId: string;
  text: string;
  createdAt: string;
}

export interface CommentWithUser extends Comment {
  user: User;
}
