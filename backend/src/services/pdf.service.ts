const pdf = require('pdf-parse');
import { AppError } from '../middlewares/error.middleware';
import { GeminiService } from './gemini.service';

export class PdfProcessingError extends Error implements AppError {
  statusCode: number;

  constructor(message: string, statusCode: number = 422) {
    super(message);
    this.name = 'PdfProcessingError';
    this.statusCode = statusCode;
  }
}

export class PdfService {
  /**
   * Extracts text from a PDF buffer page by page.
   * Throws specific errors for empty, scanned, or corrupted PDFs.
   * 
   * @param fileBuffer The raw PDF file buffer
   * @returns Array of strings, where each element is the text content of a page
   */
  static async extractTextByPage(fileBuffer: Buffer): Promise<string[]> {
    const pages: string[] = [];

    const renderPage = (pageData: any) => {
      const renderOptions = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
      };
      
      return pageData.getTextContent(renderOptions).then((textContent: any) => {
        let lastY, text = '';
        for (const item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        
        pages.push(text.trim());
        return text;
      });
    };

    try {
      // pdf-parse will invoke our renderPage hook for every page it encounters
      await pdf(fileBuffer, { pagerender: renderPage });
      
      if (pages.length === 0) {
        throw new PdfProcessingError('The uploaded PDF appears to be completely empty.', 422);
      }

      // Check if it's a scanned PDF without embedded text (all pages are empty strings or just whitespace)
      const isScannedWithoutText = pages.every(page => page.replace(/\s/g, '') === '');
      if (isScannedWithoutText) {
        console.log('[PdfService] Scanned PDF detected. Falling back to Gemini OCR...');
        return await GeminiService.extractTextFromImagePdf(fileBuffer);
      }

      return pages;
    } catch (error) {
      if (error instanceof PdfProcessingError) {
        throw error;
      }
      console.error('PDF Parsing Exception:', error);
      throw new PdfProcessingError('Failed to parse the PDF. The file may be corrupted or encrypted.', 422);
    }
  }
}
