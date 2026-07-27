import { Router, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../db';
import { telegramAuthMiddleware, requireAdmin, AuthenticatedRequest } from '../middleware/telegramAuth';
import { storageService } from '../storage/storageService';
import { videoWorker } from '../queue/videoWorker';
import { ReportReason } from '../db/types';

export const apiRouter = Router();

// Multer in-memory upload storage
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max video limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('application/octet-stream')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat video fayllar ruxsat etilgan.'));
    }
  }
});

// Zod Schemas
const onboardingSchema = z.object({
  ageConfirmed: z.boolean().refine(val => val === true, { message: 'Yoshingiz 18 dan katta ekanligini tasdiqlashingiz shart.' }),
  region: z.string().optional()
});

const submissionSchema = z.object({
  challengeId: z.string().min(1),
  videoUrl: z.string().min(1),
  durationSec: z.number().min(3).max(30).optional(),
  groupId: z.string().optional()
});

const reactionSchema = z.object({
  submissionId: z.string().min(1),
  emoji: z.enum(['😂', '🔥', '👏', '❤️'])
});

const reportSchema = z.object({
  submissionId: z.string().min(1),
  reason: z.enum(['OFFENSIVE_CONTENT', 'INAPPROPRIATE_CONTENT', 'DANGEROUS_ACTION', 'SPAM_OR_AD', 'PRIVACY_VIOLATION', 'OTHER']),
  details: z.string().max(300).optional()
});

const createGroupSchema = z.object({
  name: z.string().min(3).max(40),
  description: z.string().max(200).optional()
});

const challengeCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  instruction: z.string().min(5),
  example: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  minDurationSec: z.number().default(3),
  maxDurationSec: z.number().default(15),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED']).default('ACTIVE'),
  language: z.string().default('uz'),
  sponsorName: z.string().optional()
});

// Helper for standardized error response
function sendError(res: Response, statusCode: number, code: string, message: string) {
  res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
}

// All endpoints require Telegram Auth (or Dev Mock Auth)
apiRouter.use(telegramAuthMiddleware);

// ─── 1. Auth & Onboarding ─────────────────────────────────────

apiRouter.get('/auth/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const activeChallenge = await db.getActiveChallenge();
    const hasSubmittedToday = activeChallenge
      ? !!(await db.getUserSubmissionForChallenge(user.id, activeChallenge.id))
      : false;

    res.json({
      success: true,
      data: {
        user,
        hasSubmittedToday,
        activeChallengeId: activeChallenge?.id
      }
    });
  } catch (err) {
    console.error('/auth/me error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Ma\'lumotlarni olishda xatolik.');
  }
});

apiRouter.post('/auth/onboarding', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = onboardingSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Noto‘g‘ri ma‘lumot.');
    }

    const user = req.user!;
    const updatedUser = await db.updateUser(user.id, {
      ageConfirmed: true,
      region: parseResult.data.region || 'Toshkent shahri',
      onboardingDone: true
    });

    if (!updatedUser) {
      return sendError(res, 404, 'NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    await db.logAnalytics('ONBOARDING_COMPLETED', user.id);

    res.json({
      success: true,
      data: { user: updatedUser }
    });
  } catch (err) {
    console.error('/auth/onboarding error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Saqlashda xatolik.');
  }
});

// ─── 2. Challenges ────────────────────────────────────────────

apiRouter.get('/challenges/active', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeChallenge = await db.getActiveChallenge();
    if (!activeChallenge) {
      return sendError(res, 444, 'NO_ACTIVE_CHALLENGE', 'Bugun aktiv topshiriq mavjud emas.');
    }

    const userSubmission = await db.getUserSubmissionForChallenge(req.user!.id, activeChallenge.id);

    res.json({
      success: true,
      data: {
        challenge: activeChallenge,
        userSubmission,
        hasSubmitted: !!userSubmission && userSubmission.processingStatus === 'READY'
      }
    });
  } catch (err) {
    console.error('/challenges/active error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Topshiriqni olishda xatolik.');
  }
});

apiRouter.get('/challenges', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const challenges = await db.getAllChallenges();
    res.json({
      success: true,
      data: { challenges }
    });
  } catch (err) {
    console.error('/challenges error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Topshiriqlar ro\'yxatini olishda xatolik.');
  }
});

apiRouter.post('/challenges', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = challengeCreateSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 400, 'INVALID_INPUT', result.error.issues[0]?.message || 'Noto‘g‘ri ma‘lumot.');
    }

    const newChallenge = await db.createChallenge({
      ...result.data,
      moderationLevel: 'STANDARD'
    });

    res.json({
      success: true,
      data: { challenge: newChallenge }
    });
  } catch (err) {
    console.error('POST /challenges error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Topshiriq yaratishda xatolik.');
  }
});

