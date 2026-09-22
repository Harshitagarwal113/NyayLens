/**
 * Base generic response structure for all APIs
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * -----------------------------------------
 * DOCUMENT APIS
 * -----------------------------------------
 */

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  status: 'processing' | 'processed' | 'failed' | 'failed_processing';
  created_at: string;
  updated_at: string;
  downloadUrl?: string; // Appended when fetching a single document
}

export type GetDocumentsResponse = ApiResponse<Document[]>;

export type GetDocumentResponse = ApiResponse<Document>;

export type UploadDocumentResponse = ApiResponse<Document>;

/**
 * -----------------------------------------
 * LEGAL Q&A APIS
 * -----------------------------------------
 */

export interface AskQuestionRequest {
  question: string;
}

export interface Citation {
  chunkId: string;
  pageNumber: number;
}

export interface AskQuestionResponseData {
  answer: string;
  isInsufficientContext: boolean;
  citations: Citation[];
  conversationId: string;
}

export type AskQuestionResponse = ApiResponse<AskQuestionResponseData>;

/**
 * -----------------------------------------
 * ANALYSIS APIS
 * -----------------------------------------
 */

export interface Party {
  name: string;
  role: string;
  page: number;
}

export interface ImportantDate {
  date: string;
  significance: string;
  page: number;
}

export interface ImportantAmount {
  amount: string;
  context: string;
  page: number;
}

export interface ObligationOrRight {
  party: string;
  obligation?: string;
  right?: string;
  page: number;
}

export interface Clause {
  clause_name: string;
  summary: string;
  page: number;
}

export interface AttentionArea {
  category?: string;
  risk_level?: string;
  severity?: string;
  description?: string;
  explanation?: string;
  suggested_question?: string;
  page?: number;
  source_page?: number;
}

export interface DocumentAnalysisData {
  document_type: string;
  document_summary?: string;
  parties: Party[];
  important_dates: ImportantDate[];
  important_amounts: ImportantAmount[];
  obligations: ObligationOrRight[];
  rights: ObligationOrRight[];
  important_clauses: Clause[];
  attention_areas: AttentionArea[];
}

export type DocumentAnalysisResponse = ApiResponse<DocumentAnalysisData>;

/**
 * -----------------------------------------
 * ATTENTION AREAS APIS
 * -----------------------------------------
 */

export type ScanAttentionAreasResponse = ApiResponse<AttentionArea[]>;

/**
 * -----------------------------------------
 * ADVANCED FEATURES APIS
 * -----------------------------------------
 */

export interface CompareDocumentsRequest {
  documentId1: string;
  documentId2: string;
}

export interface ComparisonData {
  added_clauses: Array<{ clause_name: string; summary: string; source_page_doc2: number }>;
  removed_clauses: Array<{ clause_name: string; summary: string; source_page_doc1: number }>;
  modified_clauses: Array<{ clause_name: string; old_summary: string; new_summary: string; significance: string; source_page_doc1: number; source_page_doc2: number }>;
  important_value_changes: Array<{ item: string; old_value: string; new_value: string; implication: string }>;
}

export type CompareDocumentsResponse = ApiResponse<ComparisonData>;


export interface ChecklistItem {
  task: string;
  assignee: string;
  deadline: string;
  source_page: number;
}

export type GenerateChecklistResponse = ApiResponse<ChecklistItem[]>;


export interface LegalQuestion {
  question: string;
  context: string;
  source_page: number;
}

export type GenerateLegalQuestionsResponse = ApiResponse<LegalQuestion[]>;
