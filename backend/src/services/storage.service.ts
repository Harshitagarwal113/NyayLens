import { supabase } from '../config/supabase';
import { AppError } from '../middlewares/error.middleware';

const BUCKET_NAME = 'documents';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf', // .pdf
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
];

export class StorageError extends Error implements AppError {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'StorageError';
    this.statusCode = statusCode;
  }
}

export class StorageService {
  /**
   * Validates the file buffer and metadata before upload.
   */
  private static validateFile(fileBuffer: Buffer, mimeType: string) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new StorageError(`Unsupported file type: ${mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, 415);
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new StorageError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`, 413);
    }
  }

  /**
   * Uploads a document to the private Supabase Storage bucket.
   * Uses a unique path typically structured as `userId/uuid-filename`.
   */
  static async uploadDocument(
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<string> {
    this.validateFile(fileBuffer, mimeType);

    // Sanitize filename to prevent directory traversal or special character issues
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}-${sanitizedFilename}`;
    const storagePath = `${userId}/${uniqueFileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw new StorageError('Failed to upload document to storage.', 500);
    }

    return storagePath;
  }

  /**
   * Generates a short-lived signed URL for downloading a document.
   * Keeps the bucket private and credentials hidden from the client.
   */
  static async getSignedDownloadUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      console.error('Supabase Storage Signed URL Error:', error);
      throw new StorageError('Failed to generate secure download URL.', 500);
    }

    return data.signedUrl;
  }

  /**
   * Deletes a document from the storage bucket.
   */
  static async deleteDocument(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Supabase Storage Delete Error:', error);
      throw new StorageError('Failed to delete document from storage.', 500);
    }
  }
}
