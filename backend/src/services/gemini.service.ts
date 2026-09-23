import { GoogleGenerativeAI, Schema, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export class GeminiError extends Error implements AppError {
  statusCode: number;

  constructor(message: string, statusCode: number = 502) {
    super(message);
    this.name = 'GeminiError';
    this.statusCode = statusCode;
  }
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(env.GEMINI_API_KEY);

const defaultSafetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export class GeminiService {
  /**
   * Helper function to wrap Promises with a timeout.
   */
  private static async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new GeminiError(`Gemini API timeout during ${operationName}`, 504));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  /**
   * Generates standard text based on a prompt.
   * Uses gemini-1.5-pro for high-quality reasoning.
   */
  static async generateText(prompt: string, systemInstruction?: string, timeoutMs = 30000): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction,
        safetySettings: defaultSafetySettings,
      });

      const request = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
        },
      });

      const result = await this.withTimeout(request, timeoutMs, 'Text Generation');
      const text = result.response.text();
      
      if (!text) {
        throw new GeminiError('Received empty response from Gemini', 502);
      }
      return text;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generates structured JSON based on a prompt and a strict schema.
   * Enforces the `responseMimeType: application/json` constraint.
   */
  static async generateJson(prompt: string, schema: Schema, systemInstruction?: string, timeoutMs = 30000): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction,
        safetySettings: defaultSafetySettings,
      });

      const request = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // low temperature for consistent JSON output
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const result = await this.withTimeout(request, timeoutMs, 'JSON Generation');
      const text = result.response.text();
      
      if (!text) {
        throw new GeminiError('Received empty JSON response from Gemini', 502);
      }
      return text;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generates a 768-dimensional embedding for the given text.
   * Matches the VECTOR(768) schema in the database.
   */
  static async generateEmbedding(text: string, timeoutMs = 15000): Promise<number[]> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
      const request = model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        outputDimensionality: 768,
      } as any);
      
      const result = await this.withTimeout(request, timeoutMs, 'Embedding Generation');
      const embedding = result.embedding.values;
      
      if (!embedding || embedding.length === 0) {
        throw new GeminiError('Failed to generate embedding array', 502);
      }
      return embedding;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Extracts text from an image-based scanned PDF using Gemini's Vision capabilities via File API.
   */
  static async extractTextFromImagePdf(fileBuffer: Buffer, timeoutMs = 60000): Promise<string[]> {
    const tempFilePath = path.join(os.tmpdir(), `temp_pdf_${crypto.randomBytes(16).toString('hex')}.pdf`);
    let uploadResponse;

    try {
      // 1. Write buffer to temp file
      fs.writeFileSync(tempFilePath, fileBuffer);

      // 2. Upload to Gemini File API
      uploadResponse = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'application/pdf',
        displayName: 'Scanned Document',
      });

      // 3. Generate content using multimodal capabilities
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        safetySettings: defaultSafetySettings
      });
      
      const prompt = `This is a scanned PDF document. Transcribe the full text of this document page by page. Prepend the text of each page exactly with '--- PAGE X ---' where X is the page number. Make sure the transcription is accurate and includes all text. If a page is blank, just write the marker and nothing else.`;

      const request = model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          }
        },
        { text: prompt },
      ]);

      const result = await this.withTimeout(request, timeoutMs, 'PDF Vision Extraction');
      const text = result.response.text();

      // 4. Parse output by page markers
      if (!text) {
        throw new GeminiError('Received empty response from Gemini for PDF OCR', 502);
      }

      // We expect markers like "--- PAGE 1 ---"
      // Split the text based on the regex
      const pagesStr = text.split(/---\s*PAGE\s+\d+\s*---/i);
      
      // The first element might be empty space before the first marker.
      const pages = pagesStr.map(p => p.trim()).filter(p => p.length > 0);

      if (pages.length === 0) {
        throw new GeminiError('Could not parse page markers from Gemini OCR output', 502);
      }

      return pages;

    } catch (error) {
      this.handleError(error);
      throw error; // TS compiler satisfaction
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      // Optionally delete file from Gemini to save space/privacy
      if (uploadResponse?.file?.name) {
        try {
          await fileManager.deleteFile(uploadResponse.file.name);
        } catch (e) {
          console.error('[Gemini API] Failed to delete temp file from Gemini:', e);
        }
      }
    }
  }

  /**
   * Centralized error handling and logging for Gemini operations.
   */
  private static handleError(error: any): never {
    console.error('[Gemini API Error]', error);

    if (error instanceof GeminiError) {
      throw error;
    }
    
    // Check if it's an SDK-level error or fetch error
    if (error.name === 'AbortError' || (error.message && error.message.includes('timeout'))) {
      throw new GeminiError('The request to Gemini API timed out', 504);
    }

    throw new GeminiError(
      error.message || 'An unexpected error occurred while communicating with Gemini API',
      502
    );
  }
}