apiRouter.put('/challenges/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await db.updateChallenge(req.params.id, req.body);
    if (!updated) {
      return sendError(res, 404, 'NOT_FOUND', 'Challenge topilmadi.');
    }

    res.json({
      success: true,
      data: { challenge: updated }
    });
  } catch (err) {
    console.error('PUT /challenges/:id error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Yangilashda xatolik.');
  }
});

// ─── 3. Upload & Submissions ──────────────────────────────────

apiRouter.post('/submissions/upload-url', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filename = req.body.filename || 'video.mp4';
    const mimeType = req.body.mimeType || 'video/mp4';

    const presigned = await storageService.getPresignedUploadUrl(filename, mimeType);
    res.json({
      success: true,
      data: presigned
    });
  } catch (err) {
    console.error('/submissions/upload-url error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'URL yaratishda xatolik.');
  }
});

apiRouter.post('/submissions/upload-direct', upload.single('video'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'NO_FILE', 'Video fayli tanlanmadi.');
    }

    const saved = await storageService.saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({
      success: true,
      data: saved
    });
  } catch (err) {
    console.error('/submissions/upload-direct error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Fayl yuklashda xatolik.');
  }
});

apiRouter.post('/submissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = submissionSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 400, 'INVALID_INPUT', result.error.issues[0]?.message || 'Noto‘g‘ri ma‘lumot.');
    }

    const user = req.user!;
    const { challengeId, videoUrl, durationSec, groupId } = result.data;

    // Check existing submission for today
    const existing = await db.getUserSubmissionForChallenge(user.id, challengeId);
    if (existing && existing.processingStatus === 'READY') {
      return sendError(res, 400, 'CHALLENGE_ALREADY_COMPLETED', 'Bugungi topshiriqni allaqachon bajargansiz.');
    }

    const submission = await db.createSubmission({
      userId: user.id,
      challengeId,
      groupId,
      videoUrl,
      durationSec: durationSec || 10,
      processingStatus: 'UPLOADING',
      moderationStatus: 'APPROVED'
    });

    // Enqueue background processing job
    videoWorker.enqueue({
      submissionId: submission.id,
      videoUrl,
      durationSec: durationSec || 10
    });

    await db.logAnalytics('RECORDING_COMPLETED', user.id, challengeId);

    res.json({
      success: true,
      data: { submission }
    });
  } catch (err) {
    console.error('POST /submissions error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Video yuborishda xatolik.');
  }
});

apiRouter.get('/submissions/status/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get submission status — in Prisma mode we query directly
    // For now, fallback to data store
    const data = db.getData();
    const sub = data.submissions.find(s => s.id === req.params.id);
    if (!sub) {
      return sendError(res, 404, 'NOT_FOUND', 'Submission topilmadi.');
    }

    res.json({
      success: true,
      data: { submission: sub }
    });
  } catch (err) {
    console.error('/submissions/status/:id error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Statusni olishda xatolik.');
  }
});

// ─── 4. Friends Feed ──────────────────────────────────────────

apiRouter.get('/feed/today', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const activeChallenge = await db.getActiveChallenge();

    if (!activeChallenge) {
      return res.json({
        success: true,
        data: { isLocked: false, feed: [], message: 'Hozircha faol topshiriq yo‘q.' }
      });
    }

    const userSub = await db.getUserSubmissionForChallenge(user.id, activeChallenge.id);

    // Check feed locking rule: User must submit video before unlocked!
    const isLocked = !userSub || userSub.processingStatus !== 'READY';

    const feed = await db.getFeedForChallenge(activeChallenge.id, user.id);

    await db.logAnalytics('FEED_VIEWED', user.id, activeChallenge.id);

    res.json({
      success: true,
      data: {
        isLocked,
        challenge: activeChallenge,
        feed: isLocked ? feed.map(item => ({ ...item, videoUrl: undefined })) : feed
      }
    });
  } catch (err) {
    console.error('/feed/today error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Feedni olishda xatolik.');
  }
});

// ─── 5. Reactions & Reports ───────────────────────────────────

apiRouter.post('/reactions/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = reactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 400, 'INVALID_INPUT', parseResult.error.issues[0]?.message || 'Noto‘g‘ri ma‘lumot.');
    }

    const user = req.user!;
    const { submissionId, emoji } = parseResult.data;

    const result = await db.toggleReaction(user.id, submissionId, emoji);
    await db.logAnalytics('REACTION_ADDED', user.id, undefined, { submissionId, emoji });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('/reactions/toggle error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Reaksiya qo‘shishda xatolik.');
  }
});

