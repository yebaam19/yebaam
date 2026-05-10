'use client';

import { create } from 'zustand';
import type { PlayItem } from '../types/music.types';

interface PlayerState {
  queue: PlayItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  // Bumped each time the user explicitly hits play on a different item.
  // The PlayerBar listens to this to call `audio.play()` (which requires a
  // user gesture in browsers).
  playSerial: number;
  setQueue(items: PlayItem[], startIndex?: number): void;
  togglePlay(): void;
  next(): void;
  prev(): void;
  seek(seconds: number): void;
  setVolume(v: number): void;
  setCurrentTime(t: number): void;
  setDuration(d: number): void;
  setIsPlaying(playing: boolean): void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.9,
  playSerial: 0,

  setQueue(items, startIndex = 0) {
    set((s) => ({
      queue: items,
      currentIndex: Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)),
      isPlaying: items.length > 0,
      currentTime: 0,
      duration: items[startIndex]?.durationSeconds ?? 0,
      playSerial: s.playSerial + 1,
    }));
  },

  togglePlay() {
    set((s) => ({ isPlaying: !s.isPlaying, playSerial: s.playSerial + 1 }));
  },

  next() {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set((s) => ({
        currentIndex: currentIndex + 1,
        currentTime: 0,
        duration: queue[currentIndex + 1]?.durationSeconds ?? 0,
        isPlaying: true,
        playSerial: s.playSerial + 1,
      }));
    } else {
      set({ isPlaying: false });
    }
  },

  prev() {
    const { currentIndex, queue, currentTime } = get();
    // If >3s in, restart current track instead of going back.
    if (currentTime > 3 || currentIndex === 0) {
      set((s) => ({ currentTime: 0, playSerial: s.playSerial + 1 }));
      return;
    }
    set((s) => ({
      currentIndex: currentIndex - 1,
      currentTime: 0,
      duration: queue[currentIndex - 1]?.durationSeconds ?? 0,
      isPlaying: true,
      playSerial: s.playSerial + 1,
    }));
  },

  seek(seconds) {
    set((s) => ({ currentTime: seconds, playSerial: s.playSerial + 1 }));
  },

  setVolume(v) {
    set({ volume: Math.min(1, Math.max(0, v)) });
  },

  setCurrentTime(t) {
    set({ currentTime: t });
  },

  setDuration(d) {
    set({ duration: d });
  },

  setIsPlaying(playing) {
    set({ isPlaying: playing });
  },
}));
