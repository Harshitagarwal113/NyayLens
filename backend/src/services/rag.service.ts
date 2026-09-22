import { DocumentRepository } from '../repositories/document.repository';
import { VectorRepository } from '../repositories/vector.repository';
import { GeminiService } from './gemini.service';
import { AppError } from '../middlewares/error.middleware';

export class RagService {
  /**
   * Retrieves relevant context from a document based on a user's question.
   *
   * @param userId The ID of the authenticated user requesting the search.
   * @param documentId The ID of the document to search within.
   * @param question The user's query string.
   * @param topK The number of chunks to retrieve (configurable).
   * @param matchThreshold Minimum cosine similarity threshold (0 to 1).
   * @returns Array of chunks with similarity scores and page metadata.
   */
  static async retrieveContext(
    userId: string,
    documentId: string,
    question: string,
    topK: number = 5,
    matchThreshold: number = 0.5
  ) {
    if (!question || question.trim() === '') {
      throw { statusCode: 400, message: 'Question cannot be empty' } as AppError;
    }

    // 1. Enforce user ownership
    // By providing both documentId and userId, DocumentRepository ensures the user owns it.
    // If the document doesn't exist or is not owned by the user, this throws a 404 or similar error.
    const document = await DocumentRepository.getDocumentById(documentId, userId);
    
    if (!document) {
      throw { statusCode: 404, message: 'Document not found or unauthorized' } as AppError;
    }

    // Ensure the document has finished processing
    if (document.status !== 'processed') {
      throw { statusCode: 409, message: 'Document is still processing or failed. Search is unavailable.' } as AppError;
    }

    // 2. Generate embedding for the question
    const queryEmbedding = await GeminiService.generateEmbedding(question);

    // 3. Perform vector similarity search
    const similarChunks = await VectorRepository.searchSimilarChunks(
      documentId,
      queryEmbedding,
      topK,
      matchThreshold
    );

    // 4. Resolve exact page numbers for each chunk
    const pageIds: string[] = Array.from(new Set(similarChunks.map((c: any) => String(c.page_id))));
    const pageNumberMap = await DocumentRepository.getPageNumbersByPageIds(pageIds);

    // 5. Return ranked context with resolved page numbers
    return similarChunks.map((c: any) => ({
      ...c,
      page_number: pageNumberMap[c.page_id] || 1 // Fallback to page 1 if not found
    }));
  }
}
