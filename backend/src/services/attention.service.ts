import { SchemaType, Schema } from '@google/generative-ai';
import { DocumentRepository } from '../repositories/document.repository';
import { GeminiService } from './gemini.service';
import { AppError } from '../middlewares/error.middleware';

const attentionAreaSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "List of identified attention areas.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      category: {
        type: SchemaType.STRING,
        description: "Must be one of: termination, liability, indemnity, payment, penalties, confidentiality, renewal, dispute resolution, restrictive clauses, or other.",
      },
      severity: {
        type: SchemaType.STRING,
        description: "Low, Medium, or High",
      },
      explanation: {
        type: SchemaType.STRING,
        description: "Why this area deserves attention. Do not declare the clause illegal.",
      },
      source_page: {
        type: SchemaType.INTEGER,
        description: "The page number where this clause was found.",
      },
      suggested_question: {
        type: SchemaType.STRING,
        description: "A specific question the user should ask a legal professional about this clause.",
      },
    },
    required: ["category", "severity", "explanation", "source_page", "suggested_question"],
  }
};

export class AttentionScannerService {
  static async scanAttentionAreas(userId: string, documentId: string) {
    const document = await DocumentRepository.getDocumentById(documentId, userId);
    if (!document) {
      throw { statusCode: 404, message: 'Document not found or unauthorized' } as AppError;
    }

    if (document.status !== 'processed') {
      throw { statusCode: 409, message: 'Document is not processed yet' } as AppError;
    }

    const pages = await DocumentRepository.getDocumentPages(documentId);
    if (!pages || pages.length === 0) {
      throw { statusCode: 400, message: 'Document has no text content' } as AppError;
    }

    const fullTextWithPages = pages
      .map((p: any) => `--- PAGE ${p.page_number} ---\n${p.text_content}`)
      .join('\n\n');

    const systemInstruction = `You are a legal AI assistant. Your task is to scan the following document and identify areas that deserve the user's attention.
Categories may include: termination, liability, indemnity, payment, penalties, confidentiality, renewal, dispute resolution, restrictive clauses.
CRITICAL INSTRUCTIONS:
- DO NOT declare any clause illegal. Simply point out why it deserves attention or may be risky.
- Every extracted item must include its source page based on the '--- PAGE X ---' markers.
- Provide a suggested question for a legal professional for each area.`;

    const prompt = `Scan the following document for attention areas:\n\n${fullTextWithPages}`;

    // We use a high timeout because scanning a full document can take time
    const rawJson = await GeminiService.generateJson(prompt, attentionAreaSchema, systemInstruction, 60000);
    const parsedData = JSON.parse(rawJson);

    return parsedData;
  }
}
