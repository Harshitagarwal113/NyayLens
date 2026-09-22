export class ChunkingService {
  /**
   * Chunks document pages into smaller segments for embedding and RAG.
   * Uses a sliding window with overlap for context preservation.
   *
   * @param pages The inserted document pages containing their DB IDs and text
   * @param maxChunkSize The maximum character length of a chunk (default: 1000)
   * @param overlap The number of characters to overlap between chunks (default: 200)
   * @returns An array of chunk objects ready for database insertion
   */
  static chunkDocumentPages(
    pages: { id: string; document_id: string; text_content: string }[],
    maxChunkSize: number = 1000,
    overlap: number = 200
  ) {
    const chunks: { document_id: string; page_id: string; chunk_index: number; text_content: string }[] = [];
    let globalChunkIndex = 0;

    for (const page of pages) {
      // Basic whitespace normalization to prevent awkward chunks
      const cleanText = page.text_content.replace(/\s+/g, ' ').trim();
      
      if (!cleanText) continue;

      let startIndex = 0;
      
      while (startIndex < cleanText.length) {
        // Extract chunk up to maxChunkSize
        let endIndex = startIndex + maxChunkSize;
        
        // If we're not at the end of the text, try to find a natural sentence break
        if (endIndex < cleanText.length) {
          // Look backwards for a period within the last 150 chars to avoid breaking sentences
          const lookbehindIndex = cleanText.lastIndexOf('.', endIndex);
          if (lookbehindIndex > startIndex + (maxChunkSize - 150)) {
            endIndex = lookbehindIndex + 1; // Include the period
          } else {
            // Fallback to breaking at the last space if no period is found
            const spaceIndex = cleanText.lastIndexOf(' ', endIndex);
            if (spaceIndex > startIndex) {
              endIndex = spaceIndex;
            }
          }
        }
        
        const chunkText = cleanText.substring(startIndex, endIndex).trim();
        
        if (chunkText.length > 0) {
          chunks.push({
            document_id: page.document_id,
            page_id: page.id,
            chunk_index: globalChunkIndex++,
            text_content: chunkText,
          });
        }
        
        // Slide the window forward, preserving the overlap
        const prevStartIndex = startIndex;
        startIndex = endIndex - overlap;
        
        // Prevent infinite loop if we didn't advance
        if (startIndex <= prevStartIndex) {
          startIndex = endIndex; 
        }
      }
    }

    return chunks;
  }
}
