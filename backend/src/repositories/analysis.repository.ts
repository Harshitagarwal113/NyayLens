import { supabase } from '../config/supabase';

export class AnalysisRepository {
  static async createAnalysis(documentId: string, analysisData: any) {
    const { data, error } = await supabase
      .from('document_analyses')
      .upsert(
        {
          document_id: documentId,
          ...analysisData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'document_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAnalysisByDocumentId(documentId: string) {
    const { data, error } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
