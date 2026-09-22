import { SchemaType, Schema } from '@google/generative-ai';
import { DocumentRepository } from '../repositories/document.repository';
import { GeminiService } from './gemini.service';
import { AppError } from '../middlewares/error.middleware';

// 1. Comparison Schema
const comparisonSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    added_clauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          clause_name: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          source_page_doc2: { type: SchemaType.INTEGER }
        }
      }
    },
    removed_clauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          clause_name: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          source_page_doc1: { type: SchemaType.INTEGER }
        }
      }
    },
    modified_clauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          clause_name: { type: SchemaType.STRING },
          old_summary: { type: SchemaType.STRING },
          new_summary: { type: SchemaType.STRING },
          significance: { type: SchemaType.STRING, description: "Low, Medium, High" },
          source_page_doc1: { type: SchemaType.INTEGER },
          source_page_doc2: { type: SchemaType.INTEGER }
        }
      }
    },
    important_value_changes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING, description: "e.g., Penalty Amount, Notice Period" },
          old_value: { type: SchemaType.STRING },
          new_value: { type: SchemaType.STRING },
          implication: { type: SchemaType.STRING }
        }
      }
    }
  },
  required: ["added_clauses", "removed_clauses", "modified_clauses", "important_value_changes"]
};

// 2. Checklist Schema
const checklistSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "Actionable tasks derived from document obligations.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      task: { type: SchemaType.STRING, description: "Clear, actionable task." },
      assignee: { type: SchemaType.STRING, description: "Who is responsible based on the document." },
      deadline: { type: SchemaType.STRING, description: "Explicit date or trigger event (e.g., '30 days after signing')." },
      source_page: { type: SchemaType.INTEGER }
    },
    required: ["task", "assignee", "deadline", "source_page"]
  }
};

// 3. Legal Questions Schema
const legalQuestionsSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "Suggested questions for a legal professional.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      question: { type: SchemaType.STRING },
      context: { type: SchemaType.STRING, description: "Why this question is important based on the document." },
      source_page: { type: SchemaType.INTEGER }
    },
    required: ["question", "context", "source_page"]
  }
};

export class FeaturesService {
  private static async getDocumentText(documentId: string, userId: string) {
    const document = await DocumentRepository.getDocumentById(documentId, userId);
    if (!document) {
      throw { statusCode: 404, message: `Document ${documentId} not found or unauthorized` } as AppError;
    }
    if (document.status !== 'processed') {
      throw { statusCode: 409, message: `Document ${documentId} is not processed yet` } as AppError;
    }

    const pages = await DocumentRepository.getDocumentPages(documentId);
    if (!pages || pages.length === 0) {
      throw { statusCode: 400, message: `Document ${documentId} has no text content` } as AppError;
    }

    return pages.map((p: any) => `--- PAGE ${p.page_number} ---\n${p.text_content}`).join('\n\n');
  }

  static async compareDocuments(userId: string, docId1: string, docId2: string) {
    const text1 = await this.getDocumentText(docId1, userId);
    const text2 = await this.getDocumentText(docId2, userId);

    const systemInstruction = `You are an expert legal AI. Your task is to compare two versions of a legal document (Document 1 and Document 2) and extract the differences accurately.
CRITICAL INSTRUCTIONS:
- Identify added clauses, removed clauses, modified clauses, and important value changes (dates, amounts).
- Provide highly detailed, comprehensive, and lengthy explanations for all summaries (e.g., 'summary', 'old_summary', 'new_summary', 'implication'). Do not use brief one-liners; fully explain the nuances and specifics of each clause or change.
- Include the source page number from Document 1 (source_page_doc1) and Document 2 (source_page_doc2) wherever applicable, using the '--- PAGE X ---' markers.`;

    const prompt = `--- DOCUMENT 1 ---\n\n${text1}\n\n=================================\n\n--- DOCUMENT 2 ---\n\n${text2}\n\nCompare Document 1 and Document 2.`;

    const rawJson = await GeminiService.generateJson(prompt, comparisonSchema, systemInstruction, 60000);
    return JSON.parse(rawJson);
  }

  static async generateChecklist(userId: string, documentId: string) {
    const text = await this.getDocumentText(documentId, userId);

    const systemInstruction = `You are a legal operations assistant. Your task is to extract all obligations, deliverables, and conditions from the document and convert them into an actionable checklist.
CRITICAL INSTRUCTIONS:
- Each item must be a clear action.
- Assign an assignee (e.g., 'Company', 'Employee', 'Both').
- Identify the deadline or trigger event.
- Provide the source page number using the '--- PAGE X ---' markers.`;

    const prompt = `Extract an actionable checklist from the following document:\n\n${text}`;

    const rawJson = await GeminiService.generateJson(prompt, checklistSchema, systemInstruction, 45000);
    return JSON.parse(rawJson);
  }

  static async generateLegalQuestions(userId: string, documentId: string) {
    const text = await this.getDocumentText(documentId, userId);

    const systemInstruction = `You are a legal AI assistant. Your task is to read the document and generate high-value, specific questions that the user should ask a human legal professional.
CRITICAL INSTRUCTIONS:
- Focus on ambiguities, unusual liabilities, severe penalties, or missing standard protections.
- Provide the exact source page number for context using the '--- PAGE X ---' markers.`;

    const prompt = `Generate questions for a lawyer based on this document:\n\n${text}`;

    const rawJson = await GeminiService.generateJson(prompt, legalQuestionsSchema, systemInstruction, 45000);
    return JSON.parse(rawJson);
  }
}
