import { useState, useRef, useEffect } from 'react';

export function useReelPlayback(isOpen: boolean, reelId?: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      void videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [isOpen, reelId]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      void videoRef.current.play().catch(() => setIsPlaying(false));
    }
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


  return {
    videoRef,
    isPlaying,
    setIsPlaying,
    isMuted,
    currentTime,
    duration,
    togglePlayPause,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek
  };
}
