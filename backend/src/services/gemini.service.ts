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
   * Checks if an error returned by Gemini or the network is transient (retryable).
   */
  private static isTransientError(error: any): boolean {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || 0;

    return (
      status === 503 ||
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 504 ||
      msg.includes('503') ||
      msg.includes('service unavailable') ||
      msg.includes('high demand') ||
      msg.includes('spikes in demand') ||
      msg.includes('resource has been exhausted') ||
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('overloaded') ||
      msg.includes('econnreset') ||
      msg.includes('socket hang up') ||
      msg.includes('timeout')
    );
  }

  /**
   * Primary model is gemini-2.5-flash, with automatic fallbacks if Google experiences high-demand spikes.
   */
  private static readonly PRIMARY_MODEL = 'gemini-2.5-flash';
  private static readonly FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

  private static getModelCandidates(): string[] {
    const configured = env.GEMINI_MODEL || this.PRIMARY_MODEL;
    return Array.from(new Set([configured, ...this.FALLBACK_MODELS]));
  }

  /**
   * Executes an operation with exponential backoff retries and model fallbacks for transient errors (e.g. 503 Service Unavailable).
   */
  private static async executeWithRetry<T>(
    operationName: string,
    fn: (modelName: string) => Promise<T>
  ): Promise<T> {
    const candidateModels = this.getModelCandidates();
    let lastError: any = null;

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const modelName = candidateModels[mIdx];
      const maxRetriesPerModel = 1; // initial try + 1 retry per model before falling back

      for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
        try {
          return await fn(modelName);
        } catch (error: any) {
          lastError = error;
          const isTransient = this.isTransientError(error);

          console.warn(
            `[GeminiService] ${operationName} failed on model '${modelName}' (attempt ${attempt + 1}/${maxRetriesPerModel + 1}):`,
            error.message || error
          );

          if (!isTransient) {
            // Non-transient error (e.g. invalid request format, auth error)
            break;
          }

          if (attempt < maxRetriesPerModel) {
            // Exponential backoff + jitter before retrying this model
            const backoffMs = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
            await new Promise((res) => setTimeout(res, backoffMs));
          }
        }
      }

      // If we reach here and there is a fallback model, log fallback attempt
      if (mIdx < candidateModels.length - 1) {
        console.warn(
          `[GeminiService] Model '${modelName}' unavailable/overloaded. Falling back to '${candidateModels[mIdx + 1]}' for ${operationName}...`
        );
      }
    }

    this.handleError(lastError);
  }

  /**
   * Generates standard text based on a prompt with auto-retry and model fallback.
   */
  static async generateText(prompt: string, systemInstruction?: string, timeoutMs = 30000): Promise<string> {
    return this.executeWithRetry('Text Generation', async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        safetySettings: defaultSafetySettings,
      });

      const request = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
        },
      });

      const result = await this.withTimeout(request, timeoutMs, `Text Generation (${modelName})`);
      const text = result.response.text();

      if (!text) {
        throw new GeminiError('Received empty response from Gemini', 502);
      }
      return text;
    });
  }

  /**
   * Generates structured JSON based on a prompt and a strict schema with auto-retry and model fallback.
   */
  static async generateJson(prompt: string, schema: Schema, systemInstruction?: string, timeoutMs = 30000): Promise<string> {
    return this.executeWithRetry('JSON Generation', async (modelName) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        safetySettings: defaultSafetySettings,
      });

      const request = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const result = await this.withTimeout(request, timeoutMs, `JSON Generation (${modelName})`);
      const text = result.response.text();

      if (!text) {
        throw new GeminiError('Received empty JSON response from Gemini', 502);
      }
      return text;
    });
  }

  /**
   * Generates a 768-dimensional embedding for the given text with auto-retry.
   * Matches the VECTOR(768) schema in the database.
   */
  static async generateEmbedding(text: string, timeoutMs = 15000): Promise<number[]> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      } catch (error: any) {
        lastError = error;
        if (!this.isTransientError(error) || attempt === maxRetries) {
          break;
        }
        const backoffMs = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    }

    this.handleError(lastError);
  }

  /**
   * Extracts text from an image-based scanned PDF using Gemini's Vision capabilities via File API with auto-retry and model fallback.
   */
  static async extractTextFromImagePdf(fileBuffer: Buffer, timeoutMs = 60000): Promise<string[]> {
    const tempFilePath = path.join(os.tmpdir(), `temp_pdf_${crypto.randomBytes(16).toString('hex')}.pdf`);
    let uploadResponse: any;

    try {
      // 1. Write buffer to temp file
      fs.writeFileSync(tempFilePath, fileBuffer);

      // 2. Upload to Gemini File API
      uploadResponse = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'application/pdf',
        displayName: 'Scanned Document',
      });

      const prompt = `This is a scanned PDF document. Transcribe the full text of this document page by page. Prepend the text of each page exactly with '--- PAGE X ---' where X is the page number. Make sure the transcription is accurate and includes all text. If a page is blank, just write the marker and nothing else.`;

      // 3. Generate content using multimodal capabilities with retry & fallback
      return await this.executeWithRetry('PDF Vision Extraction', async (modelName) => {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings: defaultSafetySettings
        });

        const request = model.generateContent([
          {
            fileData: {
              mimeType: uploadResponse.file.mimeType,
              fileUri: uploadResponse.file.uri,
            }
          },
          { text: prompt },
        ]);

        const result = await this.withTimeout(request, timeoutMs, `PDF Vision Extraction (${modelName})`);
        const text = result.response.text();

        if (!text) {
          throw new GeminiError('Received empty response from Gemini for PDF OCR', 502);
        }

        const pagesStr = text.split(/---\s*PAGE\s+\d+\s*---/i);
        const pages = pagesStr.map(p => p.trim()).filter(p => p.length > 0);

        if (pages.length === 0) {
          throw new GeminiError('Could not parse page markers from Gemini OCR output', 502);
        }

        return pages;
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Clean up uploaded file
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
   * Centralized error handling and user-friendly formatting for Gemini operations.
   */
  private static handleError(error: any): never {
    console.error('[Gemini API Error]', error);

    if (error instanceof GeminiError) {
      throw error;
    }

    const msg = error?.message || '';

    // Check for timeout
    if (error?.name === 'AbortError' || msg.includes('timeout')) {
      throw new GeminiError('The request to Gemini API timed out. Please try again.', 504);
    }

    // Check for high demand / 503 service unavailable
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable')) {
      throw new GeminiError(
        'The AI service is currently experiencing high demand. Please try again in a few moments.',
        503
      );
    }

    // Check rate limit / 429
    if (msg.includes('429') || msg.includes('Resource has been exhausted') || msg.includes('quota')) {
      throw new GeminiError(
        'AI rate limit reached. Please wait a moment before trying again.',
        429
      );
    }

    // Check auth failure
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      throw new GeminiError(
        'Gemini API authentication failed. Please verify your GEMINI_API_KEY environment variable.',
        401
      );
    }

    throw new GeminiError(
      msg || 'An unexpected error occurred while communicating with Gemini API',
      502
    );
  }
}
