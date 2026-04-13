import { FC, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
} from '@/components/icons/heroicons-shim';
import { HeartIcon as HeartSolidIcon } from '@/components/icons/heroicons-shim';
import { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import Image from 'next/image';

interface ReelViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Post | null;
  onLike?: (reelId: string) => void;
  onComment?: (reelId: string) => void;
  onShare?: (reelId: string) => void;
}

export const ReelViewerModal: FC<ReelViewerModalProps> = ({
  isOpen,
  onClose,
  reel,
  onLike,
  onComment,
  onShare,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen, reel?.id]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleLike = () => {
    if (!reel) return;
    setIsLiked(!isLiked);
    onLike?.(reel.id);
  };

  const handleComment = () => {
    if (!reel) return;
    onComment?.(reel.id);
  };

  const handleShare = () => {
    if (!reel) return;
    onShare?.(reel.id);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!reel) return null;

  const videoUrl = reel.mediaFiles?.[0]?.url || '';
  const likesCount = Object.values(reel.reactionsCount || {}).reduce(
    (sum, count) => sum + count,
    0
  );
  const commentsCount = reel.commentsCount || 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/95" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden transition-all">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>

                <div className="relative bg-black rounded-lg overflow-hidden">
                  {/* Video Container */}
                  <div className="relative aspect-[9/16] max-h-[80vh]">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      loop
                      playsInline
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={togglePlayPause}
                    />

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <button
                          onClick={togglePlayPause}
                          className="p-4 bg-white/90 rounded-full hover:bg-white transition-colors"
                        >
                          <PlayIcon className="w-12 h-12 text-black" />
                        </button>
                      </div>
                    )}

                    {/* User Info Overlay */}
                    <div className="absolute bottom-20 left-4 right-20 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        {reel.author?.avatar ? (
                          <Image
                            src={reel.author.avatar}
                            alt={reel.author.username}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {reel.author?.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{reel.author?.username}</p>
                        </div>
                      </div>

                      {/* Caption */}
                      {reel.content && (
                        <p className="text-sm line-clamp-2 mb-2">{reel.content}</p>
                      )}
                    </div>

                    {/* Action Buttons - Right Side */}
                    <div className="absolute bottom-20 right-4 flex flex-col gap-4">
                      {/* Like Button */}
                      <button
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1 group"
                      >
                        {isLiked ? (
                          <HeartSolidIcon className="w-8 h-8 text-red-500" />
                        ) : (
                          <HeartIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-xs text-white font-semibold">
                          {likesCount + (isLiked ? 1 : 0)}
                        </span>
                      </button>

                      {/* Comment Button */}
                      <button
                        onClick={handleComment}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <ChatBubbleLeftIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white font-semibold">
                          {commentsCount}
                        </span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <PaperAirplaneIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white font-semibold">Compartir</span>
                      </button>

                      {/* More Options */}
                      <button className="flex flex-col items-center gap-1 group">
                        <EllipsisHorizontalIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                      </button>
                    </div>

                    {/* Video Controls - Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        />
                        <div className="flex justify-between text-xs text-white/80 mt-1">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={togglePlayPause}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                          {isPlaying ? (
                            <PauseIcon className="w-6 h-6 text-white" />
                          ) : (
                            <PlayIcon className="w-6 h-6 text-white" />
                          )}
                        </button>

                        <button
                          onClick={toggleMute}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                          {isMuted ? (
                            <SpeakerXMarkIcon className="w-6 h-6 text-white" />
                          ) : (
                            <SpeakerWaveIcon className="w-6 h-6 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