apiRouter.post('/reports', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = reportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 400, 'INVALID_INPUT', parseResult.error.issues[0]?.message || 'Noto‘g‘ri ma‘lumot.');
    }

    const user = req.user!;
    const { submissionId, reason, details } = parseResult.data;

    const result = await db.createReport(user.id, submissionId, reason as ReportReason, details);
    if (!result.success) {
      return sendError(res, 400, 'REPORT_FAILED', result.message);
    }

    // Notify admins about the new report
    try {
      const admins = await db.getAdminUsers();
      for (const admin of admins) {
        await db.createNotification(
          admin.id,
          'Yangi Report!',
          `Foydalanuvchi video xabar qildi. Sabab: ${reason}. ${details ? 'Izoh: ' + details : ''}`,
          'REPORT'
        );
      }
    } catch (notifyErr) {
      console.error('Admin notification error:', notifyErr);
    }

    await db.logAnalytics('REPORT_CREATED', user.id, undefined, { submissionId, reason });

    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('/reports error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Xabar qilishda xatolik.');
  }
});

// ─── 6. Profile & Settings ──────────────────────────────────

apiRouter.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const referralStats = await db.getReferralStats(user.id);

    // Count completed challenges
    const data = db.getData();
    const userSubmissions = data.submissions.filter(
      s => s.userId === user.id && s.processingStatus === 'READY'
    );

    res.json({
      success: true,
      data: {
        user,
        challengesCompleted: userSubmissions.length,
        activeReferralsCount: referralStats.activated,
        referralStats
      }
    });
  } catch (err) {
    console.error('/profile error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Profilni olishda xatolik.');
  }
});

apiRouter.put('/profile/region', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const region = req.body.region;
    if (!region) {
      return sendError(res, 400, 'INVALID_REGION', 'Viloyat tanlanmadi.');
    }

    const updated = await db.updateUser(req.user!.id, { region });
    if (!updated) {
      return sendError(res, 404, 'NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    res.json({
      success: true,
      data: { user: updated }
    });
  } catch (err) {
    console.error('/profile/region error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Yangilashda xatolik.');
  }
});

apiRouter.post('/profile/delete-account', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    await db.updateUser(user.id, {
      isBlocked: true,
      firstName: 'O‘chirilgan Foydalanuvchi'
    });

    res.json({
      success: true,
      message: 'Hisobingiz muvaffaqiyatli o‘chirildi va ma‘lumotlaringiz anonimlashtirildi.'
    });
  } catch (err) {
    console.error('/profile/delete-account error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Hisobni o‘chirishda xatolik.');
  }
});

// ─── 7. Referrals ─────────────────────────────────────────────

apiRouter.get('/referrals/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const stats = await db.getReferralStats(user.id);

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `https://t.me/qaniisbotlabot/app?startapp=ref_${user.id}`,
        stats
      }
    });
  } catch (err) {
    console.error('/referrals/stats error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Statistikani olishda xatolik.');
  }
});

// ─── 8. Private Groups ────────────────────────────────────────

apiRouter.post('/groups', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createGroupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 400, 'INVALID_INPUT', parseResult.error.issues[0]?.message || 'Noto‘g‘ri ma‘lumot.');
    }

    const group = await db.createGroup(req.user!.id, parseResult.data.name, parseResult.data.description);
    await db.logAnalytics('GROUP_CREATED', req.user!.id, undefined, { groupId: group.id });

    res.json({
      success: true,
      data: { group }
    });
  } catch (err) {
    console.error('/groups error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Guruh yaratishda xatolik.');
  }
});

apiRouter.post('/groups/join', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inviteCode = req.body.inviteCode;
    if (!inviteCode) {
      return sendError(res, 400, 'MISSING_CODE', 'Taklif kodi kiritilmadi.');
    }

    const result = await db.joinGroup(req.user!.id, inviteCode);
    if (!result.success) {
      return sendError(res, 400, 'JOIN_FAILED', result.message || 'Guruhga qo‘shilishda xatolik.');
    }

    await db.logAnalytics('GROUP_JOINED', req.user!.id, undefined, { groupId: result.group?.id });

    res.json({
      success: true,
      data: { group: result.group, message: result.message }
    });
  } catch (err) {
    console.error('/groups/join error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Guruhga qo‘shilishda xatolik.');
  }
});

apiRouter.get('/groups/my', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const groups = await db.getUserGroups(req.user!.id);
    res.json({
      success: true,
      data: { groups }
    });
  } catch (err) {
    console.error('/groups/my error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Guruhlarni olishda xatolik.');
  }
});

// ─── 9. Admin & Moderation ────────────────────────────────────

apiRouter.get('/admin/dashboard', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await db.getDashboardAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('/admin/dashboard error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Dashboardni olishda xatolik.');
  }
});

apiRouter.get('/admin/moderation', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const flagged = await db.getFlaggedSubmissions();

    res.json({
      success: true,
      data: { flaggedSubmissions: flagged }
    });
  } catch (err) {
    console.error('/admin/moderation error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Moderatsiyani olishda xatolik.');
  }
});

