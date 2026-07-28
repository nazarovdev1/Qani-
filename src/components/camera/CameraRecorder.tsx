import React, { useState, useRef, useEffect } from 'react';
import { Challenge } from '../../types';
import { Language, translations } from '../../i18n';
import { Camera, RefreshCw, CheckCircle, RotateCcw, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { triggerConfetti } from '../common/Confetti';
import { telegram } from '../../lib/telegram';

interface CameraRecorderProps {
  challenge: Challenge;
  lang: Language;
  onSuccess: () => void;
  onClose: () => void;
}

export const CameraRecorder: React.FC<CameraRecorderProps> = ({ challenge, lang, onSuccess, onClose }) => {
  const t = translations[lang];

  // Camera & Stream states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Camera Stream
  useEffect(() => {
    if (useFallback) return;

    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });

        if (isMounted) {
          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        if (isMounted) {
          setCameraError('Kameraga ruxsat berilmadi yoki qurilmada kamera topilmadi.');
          setUseFallback(true);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [facingMode, useFallback]);

  // Flip Front/Rear Camera
  const toggleFacingMode = () => {
    telegram.haptic('click');
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Start Recording
  const startRecording = () => {
    if (!stream) return;
    telegram.haptic('click');

    setRecordedChunks([]);
    setVideoBlob(null);
    setVideoUrl(null);
    setDuration(0);

    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/mp4' });
    mediaRecorderRef.current = recorder;

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
    };

    recorder.start(100);
    setRecording(true);

    // Recording timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setDuration(elapsed);

      if (elapsed >= challenge.maxDurationSec) {
        stopRecording();
      }
    }, 100);
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    telegram.haptic('click');
  };

  // Retake
  const handleRetake = () => {
    telegram.haptic('click');
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setDuration(0);
  };

  // File Upload Fallback Handler
  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg('Video hajmi 50MB dan oshmasligi kerak.');
        return;
      }
      setVideoBlob(file);
      setVideoUrl(URL.createObjectURL(file));
      setDuration(10);
    }
  };

  // Submit Video Upload
  const handleSubmit = async () => {
    if (!videoBlob) return;

    if (duration < challenge.minDurationSec) {
      setErrorMsg(`Video kamida ${challenge.minDurationSec} soniya bo‘lishi kerak.`);
      return;
    }

    // Vercel serverless limit: 4.5MB — client-side check
    const MAX_VIDEO_SIZE = 4.5 * 1024 * 1024;
    if (videoBlob.size > MAX_VIDEO_SIZE) {
      setErrorMsg(`Video hajmi juda katta (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB). Maksimal 4.5MB.`);
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);
    telegram.haptic('click');

    try {
      // STEP 1: Get upload URL (cloud presigned or local endpoint)
      setUploadProgress(20);
      const presignRes = await apiRequest('/submissions/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: 'recording.mp4', mimeType: 'video/mp4' })
      });

      if (!presignRes.success || !presignRes.data) {
        throw new Error(presignRes.error?.message || 'Yuklash URL olishda xatolik.');
      }

      const { uploadUrl, fileKey, publicUrl } = presignRes.data as {
        uploadUrl: string;
        fileKey: string;
        publicUrl: string;
      };

      let finalPublicUrl = publicUrl;

      // STEP 2: Upload video
      setUploadProgress(50);

      if (uploadUrl.startsWith('http')) {
        // Cloud direct upload (Supabase signed URL)
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'video/mp4',
          },
          body: videoBlob,
        });

        if (!uploadRes.ok) {
          throw new Error(`Cloud upload failed: ${uploadRes.status}`);
        }
      } else {
        // Local / Vercel direct upload through API
        const formData = new FormData();
        formData.append('video', videoBlob, 'recording.mp4');

        const directRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'x-telegram-init-data': telegram.initData || '',
            'x-mock-user-id': localStorage.getItem('qani_mock_user_id') || 'user_001'
          },
          body: formData
        });

        let directJson: { success: boolean; data?: { fileUrl: string }; error?: { message: string } };
        const contentType = directRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            directJson = await directRes.json();
          } catch {
            const text = await directRes.text();
            console.error('Invalid JSON in upload response:', text.slice(0, 300));
            throw new Error('Serverdan noto\'g\'ri javob keldi.');
          }
        } else {
          const text = await directRes.text();
          console.error('Non-JSON upload response:', text.slice(0, 300));
          if (directRes.status === 413) {
            throw new Error(`Video hajmi juda katta (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB). Server 4.5MB dan katta fayllarni qabul qilmaydi.`);
          }
          throw new Error(`Server xatolik qaytardi (${directRes.status}).`);
        }

        if (!directJson.success || !directJson.data?.fileUrl) {
          throw new Error(directJson.error?.message || 'Fayl yuklashda xatolik.');
        }
        finalPublicUrl = directJson.data.fileUrl;
      }

      setUploadProgress(80);

      // STEP 3: Create Submission Record
      const subRes = await apiRequest('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          challengeId: challenge.id,
          videoUrl: finalPublicUrl,
          durationSec: duration
        })
      });

      setUploadProgress(100);

      if (subRes.success) {
        triggerConfetti();
        telegram.haptic('success');
        onSuccess();
      } else {
        throw new Error(subRes.error?.message || 'Submission yaratishda xatolik.');
      }
    } catch (err: unknown) {
      console.error('Upload Submission error:', err);
      const errorStr = err instanceof Error ? err.message : 'Server bilan aloqada xatolik yuz berdi.';
      setErrorMsg(errorStr);
      telegram.haptic('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col justify-between p-4 overflow-hidden text-[#000000]">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="bg-[#00FF00] border-2 border-[#000000] px-3 py-1 text-xs font-black uppercase text-[#000000] shadow-[2px_2px_0px_#000000]">
          Max: {challenge.maxDurationSec}s
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 bg-[#FFFFFF] border-2 border-[#000000] flex items-center justify-center text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] shadow-[2px_2px_0px_#000000] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Viewfinder / Preview / Fallback */}
      <div className="relative flex-1 my-3 bg-[#111111] border-4 border-[#000000] flex items-center justify-center shadow-[8px_8px_0px_#000000] overflow-hidden">
        {useFallback ? (
          /* Fallback Uploader View */
          <div className="p-6 text-center space-y-4 max-w-xs bg-[#FFFFFF] border-4 border-[#000000] shadow-[6px_6px_0px_#000000]">
            <div className="w-14 h-14 bg-[#FF4D00] text-[#FFFFFF] mx-auto border-2 border-[#000000] flex items-center justify-center shadow-[2px_2px_0px_#000000]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-[#000000]">Kamera Ruxsati Cheklangan</h3>
              <p className="text-xs font-bold text-[#000000] mt-1">
                WebView yoki qurilmada kamerani to‘g‘ridan-to‘g‘ri yoqib bo‘lmadi. Video faylni tanlab yuklang:
              </p>
            </div>

            <label className="block w-full py-3.5 px-4 bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] border-2 border-[#000000] font-black text-xs uppercase text-[#000000] cursor-pointer shadow-[3px_3px_0px_#000000] transition-colors">
              <span>Video Faylni Tanlash</span>
              <input
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFallbackFileSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : videoUrl ? (
          /* Video Preview Screen */
          <video
            ref={previewRef}
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          /* Live Camera Viewfinder */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
            />

            {/* Live Progress Timer overlay */}
            {recording && (
              <div className="absolute top-4 left-4 right-4 bg-[#000000] border-2 border-[#FFFFFF] h-4 overflow-hidden shadow-[2px_2px_0px_#000000]">
                <div
                  className="bg-[#00FF00] h-full transition-all duration-100"
                  style={{ width: `${Math.min(100, (duration / challenge.maxDurationSec) * 100)}%` }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="z-10 space-y-3">
        {errorMsg && (
          <div className="bg-[#FF4D00] text-[#FFFFFF] border-2 border-[#000000] p-2.5 text-xs font-black uppercase text-center shadow-[2px_2px_0px_#000000]">
            {errorMsg}
          </div>
        )}

        {videoUrl ? (
          /* Preview Actions: Retake or Submit */
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRetake}
              disabled={uploading}
              className="flex-1 py-4 bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] border-4 border-[#000000] font-black text-xs uppercase text-[#000000] flex items-center justify-center space-x-2 shadow-[4px_4px_0px_#000000] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Qayta Olish</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 py-4 bg-[#00FF00] hover:bg-[#000000] hover:text-[#00FF00] border-4 border-[#000000] font-black text-xs uppercase text-[#000000] flex items-center justify-center space-x-2 shadow-[4px_4px_0px_#000000] transition-colors"
            >
              {uploading ? (
                <span>{uploadProgress}% Yuklanmoqda...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>YUBORISH</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Recording Actions: Flip & Record */
          <div className="flex items-center justify-around py-2">
            {!useFallback && (
              <button
                onClick={toggleFacingMode}
                disabled={recording}
                className="w-14 h-14 bg-[#FFFFFF] border-4 border-[#000000] flex items-center justify-center text-[#000000] active:scale-95 shadow-[4px_4px_0px_#000000]"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}

            {/* Shutter Button */}
            {!useFallback && (
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`w-20 h-20 border-4 border-[#000000] p-1 flex items-center justify-center transition active:scale-95 shadow-[6px_6px_0px_#000000] ${
                  recording ? 'bg-[#FF4D00]' : 'bg-[#00FF00]'
                }`}
              >
                <div className={`transition-all ${recording ? 'w-8 h-8 bg-[#000000]' : 'w-12 h-12 bg-[#000000]'}`} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
