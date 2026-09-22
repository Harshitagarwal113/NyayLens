# NyayLens Architecture Document

## Overview
NyayLens is an AI-powered legal document assistant designed to analyze legal documents, answer questions using a RAG (Retrieval-Augmented Generation) pipeline, cite exact pages and clauses, identify attention areas, compare documents, and generate actionable checklists.

## Technology Stack
- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase PostgreSQL with `pgvector`
- **Storage:** Supabase Storage (for raw documents)
- **AI / LLM:** Gemini API (for generation, reasoning, and analysis)
- **Embeddings:** Gemini embeddings API
- **Data Validation & Typing:** Zod

## Project Structure & Boundaries

To ensure strict separation of concerns, the repository is divided into the following directories:

### 1. `/frontend`
- **Responsibility:** UI layer only.
- **Details:** Contains the Next.js application, React components, state management, and user interfaces.
- **Rules:** Must not contain direct database queries, file parsing logic, or direct calls to the Gemini API. All data must be fetched through the `/backend` REST API endpoints.

### 2. `/backend`
- **Responsibility:** APIs and business logic only.
- **Details:** Contains the Node.js Express server.
- **Rules:** 
  - Exposes RESTful endpoints for the frontend.
  - Handles uploading and parsing of legal documents (PDFs, Word docs).
  - Integrates with Supabase Storage and PostgreSQL (`pgvector`).
  - Orchestrates the RAG pipeline (document chunking, embedding generation via Gemini, storing and querying vectors).
  - Communicates with the Gemini API to generate answers, identify clauses, and compare documents.

### 3. `/shared`
- **Responsibility:** API contracts and types only.
- **Details:** Contains Zod schemas and TypeScript interfaces used by both `/frontend` and `/backend`.
- **Rules:** 
  - Ensures a single source of truth for request and response formats.
  - Types are imported from this directory into both the frontend and backend applications to enforce type safety across the network boundary.

## Core Workflows

### 1. Document Upload & Processing
1. User uploads a legal document via the frontend.
2. The frontend sends the file to the backend `/upload` endpoint.
3. The backend stores the raw document in Supabase Storage.
4. The backend parses the document, splits it into semantically meaningful chunks (e.g., sections, clauses, pages), and extracts metadata.
5. The backend generates embeddings for each chunk using the Gemini Embeddings API.
6. Vectors and metadata are stored in Supabase PostgreSQL using `pgvector`.

### 2. Querying & RAG Pipeline
1. User asks a legal question regarding a document.
2. The frontend sends the query to the backend `/query` endpoint.
3. The backend converts the query to an embedding using the Gemini Embeddings API.
4. The backend performs a similarity search against `pgvector` in Supabase to retrieve the most relevant document chunks.
5. The retrieved context (along with exact page/clause metadata) and the user's query are formatted into a prompt.
6. The backend sends the prompt to the Gemini API to generate a precise, legally sound answer.
7. The answer, alongside citations (pages/clauses), is returned to the frontend.

### 3. Document Comparison & Checklists
- **Comparison:** Specialized endpoints in the backend retrieve chunks from multiple documents, and a structured prompt is sent to Gemini to highlight differences, missing clauses, or contradictions.
- **Checklists:** The backend queries the document context and asks Gemini to output a structured JSON action plan. The structure of this JSON is validated strictly against schemas defined in `/shared` using Zod before being returned to the frontend.
