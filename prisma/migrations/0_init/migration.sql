-- Initial Database Schema Migration for QANI?
-- Target: PostgreSQL 14+

CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');
CREATE TYPE "ProcessingStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'REJECTED');
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED', 'UNDER_REVIEW');
CREATE TYPE "ReportReason" AS ENUM ('OFFENSIVE_CONTENT', 'INAPPROPRIATE_CONTENT', 'DANGEROUS_ACTION', 'SPAM_OR_AD', 'PRIVACY_VIOLATION', 'OTHER');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "region" TEXT,
    "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'uz',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoplayVideos" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "example" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "minDurationSec" INTEGER NOT NULL DEFAULT 3,
    "maxDurationSec" INTEGER NOT NULL DEFAULT 15,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "language" TEXT NOT NULL DEFAULT 'uz',
    "sponsorName" TEXT,
    "sponsorLogoUrl" TEXT,
    "moderationLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "groupId" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "durationSec" DOUBLE PRECISION,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'UPLOADING',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Submission_userId_challengeId_key" ON "Submission"("userId", "challengeId");
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Reaction_userId_submissionId_key" ON "Reaction"("userId", "submissionId");
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "challengeId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Report_reporterId_submissionId_key" ON "Report"("reporterId", "submissionId");
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
