import { supabase } from '../config/supabase';

export class VectorRepository {
  /**
   * Search for document chunks similar to a given embedding.
   * Note: This assumes a PostgreSQL function `match_document_chunks` is created.
   * If you prefer pure PostgREST filtering without RPC, ensure you have the pgvector extensions mapped correctly.
   */
  static async searchSimilarChunks(documentId: string, embedding: number[], limit: number = 5, threshold: number = 0.7) {
    // In Supabase, similarity search is typically done via an RPC call to a custom plpgsql function
    // that uses pgvector's `<=>` operator for cosine distance.
    // Example function:
    // create function match_document_chunks(query_embedding vector(768), match_threshold float, match_count int, filter_document_id uuid)
    
    // Supabase pgvector RPC needs array format string sometimes, but array of numbers works with supabase-js v2
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_document_id: documentId
    });

    if (error) throw error;
    return data;
  }
}
