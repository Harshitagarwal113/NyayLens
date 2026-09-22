import { DocumentRepository } from '../repositories/document.repository';
import { PdfService } from './pdf.service';
import { ChunkingService } from './chunking.service';
import { GeminiService, GeminiError } from './gemini.service';

export class DocumentProcessingService {
  /**
   * Orchestrates the entire processing pipeline for a document safely and idempotently.
   * Extract -> Chunk -> Embed
   * 
   * This service is designed to be retry-safe. If it fails midway, running it again
   * will pick up exactly where it left off by checking existing DB states.
   */
  static async processDocument(documentId: string, fileBuffer: Buffer) {
    try {
      await DocumentRepository.updateDocumentStatus(documentId, 'processing');

      // 1. EXTRACTION
      let pages = await DocumentRepository.getDocumentPages(documentId);
      
      if (!pages || pages.length === 0) {
        console.log(`[Processing] Extracting PDF pages for document ${documentId}...`);
        const extractedTexts = await PdfService.extractTextByPage(fileBuffer);
        
        const pageRecords = extractedTexts.map((text, index) => ({
          document_id: documentId,
          page_number: index + 1,
          text_content: text,
        }));
        
        pages = await DocumentRepository.createDocumentPages(pageRecords);
      } else {
        console.log(`[Processing] Skipping extraction, found ${pages.length} pages for document ${documentId}.`);
      }
      
      // 2. CHUNKING
      let chunks = await DocumentRepository.getDocumentChunks(documentId);
      
      if (!chunks || chunks.length === 0) {
        if (pages && pages.length > 0) {
          console.log(`[Processing] Chunking pages for document ${documentId}...`);
          const generatedChunks = ChunkingService.chunkDocumentPages(pages);
          if (generatedChunks.length > 0) {
            chunks = await DocumentRepository.createDocumentChunks(generatedChunks);
          }
        }
      } else {
        console.log(`[Processing] Skipping chunking, found ${chunks.length} chunks for document ${documentId}.`);
      }

      // 3. EMBEDDING
      const chunksToEmbed = await DocumentRepository.getChunksWithoutEmbeddings(documentId);
      
      if (chunksToEmbed && chunksToEmbed.length > 0) {
        console.log(`[Processing] Generating embeddings for ${chunksToEmbed.length} chunks...`);
        
        for (const chunk of chunksToEmbed) {
          try {
            // Very primitive rate limiting/spacing
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const embedding = await GeminiService.generateEmbedding(chunk.text_content);
            await DocumentRepository.updateChunkEmbedding(chunk.id, embedding);
            
          } catch (embedError) {
            console.error(`[Processing] Failed to embed chunk ${chunk.id}:`, embedError);
            
            // If it's a known Gemini timeout/server error, fail early to avoid blowing through quotas or hanging
            if (embedError instanceof GeminiError && [502, 504, 429].includes(embedError.statusCode)) {
              throw embedError;
            }
          }
        }
      } else {
         console.log(`[Processing] Skipping embeddings, all chunks are embedded for document ${documentId}.`);
      }

      console.log(`[Processing] Successfully processed document ${documentId}.`);
      await DocumentRepository.updateDocumentStatus(documentId, 'processed');

    } catch (error) {
      console.error(`[Processing] Error processing document ${documentId}:`, error);
      await DocumentRepository.updateDocumentStatus(documentId, 'failed_processing');
      throw error;
    }
  }
}
