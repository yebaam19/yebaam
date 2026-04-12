'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import {
  XMarkIcon,
  VideoCameraIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckCircleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useLiveStream } from '@/features/live-stream/hooks/useLiveStream';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/utils/avatar';

interface LiveVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LiveStatus = 'preparing' | 'countdown' | 'live' | 'ending';
type Privacy = 'public' | 'friends' | 'private';

const VISIBILITY_OPTIONS = [
  { value: 'public' as Privacy, label: 'Público', icon: GlobeAltIcon, description: 'Cualquiera puede ver' },
  { value: 'friends' as Privacy, label: 'Amigos', icon: UserGroupIcon, description: 'Solo tus amigos' },
  { value: 'private' as Privacy, label: 'Solo yo', icon: LockClosedIcon, description: 'Solo tú' },
];

export default function LiveVideoModal({ isOpen, onClose }: LiveVideoModalProps) {
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
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
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
      toast.error('Agrega un título para tu video en vivo');
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
        toast.success('¡Estás en vivo! ', {
          description: `URL de reproducción lista. Stream ID: ${stream.id}`,
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
        toast.error('Error al iniciar la transmisión');
        setLiveStatus('preparing');
      }
    } catch (error) {
      console.error(' [startLiveStreamBackend] Error:', error);
      toast.error('Error al conectar con el servidor');
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
        toast.success(`Video en vivo finalizado. Duración: ${formatDuration(duration)}`);
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
      const confirm = window.confirm('¿Finalizar transmisión en vivo?');
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
                <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                  <VideoCameraIcon className="h-7 w-7 text-red-500" />
                  {liveStatus === 'preparing' && 'Preparar transmisión en vivo'}
                  {liveStatus === 'countdown' && 'Iniciando...'}
                  {liveStatus === 'live' && (
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      EN VIVO
                    </span>
                  )}
                  {liveStatus === 'ending' && 'Finalizando...'}
                </DialogTitle>
                <button
                  onClick={handleClose}
                  disabled={liveStatus === 'ending'}
                  className="rounded-full p-2 hover:bg-neutral-800 disabled:opacity-50"
                >
                  <XMarkIcon className="h-6 w-6 text-neutral-400" />
                </button>
              </div>

              {/* Video Preview */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />

                {/* Countdown Overlay */}
                {liveStatus === 'countdown' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="text-9xl font-bold text-white animate-pulse">
                        {countdown}
                      </div>
                      <p className="mt-4 text-xl text-white">Iniciando transmisión...</p>
                    </div>
                  </div>
                )}

                {/* Live Stats Overlay */}
                {liveStatus === 'live' && (
                  <>
                    <div className="absolute top-4 left-4 flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <span className="text-sm font-bold text-white">EN VIVO</span>
                      </div>
                      
                      <div className="bg-black/70 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-semibold text-white">
                          {formatDuration(duration)}
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                        <SignalIcon className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-semibold text-white">
                          {viewerCount} {viewerCount === 1 ? 'espectador' : 'espectadores'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Ending Overlay */}
                {liveStatus === 'ending' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-white">Transmisión finalizada</p>
                      <p className="mt-2 text-neutral-300">Guardando video...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              {liveStatus === 'preparing' && (
                <div className="p-6 space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Avatar src={getUserAvatarUrl(user)} className="h-12 w-12" />
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {user.lastName || user.username}
                      </p>
                      {/* Privacy Selector */}
                      <select
                        value={privacy}
                        onChange={(e) => setPrivacy(e.target.value as Privacy)}
                        className="mt-1 rounded-md border-0 bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300"
                      >
                        {VISIBILITY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título de tu transmisión..."
                    maxLength={100}
                    className="w-full rounded-lg border-0 bg-neutral-800 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />

                  {/* Description */}
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tu transmisión en vivo (opcional)..."
                    maxLength={200}
                    rows={3}
                    className="w-full resize-none rounded-lg border-0 bg-neutral-800 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-neutral-500 text-right">
                    {description.length}/200
                  </p>

                  {/* Info Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-800 rounded-lg p-4">
                      <VideoCameraIcon className="h-6 w-6 text-red-500 mb-2" />
                      <p className="text-sm font-semibold text-white">Calidad HD</p>
                      <p className="text-xs text-neutral-400">1280x720 píxeles</p>
                    </div>
                    <div className="bg-neutral-800 rounded-lg p-4">
                      <SignalIcon className="h-6 w-6 text-green-500 mb-2" />
                      <p className="text-sm font-semibold text-white">Conexión estable</p>
                      <p className="text-xs text-neutral-400">Listo para transmitir</p>
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartLive}
                    disabled={!title.trim() || isStarting}
                    className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {isStarting ? 'Iniciando...' : 'Iniciar transmisión en vivo'}
                  </button>

                  {/* Note */}
                  <p className="text-xs text-center text-neutral-500">
                     Tu transmisión se guardará automáticamente cuando finalices
                  </p>
                </div>
              )}

              {liveStatus === 'live' && (
                <div className="p-6 space-y-4">
                  {/* Stream Info */}
                  {currentStream && (
                    <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-white text-sm">Información del Stream</h3>
                      <div className="space-y-1 text-xs text-neutral-400">
                        <p>Stream ID: <span className="text-neutral-300 font-mono">{currentStream.id}</span></p>
                        <p>URL de reproducción disponible</p>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleEndLive}
                    disabled={isEnding}
                    className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isEnding ? 'Finalizando...' : 'Finalizar transmisión en vivo'}
                  </button>
                  <p className="mt-3 text-xs text-center text-neutral-400">
                    {viewerCount} {viewerCount === 1 ? 'persona está' : 'personas están'} viendo tu transmisión
                  </p>
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
