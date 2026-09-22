import { supabase } from '../config/supabase';

export class DocumentRepository {
  static async createDocument(userId: string, filename: string, storagePath: string) {
    const { data, error } = await supabase
      .from('documents')
      .insert([{ user_id: userId, filename, storage_path: storagePath }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getDocumentsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createDocumentPages(pages: { document_id: string; page_number: number; text_content: string }[]) {
    const { data, error } = await supabase
      .from('document_pages')
      .insert(pages)
      .select();

    if (error) throw error;
    return data;
  }

  static async createDocumentChunks(chunks: { document_id: string; page_id: string; chunk_index: number; text_content: string }[]) {
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunks)
      .select();

    if (error) throw error;
    return data;
  }

  static async getDocumentPages(documentId: string) {
    const { data, error } = await supabase
      .from('document_pages')
      .select('*')
      .eq('document_id', documentId)
      .order('page_number', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getDocumentChunks(documentId: string) {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getChunksWithoutEmbeddings(documentId: string) {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('id, text_content')
      .eq('document_id', documentId)
      .is('embedding', null)
      .order('chunk_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async updateChunkEmbedding(chunkId: string, embedding: number[]) {
    const { error } = await supabase
      .from('document_chunks')
      .update({ embedding })
      .eq('id', chunkId);

    if (error) throw error;
  }

  static async getDocumentById(documentId: string, userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateDocumentStatus(documentId: string, status: string) {
    const { data, error } = await supabase
      .from('documents')
      .update({ status })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateDocumentMetadata(documentId: string, newMetadataFields: any) {
    const { data: doc } = await supabase.from('documents').select('metadata').eq('id', documentId).single();
    const currentMetadata = doc?.metadata || {};
    
    const { data, error } = await supabase
      .from('documents')
      .update({ metadata: { ...currentMetadata, ...newMetadataFields } })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }


  static async deleteDocument(documentId: string, userId: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async getPageNumbersByPageIds(pageIds: string[]) {
    if (!pageIds || pageIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('document_pages')
      .select('id, page_number')
      .in('id', pageIds);

    if (error) throw error;
    
    const map: Record<string, number> = {};
    data.forEach(page => {
      map[page.id] = page.page_number;
    });
    return map;
  }
}
