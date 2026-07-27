import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  size: number;
}

export class StorageService {
  /**
   * Save uploaded file buffer to public storage
   */
  public async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    const ext = path.extname(originalName) || (mimeType.includes('mp4') ? '.mp4' : '.webm');
    const filename = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return {
      fileKey: filename,
      fileUrl,
      mimeType,
      size: buffer.length
    };
  }

  /**
   * Generates presigned URL configuration for direct client uploads
   */
  public getPresignedUploadUrl(filename: string, mimeType: string): { uploadUrl: string; fileKey: string; publicUrl: string } {
    const ext = path.extname(filename) || '.mp4';
    const fileKey = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    return {
      uploadUrl: `/api/upload/direct?key=${fileKey}`,
      fileKey,
      publicUrl: `/uploads/${fileKey}`
    };
  }

  /**
   * Deletes a file from storage
   */
  public async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const filename = path.basename(fileKey);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } catch (e) {
      console.error('Error deleting storage file:', e);
    }
    return false;
  }
}

export const storageService = new StorageService();
