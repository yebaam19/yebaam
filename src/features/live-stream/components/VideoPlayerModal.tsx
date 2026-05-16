'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, UserIcon, EyeIcon, ClockIcon, ChatBubbleLeftIcon } from '@/components/icons/heroicons-shim';
import { useRef, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { liveStreamService } from '../services/live-stream.service';
import { LiveStreamChat } from './LiveStreamChat';
import { ViewerCounter } from './ViewerCounter';

interface RecordedStream {
  id: string;
  title: string;
  description?: string;
  playbackUrl?: string;
  recordingUrl?: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
  stats: {
    duration: number;
    viewerCount: number;
    peakViewerCount: number;
    endedAt?: string;
  };
  privacy: string;
  createdAt: string;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: RecordedStream | null;
}

export default function VideoPlayerModal({ isOpen, onClose, stream }: VideoPlayerModalProps) {
  const t = useTranslations('liveStream.playerModal');
  const locale = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showChat, setShowChat] = useState(false);

  const checkRecordingStatus = async () => {
    if (!stream) return;

    setIsCheckingStatus(true);
    setStatusMessage(t('checkingStatusMessage'));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live-streams/${stream.id}/recording-status`);
      const data = await response.json();

      console.log(' Estado de grabación:', data);

      if (data.ready && data.recordingUrl) {
        setStatusMessage(t('recordingReady'));
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setStatusMessage(` ${data.message || t('stillProcessing')}`);
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
      setStatusMessage(t('errorCheckingStatus'));
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !stream) return;

    console.log(' VideoPlayerModal - Stream info:', {
      id: stream.id,
      playbackUrl: stream.playbackUrl,
      recordingUrl: stream.recordingUrl,
    });

    const videoUrl = stream.recordingUrl || stream.playbackUrl;
    
    if (!videoUrl) {
      console.warn('No hay URL de video disponible');
      return;
    }

    console.log(' Video URL:', videoUrl);

    if (videoRef.current) {
      // Para streams HLS (.m3u8), Safari lo soporta nativamente
      // Chrome/Firefox necesitan hls.js, pero por ahora intentamos directo
      if (videoUrl.includes('.m3u8')) {
        console.log(' HLS stream detectado, cargando...');
        videoRef.current.src = videoUrl;
        videoRef.current.load();
      } else {
        videoRef.current.src = videoUrl;
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [isOpen, stream]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorDisplayName = (author: RecordedStream['author']) => {
    const fullName = `${author.firstName} ${author.lastName || ''}`.trim();
    return fullName || author.username;
  };

  if (!stream) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-7xl h-[90vh] bg-neutral-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 shrink-0">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
               {t('title')}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showChat
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <ChatBubbleLeftIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {showChat ? t('hideChat') : t('showChat')}
                </span>
              </button>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label={t('closeAriaLabel')}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Main content - Video + Chat */}
          <div className="flex-1 flex min-h-0">
            {/* Video Player */}
            <div className={`relative bg-black ${showChat ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
            {stream.recordingUrl ? (
              // Si hay recordingUrl, intentar reproducir la grabación
              <>
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  className="w-full h-full"
                  onError={(e) => {
                    console.error('Error al cargar video:', e);
                    console.error('Video element:', videoRef.current);
                  }}
                  onLoadedMetadata={() => {
                    console.log('Video metadata cargada');
                    console.log('Duration:', videoRef.current?.duration);
                  }}
                >
                  {t('videoNotSupported')}
                </video>

                {/* Debug Info */}
                <div className="absolute top-4 left-4 bg-black/80 text-white text-xs p-2 rounded max-w-md">
                  <div className="font-mono">
                    <div><strong>{t('debugIdLabel')}</strong> {stream.id}</div>
                    <div className="truncate"><strong>{t('debugRecordingLabel')}</strong> {stream.recordingUrl}</div>
                  </div>
                </div>
              </>
            ) : stream.playbackUrl ? (
              // Si solo hay playbackUrl (stream ya terminó), mostrar mensaje
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-900/50 to-pink-900/50">
                <div className="text-center px-6">
                  <div className="text-6xl mb-4"></div>
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {t('processingTitle')}
                  </h3>
                  <p className="text-neutral-300 text-lg mb-4">
                    {t('processingDescription')}
                  </p>
                  <p className="text-neutral-400 text-sm mb-4">
                    <strong>{t('streamDurationLabel')}</strong> {formatDuration(stream.stats.duration)}
                  </p>
                  <p className="text-neutral-400 text-sm mb-6">
                    {t('estimatedProcessingTime')} <strong>{t('processingTimeRange')}</strong>
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 max-w-lg mx-auto mb-6">
                    <p className="text-neutral-300 text-sm">
                      <strong> {t('whyTakesLongTitle')}</strong> {t('whyTakesLongBody')}
                    </p>
                  </div>
                  
                  {/* Status Message */}
                  {statusMessage && (
                    <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/50 rounded-lg text-sm text-blue-200">
                      {statusMessage}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={checkRecordingStatus}
                      disabled={isCheckingStatus}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isCheckingStatus ? ` ${t('checking')}` : ` ${t('checkStatus')}`}
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                       {t('refreshPage')}
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-neutral-500 font-mono">
                    {t('streamIdLabel')} {stream.id}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4"></div>
                  <p className="text-white text-lg">{t('videoUnavailable')}</p>
                  <p className="text-neutral-400 text-sm mt-2">
                    {t('videoUnavailableHint')}
                  </p>
                </div>
              </div>
            )}
            </div>

            {/* Chat Sidebar */}
            {showChat && (
              <div className="w-1/3 border-l border-neutral-800 flex flex-col">
                <LiveStreamChat streamId={stream.id} className="flex-1" />
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="p-6 space-y-4 shrink-0 border-t border-neutral-800 bg-neutral-900/50">
            {/* Author */}
            <div className="flex items-center gap-3">
              {stream.author.avatar ? (
                <img
                  src={stream.author.avatar}
                  alt={getAuthorDisplayName(stream.author)}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white">
                  {getAuthorDisplayName(stream.author)}
                </h3>
                <p className="text-sm text-neutral-400">
                  @{stream.author.username}
                </p>
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {stream.title}
              </h2>
              {stream.description && (
                <p className="text-neutral-300">
                  {stream.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5" />
                <span>
                  {stream.stats.peakViewerCount === 1
                    ? t('viewersPeakOne', { count: stream.stats.peakViewerCount })
                    : t('viewersPeakOther', { count: stream.stats.peakViewerCount })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <span>
                  {t('durationLabel')} {formatDuration(stream.stats.duration)}
                </span>
              </div>

              {stream.stats.endedAt && (
                <div className="flex items-center gap-2">
                  <span>
                    {formatDate(stream.stats.endedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
