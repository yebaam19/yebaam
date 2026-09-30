'use client';

import { getTrackPlayUrl } from '../actions/playback.actions';
import { MusicAudioUrlCache } from './audio-url-cache';

export const musicAudioUrls = new MusicAudioUrlCache(async (trackId) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      getTrackPlayUrl(trackId),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Audio signing timed out')), 15_000);
      }),
    ]);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  } finally {
    clearTimeout(timer);
  }
});
