'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveStreamComment } from '../services/live-stream-comment.service';

interface UseLiveStreamSocketParams {
  streamId: string;
  userId: string;
  username: string;
  enabled?: boolean;
}

interface StreamEvents {
  onCommentCreated?: (comment: LiveStreamComment) => void;
  onReactionAdded?: (reaction: any) => void;
  onReactionRemoved?: (data: { userId: string }) => void;
  onViewerCountUpdate?: (data: { viewerCount: number }) => void;
  onViewerJoined?: (data: { userId: string; username: string }) => void;
  onViewerLeft?: (data: { userId: string }) => void;
  onStreamEnded?: () => void;
}

export function useLiveStreamSocket(
  params: UseLiveStreamSocketParams,
  events: StreamEvents = {}
) {
  const { streamId, userId, username, enabled = true } = params;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!enabled || !streamId || !userId) return;

    // Conectar al namespace de live-streams
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/live-streams`, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      console.log(' Connected to LiveStream socket');
      setIsConnected(true);

      // Unirse al stream
      socket.emit('join_stream', {
        streamId,
        userId,
        username,
      });
    });

    socket.on('disconnect', () => {
      console.log(' Disconnected from LiveStream socket');
      setIsConnected(false);
    });

    // Eventos del stream
    socket.on('comment_created', (data: { comment: LiveStreamComment }) => {
      console.log('💬 New comment:', data.comment);
      events.onCommentCreated?.(data.comment);
    });

    socket.on('reaction_added', (data: { reaction: any }) => {
      console.log('❤️ Reaction added:', data.reaction);
      events.onReactionAdded?.(data.reaction);
    });

    socket.on('reaction_removed', (data: { userId: string }) => {
      console.log('💔 Reaction removed:', data.userId);
      events.onReactionRemoved?.(data);
    });

    socket.on('viewer_count_update', (data: { viewerCount: number }) => {
      console.log('👥 Viewer count:', data.viewerCount);
      setViewerCount(data.viewerCount);
      events.onViewerCountUpdate?.(data);
    });

    socket.on('viewer_joined', (data: { userId: string; username: string }) => {
      console.log('👋 Viewer joined:', data.username);
      events.onViewerJoined?.(data);
    });

    socket.on('viewer_left', (data: { userId: string }) => {
      console.log('👋 Viewer left:', data.userId);
      events.onViewerLeft?.(data);
    });

    socket.on('stream_ended', () => {
      console.log('🛑 Stream ended');
      events.onStreamEnded?.();
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave_stream', { streamId, userId });
        socket.disconnect();
      }
    };
  }, [streamId, userId, username, enabled]);

  return {
    socket: socketRef.current,
    isConnected,
    viewerCount,
  };
}
