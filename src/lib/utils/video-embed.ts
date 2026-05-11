export type VideoEmbedProvider = 'youtube' | 'vimeo';

export interface VideoEmbed {
  provider: VideoEmbedProvider;
  videoId: string;
  normalizedUrl: string;
  embedSrc: string;
  thumbnailUrl: string | null;
}

/** Parse a YouTube or Vimeo URL into its provider, id, and an iframe-friendly
 *  embed URL. Returns null when the URL is unrecognised. */
export function parseVideoEmbed(input: string): VideoEmbed | null {
  const url = input.trim();
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    if (!isValidYouTubeId(id)) return null;
    return youtubeEmbed(id);
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v') ?? '';
      if (!isValidYouTubeId(id)) return null;
      return youtubeEmbed(id);
    }
    const shortsMatch = parsed.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/);
    if (shortsMatch && isValidYouTubeId(shortsMatch[1])) {
      return youtubeEmbed(shortsMatch[1]);
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const segments = parsed.pathname.split('/').filter(Boolean);
    const id = segments.find((s) => /^\d+$/.test(s));
    if (!id) return null;
    return {
      provider: 'vimeo',
      videoId: id,
      normalizedUrl: `https://vimeo.com/${id}`,
      embedSrc: `https://player.vimeo.com/video/${id}`,
      thumbnailUrl: null,
    };
  }

  return null;
}

function isValidYouTubeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{6,15}$/.test(id);
}

function youtubeEmbed(id: string): VideoEmbed {
  return {
    provider: 'youtube',
    videoId: id,
    normalizedUrl: `https://www.youtube.com/watch?v=${id}`,
    embedSrc: `https://www.youtube.com/embed/${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}
