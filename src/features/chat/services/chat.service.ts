import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import {
  Conversation,
  CreateConversationDto,
  GetConversationsResponse,
  GetMessagesResponse,
  Message,
  EnableEncryptionDto,
  DisableEncryptionDto,
  EncryptionResult,
} from '../types';

const api = getAxiosInstance();

class ChatService {
  private readonly baseUrl = '/api/conversations'; // El backend usa /api/conversations

  /**
   * Crear o obtener una conversación directa con un usuario
   */
  async createOrGetConversation(participantId: string): Promise<Conversation> {

    try {
    
      const response = await api.post<{
        success: boolean;
        message: string;
        data: Conversation; // El backend devuelve data directamente, no data.conversation
      }>(`${this.baseUrl}`, { // POST /conversations
        participantId,
      } as CreateConversationDto);

      // El interceptor de Axios puede estar desempaquetando la respuesta
      // Intentar acceder directamente si response.data ya es el objeto de conversación
      const conversationData = response.data?.data || response.data;
  
      // El backend devuelve Domain Entity con _id (guion bajo), no id
      const conversationId = conversationData?.id || (conversationData as any)?._id;
      
      if (!conversationData || !conversationId) {
       
        throw new Error('Invalid conversation response from server');
      }
      
      // Normalizar el objeto para que tenga 'id' en lugar de '_id'
      return {
        ...conversationData,
        id: conversationId,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Obtener todas las conversaciones del usuario
   */
  async getConversations(): Promise<Conversation[]> {

    const response = await api.get<{
      success: boolean;
      data: any[]; // Usar any[] porque necesitamos transformar
      count: number;
    }>(`${this.baseUrl}`); 



    if (!response.data.data) {
      return [];
    }

    // Transformar las conversaciones para mapear metadata.is_encrypted a isEncrypted
    const conversations = response.data.data.map((conv: any) => ({
      ...conv,
      isEncrypted: conv.metadata?.is_encrypted || false,
      encryptionEnabledAt: conv.metadata?.encryption_enabled_at || null,
    }));

    //if (conversations.length > 0) {}
    return conversations;
  }

  /**
   * Obtener mensajes de una conversación con paginación
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
    encryptionPassword?: string,
  ): Promise<GetMessagesResponse> {
    console.log(' [CHAT SERVICE] getConversationMessages - Params:', {
      conversationId,
      limit,
      offset,
      hasPassword: !!encryptionPassword,
    });

    // Validación para prevenir llamadas con conversationId undefined/null
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
   
      throw new Error('conversationId es requerido para obtener mensajes');
    }
  
    const url = `${this.baseUrl}/${conversationId}/messages`;
  

    const response = await api.get<{
      success: boolean;
      data: any[]; // Array de mensajes directamente
      pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
      };
    }>(url, {
      params: { 
        limit, 
        offset,
        ...(encryptionPassword && { encryptionPassword }), // Incluir contraseña si existe
      },
    });




    const result = {
      messages: response.data.data, // data es el array de mensajes
      total: response.data.pagination.total,
      limit: response.data.pagination.limit,
      offset: response.data.pagination.offset,
      hasMore: response.data.pagination.hasMore,
    };

 

    return result;
  }

  /**
   * Buscar conversación por ID de participante (para chat directo)
   */
  async findConversationByParticipant(
    participantId: string,
  ): Promise<Conversation | null> {


    const conversations = await this.getConversations();

    
    // Buscar conversación directa que incluya al participante
    const conversation = conversations.find(
      (conv) => {
        // El backend puede devolver 'direct', 'one_to_one' o ConversationType.DIRECT
        const typeValue = (conv.type as any);
        const isDirectOrOneToOne = typeValue === 'direct' || typeValue === 'one_to_one';
        const includesParticipant = conv.participantIds?.includes(participantId);
  
        
        return isDirectOrOneToOne && includesParticipant;
      }
    );



    return conversation || null;
  }

  /**
   * Habilitar encriptación en una conversación
   */
  async enableEncryption(
    conversationId: string,
    data: EnableEncryptionDto,
  ): Promise<EncryptionResult> {
    const response = await api.post<{
      success: boolean;
      data: EncryptionResult;
    }>(`${this.baseUrl}/${conversationId}/encryption/enable`, data);

    return response.data.data;
  }

  /**
   * Deshabilitar encriptación en una conversación
   */
  async disableEncryption(
    conversationId: string,
    data: DisableEncryptionDto,
  ): Promise<EncryptionResult> {
    const response = await api.patch<{
      success: boolean;
      data: EncryptionResult;
    }>(`${this.baseUrl}/${conversationId}/encryption/disable`, data);

    return response.data.data;
  }
}

export const chatService = new ChatService();
