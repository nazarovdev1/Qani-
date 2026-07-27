import { db } from '../db';
import { ProcessingStatus } from '../db/types';
import { getRedis, isRedisAvailable } from './redis';

export interface VideoProcessingJob {
  submissionId: string;
  videoUrl: string;
  durationSec?: number;
}

const QUEUE_KEY = 'qani:video-queue';
const PROCESSING_KEY = 'qani:processing';

class VideoWorkerQueue {
  private localQueue: VideoProcessingJob[] = [];
  private isProcessing = false;
  private useRedis = false;

  constructor() {
    // Check if Redis is available on first enqueue
    this.initRedis();
  }

  private async initRedis() {
    try {
      const redis = getRedis();
      await redis.connect();
      await redis.ping();
      this.useRedis = true;
      console.log('✅ Video worker using Redis queue');

      // Recover any stuck jobs from previous run
      await this.recoverStuckJobs();
    } catch {
      console.log('⚠️  Redis not available, video worker using in-memory queue');
    }
  }

  private async recoverStuckJobs() {
    if (!this.useRedis) return;
    try {
      const redis = getRedis();
      const stuckJob = await redis.get(PROCESSING_KEY);
      if (stuckJob) {
        const job: VideoProcessingJob = JSON.parse(stuckJob);
        await redis.lpush(QUEUE_KEY, JSON.stringify(job));
        await redis.del(PROCESSING_KEY);
        console.log(`♻️  Recovered stuck job: ${job.submissionId}`);
      }
    } catch (err) {
      console.warn('Could not recover stuck jobs:', err);
    }
  }

  public async enqueue(job: VideoProcessingJob) {
    if (this.useRedis) {
      try {
        const redis = getRedis();
        await redis.lpush(QUEUE_KEY, JSON.stringify(job));
        this.processNextFromRedis();
        return;
      } catch (err) {
        console.warn('Redis enqueue failed, falling back to in-memory:', err);
        this.useRedis = false;
      }
    }

    // Fallback: in-memory queue
    this.localQueue.push(job);
    this.processNextFromMemory();
  }

  private async processNextFromRedis() {
    if (this.isProcessing || !this.useRedis) return;

    this.isProcessing = true;
    try {
      const redis = getRedis();
      const jobStr = await redis.rpop(QUEUE_KEY);
      if (!jobStr) {
        this.isProcessing = false;
        return;
      }

      const job: VideoProcessingJob = JSON.parse(jobStr);

      // Mark as processing (for crash recovery)
      await redis.set(PROCESSING_KEY, jobStr, 'EX', 60);

      try {
        await this.processVideo(job);
      } catch (err) {
        console.error(`Failed to process video job for submission ${job.submissionId}:`, err);
        await db.updateSubmissionStatus(job.submissionId, 'FAILED');
      }

      // Clear processing marker
      await redis.del(PROCESSING_KEY);
    } catch (err) {
      console.error('Redis processing error:', err);
    }

    this.isProcessing = false;

    // Process next job
    setTimeout(() => this.processNextFromRedis(), 200);
  }

  private processNextFromMemory() {
    if (this.isProcessing || this.localQueue.length === 0) return;

    this.isProcessing = true;
    const job = this.localQueue.shift();

    if (job) {
      this.processVideo(job)
        .catch(async (err) => {
          console.error(`Failed to process video job for submission ${job.submissionId}:`, err);
          await db.updateSubmissionStatus(job.submissionId, 'FAILED');
        })
        .finally(() => {
          this.isProcessing = false;
          if (this.localQueue.length > 0) {
            setTimeout(() => this.processNextFromMemory(), 200);
          }
        });
    } else {
      this.isProcessing = false;
    }
  }

  private async processVideo(job: VideoProcessingJob): Promise<void> {
    // 1. Mark status as PROCESSING
    await db.updateSubmissionStatus(job.submissionId, 'PROCESSING');

    // Simulate async FFmpeg processing (720p optimization & thumbnail extraction)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Sample high quality dynamic thumbnail placeholding based on submission ID
    const thumbnails = [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      'https://images.unsplash.com/photo-1585336261026-870a782ae1b0?w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'
    ];
    const thumbUrl = thumbnails[Math.floor(Math.random() * thumbnails.length)];

    // 2. Mark status as READY
    await db.updateSubmissionStatus(
      job.submissionId,
      'READY',
      job.videoUrl,
      thumbUrl
    );

    // 3. Log Analytics
    await db.logAnalytics('SUBMISSION_READY', undefined, undefined, {
      submissionId: job.submissionId
    });
  }
}

export const videoWorker = new VideoWorkerQueue();
