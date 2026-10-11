export interface LiveStream {
  _id: string;
  title: string;
  description?: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
  playbackUrl: string;
  stats: {
    viewerCount: number;
    peakViewerCount: number;
  };
  createdAt: string;
}

export interface RecordedStream {
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

export interface RecordedStreamsResponse {
  streams: RecordedStream[];
  pagination?: { hasMore: boolean; nextCursor?: string };
}
