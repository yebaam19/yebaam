import { getAxiosInstance } from '@/lib/axios/axiosInstance';

const axios = getAxiosInstance();

export interface LiveStreamChannel {
  channelArn: string;
  name: string;
  latencyMode: string;
  type: string;
  ingestEndpoint: string;
  playbackUrl: string;
}

export interface LiveStreamStatus {
  isLive: boolean;
  health?: string;
  viewerCount?: number;
  startTime?: string;
}

export interface StartLiveStreamRequest {
  title: string;
  description?: string;
  privacy: 'public' | 'friends' | 'private';
}

export interface StartLiveStreamResponse {
  success: boolean;
  liveStream: {
    id: string;
    channelArn: string;
    playbackUrl: string;
    rtmpsUrl: string; // Para OBS/FFmpeg
    status: string;
  };
}

export const liveStreamService = {
  // Obtener información del canal IVS
  async getChannelInfo(): Promise<LiveStreamChannel> {
    const response = await axios.get('/api/live-streams/channel');
    return response.data;
  },

  // Obtener estado actual del stream
  async getStreamStatus(): Promise<LiveStreamStatus> {
    const response = await axios.get('/api/live-streams/status');
    return response.data;
  },

  // Iniciar una transmisión en vivo
  async startLiveStream(data: StartLiveStreamRequest): Promise<StartLiveStreamResponse> {
    const response = await axios.post('/api/live-streams/start', data);
    return response.data;
  },

  // Finalizar transmisión en vivo
  async endLiveStream(streamId: string) {
    const response = await axios.post(`/api/live-streams/${streamId}/end`);
    return response.data;
  },

  // Obtener streams activos
  async getActiveStreams() {
    const response = await axios.get('/api/live-streams/active');
    return response.data;
  },

  // Obtener streams grabados
  async getRecordedStreams(limit: number = 20, cursor?: string) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
      params.append('cursor', cursor);
    }
    const response = await axios.get(`/api/live-streams/recorded?${params.toString()}`);
    return response.data;
  },

  // Unirse a un stream como espectador
  async joinStream(streamId: string) {
    const response = await axios.post(`/live-streams/${streamId}/join`);
    return response.data;
  },
};
