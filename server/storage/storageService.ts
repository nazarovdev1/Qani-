import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'public', 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch {
  // Vercel /tmp may not exist yet; ignore
}

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  size: number;
}

/**
 * Supabase Storage upload via REST API (no heavy SDK needed)
 */
async function supabaseUpload(buffer: Buffer, fileKey: string, mimeType: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL yoki SUPABASE_SERVICE_KEY sozlanmagan');
  }

  const bucket = 'videos';
  const uploadPath = `${fileKey}`;
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${uploadPath}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upload failed: ${res.status} ${text}`);
  }

  // Public URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${uploadPath}`;
}

async function supabaseDelete(fileKey: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const bucket = 'videos';
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${fileKey}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${supabaseKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function generateFileKey(ext: string): string {
  return `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
}

export class StorageService {
  private useCloud(): boolean {
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
  }

  /**
   * Save uploaded file — cloud first, local fallback
   */
  public async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    const ext = path.extname(originalName) || (mimeType.includes('mp4') ? '.mp4' : '.webm');
    const fileKey = generateFileKey(ext);

    if (this.useCloud()) {
      const publicUrl = await supabaseUpload(buffer, fileKey, mimeType);
      return {
        fileKey,
        fileUrl: publicUrl,
        mimeType,
        size: buffer.length,
      };
    }

    // Local fallback
    const filePath = path.join(UPLOAD_DIR, fileKey);
    await fs.promises.writeFile(filePath, buffer);

    return {
      fileKey,
      fileUrl: `/uploads/${fileKey}`,
      mimeType,
      size: buffer.length,
    };
  }

  /**
   * Generates presigned URL configuration for direct client uploads
   * In cloud mode, returns Supabase presigned URL; locally returns API endpoint
   */
  public async getPresignedUploadUrl(filename: string, mimeType: string): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    const ext = path.extname(filename) || '.mp4';
    const fileKey = generateFileKey(ext);

    if (this.useCloud()) {
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
      const bucket = 'videos';

      // Create signed upload URL via Supabase REST
      const signUrl = `${supabaseUrl}/storage/v1/object/sign/${bucket}/${fileKey}`;
      const res = await fetch(signUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 600 }), // 10 min
      });

      if (res.ok) {
        const data = await res.json() as { signedURL: string };
        return {
          uploadUrl: `${supabaseUrl}${data.signedURL}`,
          fileKey,
          publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileKey}`,
        };
      }

      // Fallback to direct upload through our API if signed URL fails
      return {
        uploadUrl: `/api/submissions/upload-direct`,
        fileKey,
        publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileKey}`,
      };
    }

    return {
      uploadUrl: `/api/submissions/upload-direct?key=${fileKey}`,
      fileKey,
      publicUrl: `/uploads/${fileKey}`,
    };
  }

  /**
   * Deletes a file from storage
   */
  public async deleteFile(fileKey: string): Promise<boolean> {
    if (this.useCloud()) {
      return supabaseDelete(fileKey);
    }

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
