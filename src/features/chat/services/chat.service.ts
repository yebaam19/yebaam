import { insforge } from '@/lib/insforge/client';
import {
  Conversation,
  GetMessagesResponse,
  EnableEncryptionDto,
  DisableEncryptionDto,
  EncryptionResult,
  Message,
  MessageMedia,
} from '../types';

function channelForConversation(conversationId: string): string {
  return `chat:conv:${conversationId}`;
}

type JsonRecord = Record<string, unknown>;

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  // PostgREST returns 503 "Could not query the database for the schema cache"
  // during Postgres crash recovery and brief restarts. Retry a few times
  // before surfacing the error so the UI doesn't flicker on transient blips.
  const method = (init?.method ?? 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  const maxAttempts = isIdempotent ? 4 : 1;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
        credentials: 'same-origin',
      });
    } catch (err) {
      const networkError =
        err instanceof Error
          ? err
          : new Error('Network error while contacting chat API');
      if (!isIdempotent || attempt === maxAttempts - 1) {
        throw new Error(networkError.message || 'Network error while contacting chat API');
      }
      lastError = networkError;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      continue;
    }

    if (response.ok) {
      const payload = (await response.json().catch(() => ({}))) as JsonRecord;
      return payload as T;
    }

    // The body may be HTML (openresty 502) or JSON ({ error }) — try JSON,
    // fall back to the status text so we never surface raw HTML to the UI.
    const rawText = await response.text().catch(() => '');
    let parsedError: string | null = null;
    try {
      const json = JSON.parse(rawText) as { error?: string };
      parsedError = json?.error ?? null;
    } catch {
      // not JSON
    }
    const message = parsedError || `Request failed (${response.status})`;

    const retriable =
      isIdempotent &&
      (response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        /schema cache|recovery mode|bad gateway/i.test(message) ||
        /schema cache|recovery mode|bad gateway/i.test(rawText));
    if (!retriable || attempt === maxAttempts - 1) {
      throw new Error(message);
    }
    lastError = new Error(message);
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastError ?? new Error('Network request failed');
}

class ChatService {
  private readonly baseUrl = '/api/conversations';

  async createOrGetConversation(participantId: string): Promise<Conversation> {
    const payload = await jsonFetch<{ data: Conversation }>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
    if (!payload?.data?.id) {
      throw new Error('Invalid conversation response from server');
    }
    return {
      ...payload.data,
      createdAt: new Date(payload.data.createdAt as unknown as string),
      updatedAt: new Date(payload.data.updatedAt as unknown as string),
    };
  }

  async getConversations(): Promise<Conversation[]> {
    const payload = await jsonFetch<{ data: Conversation[] }>(this.baseUrl, {
      method: 'GET',
    });
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
    encryptionPassword?: string,
  ): Promise<GetMessagesResponse> {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      throw new Error('conversationId es requerido para obtener mensajes');
    }

    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (encryptionPassword) params.set('encryptionPassword', encryptionPassword);

    const payload = await jsonFetch<{
      data: GetMessagesResponse['messages'];
      pagination: { limit: number; offset: number; total: number; hasMore: boolean };
    }>(`${this.baseUrl}/${conversationId}/messages?${params.toString()}`, {
      method: 'GET',
    });

    return {
      messages: payload.data ?? [],
      total: payload.pagination?.total ?? 0,
      limit: payload.pagination?.limit ?? limit,
      offset: payload.pagination?.offset ?? offset,
      hasMore: Boolean(payload.pagination?.hasMore),
    };
  }

  async sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
    media?: MessageMedia,
  ): Promise<Message> {
    const payload = await jsonFetch<{ data: Message }>(
      `${this.baseUrl}/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, replyToId, media }),
      },
    );
    if (!payload?.data?.id) {
      throw new Error('Invalid message response from server');
    }
    const saved = { ...payload.data, conversationId } as Message;

    // Broadcast to other subscribers via InsForge realtime so the chat
    // sidebar and open conversation windows of other participants update
    // live without polling.
    try {
      await insforge.realtime.publish(channelForConversation(conversationId), 'message.created', {
        message: saved,
        conversationId,
      });
    } catch (err) {
      // Realtime delivery is best-effort — the message is already persisted.
      console.warn('[ChatService] realtime publish failed', err);
    }

    return saved;
  }

  async findConversationByParticipant(
    participantId: string,
  ): Promise<Conversation | null> {
    const payload = await jsonFetch<{ data: Conversation | null }>(
      `${this.baseUrl}/by-participant/${encodeURIComponent(participantId)}`,
      { method: 'GET' },
    );
    if (!payload?.data?.id) return null;
    return {
      ...payload.data,
      createdAt: new Date(payload.data.createdAt as unknown as string),
      updatedAt: new Date(payload.data.updatedAt as unknown as string),
    };
  }

  async enableEncryption(
    _conversationId: string,
    _data: EnableEncryptionDto,
  ): Promise<EncryptionResult> {
    throw new Error('Encryption is not yet available on this backend.');
  }

  async disableEncryption(
    _conversationId: string,
    _data: DisableEncryptionDto,
  ): Promise<EncryptionResult> {
    throw new Error('Encryption is not yet available on this backend.');
  }
}

export const chatService = new ChatService();
