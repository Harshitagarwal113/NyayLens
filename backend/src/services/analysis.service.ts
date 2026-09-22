import { SchemaType, Schema } from '@google/generative-ai';
import { DocumentRepository } from '../repositories/document.repository';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { GeminiService } from './gemini.service';
import { AppError } from '../middlewares/error.middleware';

const analysisSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    document_type: {
      type: SchemaType.STRING,
      description: "The primary legal nature of the document (e.g., Non-Disclosure Agreement, Employment Contract, Subpoena, Resume, Invoice).",
    },
    document_summary: {
      type: SchemaType.STRING,
      description: "A high-level 2-3 sentence summary of the entire document's purpose and key contents.",
    },
    parties: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    },
    important_dates: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          significance: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    },
    important_amounts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          amount: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    },
    obligations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          party: { type: SchemaType.STRING },
          obligation: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    },
    rights: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          party: { type: SchemaType.STRING },
          right: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    },
    important_clauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          clause_name: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    },
    attention_areas: {
      type: SchemaType.ARRAY,
      description: "Risks, unusual terms, missing standard terms, or heavily skewed clauses.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          risk_level: { type: SchemaType.STRING, description: "Low, Medium, High" },
          description: { type: SchemaType.STRING },
          page: { type: SchemaType.INTEGER }
        }
      }
    }
  },
  required: [
    "document_type", "document_summary", "parties", "important_dates", "important_amounts", 
    "obligations", "rights", "important_clauses", "attention_areas"
  ]
};

export class AnalysisService {
  /**
   * Generates a comprehensive automatic analysis of a document.
   */
  static async analyzeDocument(userId: string, documentId: string) {
    // 1. Verify ownership
    const document = await DocumentRepository.getDocumentById(documentId, userId);
    if (!document) {
      throw { statusCode: 404, message: 'Document not found or unauthorized' } as AppError;
    }

    if (document.status !== 'processed') {
      throw { statusCode: 409, message: 'Document is not processed yet' } as AppError;
    }

    // 2. Fetch entire document content by pages to retain page-level fidelity
    const pages = await DocumentRepository.getDocumentPages(documentId);
    if (!pages || pages.length === 0) {
      throw { statusCode: 400, message: 'Document has no text content' } as AppError;
    }

    // Prepare full text with page markers
    const fullTextWithPages = pages
      .map((p: any) => `--- PAGE ${p.page_number} ---\n${p.text_content}`)
      .join('\n\n');

    // 3. Build Prompt
    const systemInstruction = `You are an expert legal AI assistant. Your task is to perform a detailed structural analysis of a legal document.
Extract the requested entities (parties, dates, amounts, obligations, rights, clauses, attention areas).
CRITICAL: Every single extracted item must include its exact source page number based on the '--- PAGE X ---' markers in the text.`;

    const prompt = `Analyze the following document:\n\n${fullTextWithPages}`;

    // 4. Generate Analysis JSON via Gemini
    // Allow up to 60 seconds since full document analysis takes longer
    const rawJson = await GeminiService.generateJson(prompt, analysisSchema, systemInstruction, 60000);
    const parsedData = JSON.parse(rawJson);

    // Extract document_summary so it isn't inserted into the non-existent schema column
    const { document_summary, ...restAnalysisData } = parsedData;

    if (document_summary) {
      await DocumentRepository.updateDocumentMetadata(documentId, { document_summary });
    }

    // 5. Store in DB
    const analysisRecord = await AnalysisRepository.createAnalysis(documentId, restAnalysisData);
    
    // Attach it back for immediate return
    if (analysisRecord) {
      analysisRecord.document_summary = document_summary;
    }

    return analysisRecord;
  }

  static async getAnalysis(userId: string, documentId: string) {
    const document = await DocumentRepository.getDocumentById(documentId, userId);
    if (!document) {
      throw { statusCode: 404, message: 'Document not found or unauthorized' } as AppError;
    }

    const analysis = await AnalysisRepository.getAnalysisByDocumentId(documentId);
    if (!analysis) {
      throw { statusCode: 404, message: 'Analysis not found for this document' } as AppError;
    }

    // Inject document_summary from document metadata
    analysis.document_summary = document.metadata?.document_summary;

    return analysis;
  }
}