apiRouter.post('/admin/moderation/action', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId, action, reason } = req.body;
    if (!submissionId || !action) {
      return sendError(res, 400, 'INVALID_INPUT', 'Submission ID va action talab etiladi.');
    }

    let moderationStatus: any;
    if (action === 'APPROVE') moderationStatus = 'APPROVED';
    else if (action === 'REJECT') moderationStatus = 'REJECTED';
    else if (action === 'REMOVE') moderationStatus = 'REMOVED';
    else if (action === 'BLOCK_USER') {
      // Find submission to get userId
      const data = db.getData();
      const sub = data.submissions.find(s => s.id === submissionId);
      if (sub) {
        await db.updateUser(sub.userId, { isBlocked: true });
      }
      moderationStatus = 'REMOVED';
    }
    else if (action === 'WARN_USER') {
      // Send warning notification to the submission owner
      const data = db.getData();
      const sub = data.submissions.find(s => s.id === submissionId);
      if (sub) {
        await db.createNotification(sub.userId, 'Video Ogohlantirildi', reason || 'Videongiz moderator tomonidan ko‘rib chiqildi. Iltimos, qoidalarga rioya qiling.', 'WARNING');
      }
      moderationStatus = 'APPROVED'; // Keep video but warn user
    }

    if (moderationStatus) {
      await db.updateSubmissionModeration(submissionId, moderationStatus);
    }

    res.json({
      success: true,
      message: `Aksiya bajarildi: ${action}`
    });
  } catch (err) {
    console.error('/admin/moderation/action error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Moderatsiya amalini bajarishda xatolik.');
  }
});

apiRouter.post('/admin/make-super-admin', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'SUPER_ADMIN') {
      return res.json({ success: true, message: 'Siz allaqachon Super Admin ekansiz.' });
    }
    await db.updateUser(user.id, { role: 'SUPER_ADMIN' });
    res.json({ success: true, message: 'Endi siz Super Admin ekansiz. Sahifani yangilang.' });
  } catch (err) {
    console.error('/admin/make-super-admin error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Rolni yangilashda xatolik.');
  }
});

apiRouter.delete('/submissions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const submissionId = req.params.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    const data = db.getData();
    const sub = data.submissions?.find(s => s.id === submissionId);
    
    if (sub && !isAdmin && sub.userId !== user.id) {
      return sendError(res, 403, 'FORBIDDEN', 'Faqat o‘z videongizni yoki admin sifatida o‘chira olasiz.');
    }

    await db.updateSubmissionModeration(submissionId, 'REMOVED');
    res.json({ success: true, message: 'Video muvaffaqiyatli o‘chirildi.' });
  } catch (err) {
    console.error('/submissions/:id DELETE error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Videoni o‘chirishda xatolik.');
  }
});

apiRouter.get('/admin/notifications', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await db.getNotifications(req.user!.id);
    res.json({ success: true, data: { notifications } });
  } catch (err) {
    console.error('/admin/notifications error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Notificationlarni olishda xatolik.');
  }
});

apiRouter.post('/admin/notifications/:id/read', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('/admin/notifications/:id/read error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Notificationni o‘qilgan deb belgilashda xatolik.');
  }
});

// ─── 11. Comments ────────────────────────────────────────────

apiRouter.get('/submissions/:id/comments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const comments = await db.getCommentsBySubmission(req.params.id);
    res.json({ success: true, data: { comments } });
  } catch (err) {
    console.error('/submissions/:id/comments error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Kommentlarni olishda xatolik.');
  }
});

apiRouter.post('/submissions/:id/comments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return sendError(res, 400, 'INVALID_INPUT', 'Komment matni kiritilmadi.');
    }
    if (text.trim().length > 500) {
      return sendError(res, 400, 'INVALID_INPUT', 'Komment 500 ta belgidan oshmasligi kerak.');
    }

    const currentUser = req.user!;
    const comment = await db.createComment(currentUser.id, req.params.id, text.trim());
    // Attach user info so frontend gets CommentWithUser
    const commentWithUser = { ...comment, user: currentUser };
    res.json({ success: true, data: { comment: commentWithUser } });
  } catch (err) {
    console.error('/submissions/:id/comments POST error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Komment qo‘shishda xatolik.');
  }
});

apiRouter.delete('/comments/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const result = await db.deleteComment(req.params.id, user.id, isAdmin);
    res.json(result);
  } catch (err) {
    console.error('/comments/:id DELETE error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Komment o‘chirishda xatolik.');
  }
});

// ─── 12. Analytics Logging ────────────────────────────────────

apiRouter.post('/analytics/event', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventName, challengeId, metadata } = req.body;
    if (eventName) {
      await db.logAnalytics(eventName, req.user?.id, challengeId, metadata);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('/analytics/event error:', err);
    // Don't fail analytics logging
    res.json({ success: true });
  }
});
