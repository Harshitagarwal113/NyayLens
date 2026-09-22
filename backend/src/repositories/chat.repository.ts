import { supabase } from '../config/supabase';

export class ChatRepository {
  static async createConversation(userId: string, documentId: string, title: string) {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: userId, document_id: documentId, title }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getLatestConversation(userId: string, documentId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async addMessage(conversationId: string, role: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, role, content }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createCitations(citations: { message_id: string; document_chunk_id: string }[]) {
    const { data, error } = await supabase
      .from('citations')
      .insert(citations)
      .select();

    if (error) throw error;
    return data;
  }
}
