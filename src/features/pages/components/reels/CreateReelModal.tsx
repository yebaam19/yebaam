'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  VideoCameraIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  StopIcon,
} from '@/components/icons/heroicons-shim';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { postService } from '@/app/(app)/feed/post/services/post.service';
import { uploadService } from '@/lib/service/upload.service';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId?: string; // Si se proporciona, el reel se asocia a la página
}

type Step = 'choose' | 'record' | 'upload' | 'preview' | 'uploading';

export function CreateReelModal({ isOpen, onClose, pageId }: CreateReelModalProps) {
  const t = useTranslations('pages.reels.create');
  const [step, setStep] = useState<Step>('choose');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  const MAX_DURATION = 90; // 90 segundos
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  // Reset modal state
  const handleClose = () => {
    stopRecording();
    setStep('choose');
    setVideoBlob(null);
    setVideoFile(null);
    setVideoDuration(0);
    setCaption('');
    setRecordedTime(0);
    onClose();
  };

  // ==================== GRABAR VIDEO ====================
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera en móvil
          width: { ideal: 1080 },
          height: { ideal: 1920 }, // Vertical 9:16
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoDuration(recordedTime);
        setStep('preview');
        
        // Detener stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      let time = 0;
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordedTime(time);

        if (time >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      alert(t('cameraError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // ==================== SUBIR VIDEO ====================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('video/')) {
      alert(t('invalidVideoType'));
      return;
    }

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      alert(t('fileTooLargeTemplate', { size: MAX_SIZE / (1024 * 1024) }));
      return;
    }

    // Obtener duración del video
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration);

      if (duration > MAX_DURATION) {
        alert(t('videoTooLongTemplate', { seconds: MAX_DURATION }));
        return;
      }

      setVideoFile(file);
      setVideoDuration(duration);
      setStep('preview');
    };
    video.src = URL.createObjectURL(file);
  };

  // ==================== PUBLICAR REEL ====================

  const publishMutation = useAsyncAction(
    async () => {
      const videoToUpload = videoBlob || videoFile;
      if (!videoToUpload) throw new Error(t('noVideoError'));

      console.log('[CREATE REEL] Iniciando publicación:', {
        size: videoToUpload.size,
        duration: videoDuration,
        pageId,
      });

      // 1. Subir a Cloudflare Stream vía uploadService (el MediaRecorder
      // entrega un Blob; uploadVideo espera File).
      const file =
        videoToUpload instanceof File
          ? videoToUpload
          : new File([videoToUpload], `reel-${Date.now()}.webm`, {
              type: videoToUpload.type || 'video/webm',
            });

      const { uid, duration } = await uploadService.uploadVideo(file, {
        maxDurationSeconds: MAX_DURATION,
      });

      // 2. Crear post como reel — persistencia id-first (misma forma que
      // buildPostData): solo el uid de Stream viaja al backend; las URLs de
      // reproducción se reconstruyen al renderizar.
      await postService.create({
        content: caption || undefined,
        isReel: true,
        aspectRatio: 'vertical',
        privacy: 'public',
        pageId: pageId || undefined,
        mediaFiles: [{
          type: 'video',
          streamUid: uid,
          size: file.size,
          mimeType: file.type,
          duration: duration || videoDuration,
        }],
      });

      console.log('[CREATE REEL] Reel publicado exitosamente');
    },
    {
      onSuccess: () => {
        invalidate('page-reels');
        invalidate('page-posts');
        invalidate('reels');
        handleClose();
      },
      onError: (error) => {
        console.error('[CREATE REEL] Error:', error);
        alert(t('publishError'));
        setStep('preview');
      },
    }
  );

  const handlePublish = () => {
    setStep('uploading');
    publishMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-md h-[90vh] bg-gray-900 rounded-lg overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* STEP 1: Choose method */}
          {step === 'choose' && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Dialog.Title className="text-2xl font-bold text-white mb-8">
                {t('title')}
              </Dialog.Title>

              <div className="w-full space-y-4">
                <button
                  onClick={() => setStep('record')}
                  className="w-full p-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  <VideoCameraIcon className="w-8 h-8 text-white" />
                  <span className="text-lg font-semibold text-white">{t('recordVideo')}</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  <ArrowUpTrayIcon className="w-8 h-8 text-white" />
                  <span className="text-lg font-semibold text-white">{t('uploadVideo')}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <p className="text-sm text-gray-400 mt-6 text-center">
                {t('limits')}
              </p>
            </div>
          )}

          {/* STEP 2: Record */}
          {step === 'record' && (
            <div className="relative w-full h-full bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Timer */}
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full font-mono">
                  {Math.floor(recordedTime / 60)}:{(recordedTime % 60).toString().padStart(2, '0')} / {Math.floor(MAX_DURATION / 60)}:{(MAX_DURATION % 60).toString().padStart(2, '0')}
                </div>
              )}

              {/* Progress Bar */}
              {isRecording && (
                <div className="absolute bottom-32 left-4 right-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(recordedTime / MAX_DURATION) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Record Button */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
                  >
                    <VideoCameraIcon className="w-10 h-10 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors animate-pulse shadow-lg"
                  >
                    <StopIcon className="w-10 h-10 text-white" />
                  </button>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => setStep('choose')}
                className="absolute top-20 left-4 px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (videoBlob || videoFile) && (
            <div className="flex flex-col h-full">
              <video
                src={videoBlob ? URL.createObjectURL(videoBlob) : videoFile ? URL.createObjectURL(videoFile) : ''}
                controls
                autoPlay
                loop
                className="flex-1 w-full object-contain bg-black"
              />
              
              <div className="p-4 bg-gray-800 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('captionLabel')}
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={t('captionPlaceholder')}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t('captionCounter', { count: caption.length, duration: videoDuration })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setVideoBlob(null);
                      setVideoFile(null);
                      setStep('choose');
                    }}
                    className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                  >
                    {t('recordAgain')}
                  </button>
                  <button
                    onClick={handlePublish}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
                  >
                    {t('publish')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Uploading */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center justify-center h-full text-white p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4" />
              <p className="text-lg font-semibold mb-2">{t('publishing')}</p>
              <p className="text-sm text-gray-400 text-center">
                {t('publishingHint')}
              </p>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
