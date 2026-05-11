'use client';

import { create } from 'zustand';
import type { MusicMediaItem } from '../../types/music-media.types';

type MediaPlayerMode = 'closed' | 'mini' | 'lightbox';

interface MediaPlayerState {
  item: MusicMediaItem | null;
  mode: MediaPlayerMode;
  /** Open the full-screen lightbox for `item`. */
  openLightbox(item: MusicMediaItem): void;
  /** Open the floating mini-player for `item` (autoplay). */
  openMini(item: MusicMediaItem): void;
  /** Move the currently-open lightbox into the mini-player without unmounting
   *  the iframe is best-effort; YouTube/Vimeo resume natively, CF Stream
   *  restarts. */
  minimize(): void;
  /** Move the currently-open mini-player back into the lightbox. */
  expand(): void;
  close(): void;
}

export const useMediaPlayerStore = create<MediaPlayerState>((set) => ({
  item: null,
  mode: 'closed',

  openLightbox(item) {
    set({ item, mode: 'lightbox' });
  },

  openMini(item) {
    set({ item, mode: 'mini' });
  },

  minimize() {
    set((s) => (s.item ? { mode: 'mini' } : { mode: 'closed' }));
  },

  expand() {
    set((s) => (s.item ? { mode: 'lightbox' } : { mode: 'closed' }));
  },

  close() {
    set({ item: null, mode: 'closed' });
  },
}));
