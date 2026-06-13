'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth';
import { useLiveStream } from '@/features/live-stream/hooks/useLiveStream';
import LiveVideoHeader from './LiveVideoModal/LiveVideoHeader';
import LiveVideoPreview from './LiveVideoModal/LiveVideoPreview';
import LiveVideoPreparePanel from './LiveVideoModal/LiveVideoPreparePanel';
import LiveVideoLivePanel from './LiveVideoModal/LiveVideoLivePanel';
import { type LiveStatus, type Privacy, formatDuration } from './LiveVideoModal/types';

interface LiveVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveVideoModal({ isOpen, onClose }: LiveVideoModalProps) {
  const t = useTranslations('feed');
  const { user } = useAuth();
  const { startStream, endStream, isStarting, isEnding, currentStream } = useLiveStream();
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('preparing');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Solicitar acceso a la cámara
  useEffect(() => {
    if (isOpen && liveStatus === 'preparing') {
      requestCameraAccess();
    }

    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error(t('liveVideo.cameraError'));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartLive = async () => {
    console.log(' [handleStartLive] Iniciando proceso de live stream', { title, description, privacy });

    if (!title.trim()) {
      toast.error(t('liveVideo.titleRequired'));
      return;
    }

    // Iniciar countdown
    setLiveStatus('countdown');
    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count--;
      console.log(' [Countdown]', count);
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownInterval);
        console.log('[Countdown] Finalizado, llamando a startLiveStreamBackend');
        startLiveStreamBackend();
      }
    }, 1000);
  };

  const startLiveStreamBackend = async () => {
    console.log('[startLiveStreamBackend] Llamando al backend...');

    try {
      // Llamar al backend para crear el stream
      const stream = await startStream({
        title: title.trim(),
        description: description.trim(),
        privacy,
      });

      if (stream) {
        console.log('[startLiveStreamBackend] Stream creado exitosamente:', {
          id: stream.id,
          playbackUrl: stream.playbackUrl,
          status: stream.status,
        });

        setLiveStatus('live');
        setIsRecording(true);
        setDuration(0);

        // Mostrar información del stream
        toast.success(t('liveVideo.liveSuccess'), {
          description: t('liveVideo.liveSuccessDescription', { id: stream.id }),
          duration: 5000,
        });

        // Timer de duración
        intervalRef.current = setInterval(() => {
          setDuration(prev => prev + 1);

          // Simular viewers entrando/saliendo (esto vendrá del WebSocket después)
          if (Math.random() > 0.7) {
            setViewerCount(prev => Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1)));
          }
        }, 1000);
      } else {
        console.error('[startLiveStreamBackend] No se recibió stream del backend');
        toast.error(t('liveVideo.startError'));
        setLiveStatus('preparing');
      }
    } catch (error) {
      console.error(' [startLiveStreamBackend] Error:', error);
      toast.error(t('liveVideo.connectError'));
      setLiveStatus('preparing');
    }
  };

  const handleEndLive = async () => {
    if (!isRecording || !currentStream) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setLiveStatus('ending');
    setIsRecording(false);

    // Llamar al backend para finalizar
    const success = await endStream(currentStream.id);

    if (success) {
      setTimeout(() => {
        toast.success(t('liveVideo.endedToast', { duration: formatDuration(duration) }));
        // Limpiar y cerrar sin volver a preguntar
        stopCamera();
        setLiveStatus('preparing');
        setTitle('');
        setDescription('');
        setCountdown(3);
        setViewerCount(0);
        setDuration(0);
        onClose();
      }, 2000);
    } else {
      setLiveStatus('live');
      setIsRecording(true);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      const confirm = window.confirm(t('liveVideo.endConfirm'));
      if (!confirm) return;
      handleEndLive();
    } else {
      stopCamera();
      setLiveStatus('preparing');
      setTitle('');
      setDescription('');
      setCountdown(3);
      setViewerCount(0);
      setDuration(0);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Transition show={isOpen}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        </TransitionChild>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-3xl rounded-xl bg-neutral-900 shadow-2xl overflow-hidden">
              {/* Header */}
              <LiveVideoHeader liveStatus={liveStatus} onClose={handleClose} t={t} />

              {/* Video Preview */}
              <LiveVideoPreview
                videoRef={videoRef}
                liveStatus={liveStatus}
                countdown={countdown}
                viewerCount={viewerCount}
                duration={duration}
                t={t}
              />

              {/* Controls */}
              {liveStatus === 'preparing' && (
                <LiveVideoPreparePanel
                  user={user}
                  privacy={privacy}
                  title={title}
                  description={description}
                  isStarting={isStarting}
                  onPrivacyChange={setPrivacy}
                  onTitleChange={setTitle}
                  onDescriptionChange={setDescription}
                  onStart={handleStartLive}
                  t={t}
                />
              )}

              {liveStatus === 'live' && (
                <LiveVideoLivePanel
                  currentStream={currentStream}
                  viewerCount={viewerCount}
                  isEnding={isEnding}
                  onEnd={handleEndLive}
                  t={t}
                />
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
