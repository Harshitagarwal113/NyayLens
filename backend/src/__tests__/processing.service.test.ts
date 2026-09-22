import { DocumentProcessingService } from '../services/processing.service';
import { supabase } from '../config/supabase';
import { PdfService } from '../services/pdf.service';
import { ChunkingService } from '../services/chunking.service';
import { GeminiService } from '../services/gemini.service';
import { DocumentRepository } from '../repositories/document.repository';

jest.mock('../services/pdf.service');
jest.mock('../services/chunking.service');
jest.mock('../repositories/document.repository');

describe('DocumentProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully orchestrate extraction, chunking, and embedding', async () => {
    // 1. Mock DB calls on the repository directly to simplify the test logic
    (DocumentRepository.updateDocumentStatus as jest.Mock).mockResolvedValue(true);
    (DocumentRepository.getDocumentPages as jest.Mock).mockResolvedValue([]); // Empty to trigger extraction
    (DocumentRepository.createDocumentPages as jest.Mock).mockResolvedValue([{ id: 'page-1', document_id: 'doc-1', text_content: 'Page 1 content' }]);
    
    (DocumentRepository.getDocumentChunks as jest.Mock).mockResolvedValue([]); // Empty to trigger chunking
    (DocumentRepository.createDocumentChunks as jest.Mock).mockResolvedValue([{ id: 'chunk-1' }]);
    
    (DocumentRepository.getChunksWithoutEmbeddings as jest.Mock).mockResolvedValue([
      { id: 'chunk-1', text_content: 'Page 1 content chunk' }
    ]);
    (DocumentRepository.updateChunkEmbedding as jest.Mock).mockResolvedValue(true);

    // 2. Mock Storage download
    (supabase.storage.from as jest.Mock).mockReturnValue({
      download: jest.fn().mockResolvedValue({ data: new Blob(['dummy pdf data']), error: null })
    });

    // 3. Mock Extractor
    (PdfService.extractTextByPage as jest.Mock).mockResolvedValue([
      'Page 1 content'
    ]);

    // 4. Mock Chunking
    (ChunkingService.chunkDocumentPages as jest.Mock).mockReturnValue([
      { document_id: 'doc-1', page_id: 'page-1', chunk_index: 0, text_content: 'Page 1 content chunk' }
    ]);

    // 5. Mock Embedding
    (GeminiService.generateEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);

    // Run the pipeline
    await DocumentProcessingService.processDocument('doc-1', Buffer.from('dummy'));

    // Expectations
    expect(PdfService.extractTextByPage).toHaveBeenCalled();
    expect(ChunkingService.chunkDocumentPages).toHaveBeenCalled();
    expect(GeminiService.generateEmbedding).toHaveBeenCalled();
    
    // Verify it updated status to 'processed'
    expect(DocumentRepository.updateDocumentStatus).toHaveBeenCalledWith('doc-1', 'processed');
  });
});
