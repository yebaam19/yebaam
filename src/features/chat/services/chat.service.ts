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
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'same-origin',
  });

  const payload = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    const message = (payload as { error?: string }).error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

class ChatService {
  private readonly baseUrl = '/api/conversations';

  async createOrGetConversation(participantId: string): Promise<Conversation> {
    const { data: userRes, error: userErr } = await insforge.auth.getCurrentUser();
    if (userErr || !userRes?.user?.id) {
      throw new Error('You must be signed in to start a conversation');
    }
    const userId = userRes.user.id;
    if (participantId === userId) {
      throw new Error('Cannot start a conversation with yourself');
    }

    const { data: myParts } = await insforge.database
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    const myConvIds = ((myParts ?? []) as { conversation_id: string }[]).map(
      (r) => r.conversation_id,
    );

    if (myConvIds.length > 0) {
      const { data: shared } = await insforge.database
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', participantId)
        .in('conversation_id', myConvIds);

      const sharedIds = ((shared ?? []) as { conversation_id: string }[]).map(
        (r) => r.conversation_id,
      );

      if (sharedIds.length > 0) {
        const { data: directs } = await insforge.database
          .from('conversations')
          .select('*')
          .in('id', sharedIds)
          .eq('type', 'direct');

        const existing = ((directs ?? []) as Array<{
          id: string;
          type: string;
          name: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        }>)[0];

        if (existing) {
          return {
            id: existing.id,
            type: existing.type as Conversation['type'],
            name: existing.name,
            avatar: existing.avatar,
            participantIds: [userId, participantId],
            lastMessage: null,
            unreadCount: 0,
            lastReadAt: null,
            createdAt: new Date(existing.created_at),
            updatedAt: new Date(existing.updated_at),
            isEncrypted: false,
            encryptionEnabledAt: null,
          };
        }
      }
    }

    const { data: created, error: createErr } = await insforge.database
      .from('conversations')
      .insert({ type: 'direct' })
      .select('*')
      .maybeSingle();

    if (createErr || !created) {
      throw new Error(createErr?.message ?? 'Failed to create conversation');
    }

    const conv = created as {
      id: string;
      type: string;
      name: string | null;
      avatar: string | null;
      created_at: string;
      updated_at: string;
    };

    const { error: partErr } = await insforge.database
      .from('conversation_participants')
      .insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: participantId },
      ]);

    if (partErr) {
      throw new Error(partErr.message);
    }

    return {
      id: conv.id,
      type: conv.type as Conversation['type'],
      name: conv.name,
      avatar: conv.avatar,
      participantIds: [userId, participantId],
      lastMessage: null,
      unreadCount: 0,
      lastReadAt: null,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      isEncrypted: false,
      encryptionEnabledAt: null,
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
    const conversations = await this.getConversations();
    const conversation = conversations.find((conv) => {
      const typeValue = conv.type as unknown as string;
      const isDirectOrOneToOne = typeValue === 'direct' || typeValue === 'one_to_one';
      const includesParticipant = conv.participantIds?.includes(participantId);
      return isDirectOrOneToOne && includesParticipant;
    });
    return conversation || null;
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
