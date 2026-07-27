// Database Types for QANI? Server Engine

export type Role = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type ChallengeStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
export type ProcessingStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'REJECTED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'UNDER_REVIEW';
export type ReportReason = 'OFFENSIVE_CONTENT' | 'INAPPROPRIATE_CONTENT' | 'DANGEROUS_ACTION' | 'SPAM_OR_AD' | 'PRIVACY_VIOLATION' | 'OTHER';

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

export interface UserSettings {
  id: string;
  userId: string;
  language: 'uz' | 'ru' | 'en';
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  autoplayVideos: boolean;
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
  status: ChallengeStatus;
  language: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  moderationLevel: string;
  createdAt: string;
  updatedAt: string;
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

export interface MediaAsset {
  id: string;
  submissionId: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  isOriginal: boolean;
  createdAt: string;
}

export interface Reaction {
  id: string;
  userId: string;
  submissionId: string;
  emoji: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  inviterId: string;
  invitedId: string;
  challengeId?: string;
  isActivated: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  inviteCode: string;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  submissionId: string;
  challengeId?: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
}

export interface ModerationAction {
  id: string;
  adminId: string;
  targetType: string;
  targetId: string;
  action: string;
  reason?: string;
  createdAt: string;
}

export interface DailyActivity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  challengeId?: string;
  eventName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}
