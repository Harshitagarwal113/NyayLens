import { DocumentRepository } from '../repositories/document.repository';
import { StorageService } from './storage.service';
import { AppError } from '../middlewares/error.middleware';
import { DocumentProcessingService } from './processing.service';

export class DocumentService {
  static async uploadDocument(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw { statusCode: 400, message: 'No file provided' } as AppError;
    }

    // 1. Upload to Supabase Storage
    const storagePath = await StorageService.uploadDocument(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // 2. Save metadata in the database (status starts as 'processing')
    const document = await DocumentRepository.createDocument(userId, file.originalname, storagePath);

    // 3. Fire and forget the embedding pipeline
    if (file.mimetype === 'application/pdf') {
       // Run entirely asynchronously in the background so the user gets an immediate API response
       DocumentProcessingService.processDocument(document.id, file.buffer).catch(err => {
         console.error(`[Background] Failed to process document ${document.id}:`, err);
       });
    } else {
       await DocumentRepository.updateDocumentStatus(document.id, 'processed');
    }

    return document;
  }

  static async getDocuments(userId: string) {

    return await DocumentRepository.getDocumentsByUserId(userId);
  }

  static async getDocumentById(documentId: string, userId: string) {

    const document = await DocumentRepository.getDocumentById(documentId, userId);
    
    if (!document) {
      throw { statusCode: 404, message: 'Document not found or unauthorized' } as AppError;
    }

    // Optionally generate a signed URL so the frontend can download it
    const downloadUrl = await StorageService.getSignedDownloadUrl(document.storage_path);

    return { ...document, downloadUrl };
  }

  static async deleteDocument(documentId: string, userId: string) {
    const document = await DocumentRepository.getDocumentById(documentId, userId);
    
    if (!document) {
      throw { statusCode: 404, message: 'Document not found or unauthorized' } as AppError;
    }

    // 1. Delete from Supabase Storage
    await StorageService.deleteDocument(document.storage_path);

    // 2. Delete from database (Cascade deletes chunks, clauses, etc. via FK constraints)
    await DocumentRepository.deleteDocument(documentId, userId);
  }
}
