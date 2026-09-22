import { SchemaType, Schema } from '@google/generative-ai';
import { RagService } from './rag.service';
import { GeminiService } from './gemini.service';
import { ChatRepository } from '../repositories/chat.repository';

// We map chunk_id to citation easily using Zod schema
const answerSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    answer: {
      type: SchemaType.STRING,
      description: "The detailed answer to the user's question, using only the provided context. Structure your answer cleanly.",
    },
    isInsufficientContext: {
      type: SchemaType.BOOLEAN,
      description: "Set to true if the context provided does not contain enough information to fully answer the question.",
    },
    citations: {
      type: SchemaType.ARRAY,
      description: "List of chunk identifiers used to generate the answer. Do not invent these.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          chunkId: {
            type: SchemaType.STRING,
            description: "The exact unique 'id' of the chunk used from the context.",
          },
          pageNumber: {
             type: SchemaType.INTEGER,
             description: "The derived page number or index of the chunk.",
          }
        },
        required: ["chunkId"],
      },
    },
  },
  required: ["answer", "isInsufficientContext", "citations"],
};

export class QnAService {
  static async askQuestion(userId: string, documentId: string, question: string) {
    // 1. Retrieve Context
    const chunks = await RagService.retrieveContext(userId, documentId, question, 7, 0.5);

    // 2. Prepare Prompt and System Instructions
    const systemInstruction = `You are an AI-powered legal document assistant. 
Your goal is to answer the user's question using ONLY the provided document context.
- Never invent facts. If the evidence is insufficient, set isInsufficientContext to true and state that the document does not contain the answer.
- Always return a structured JSON response.
- Cite the exact chunk IDs that support your claims.`;

    const contextString = chunks
      .map((c: any) => `[CHUNK ID: ${c.id} | PAGE: ${c.page_number}] Text:\n${c.text_content}`)
      .join('\n\n---\n\n');

    const prompt = `User Question: ${question}\n\nDocument Context:\n${contextString}`;

    // 3. Generate structured answer
    const rawJson = await GeminiService.generateJson(prompt, answerSchema, systemInstruction, 30000);
    const parsedResponse = JSON.parse(rawJson);

    // 4. Manage Conversation History
    // Check if an active conversation exists for this document/user
    let conversation = await ChatRepository.getLatestConversation(userId, documentId);
    
    if (!conversation) {
      conversation = await ChatRepository.createConversation(userId, documentId, `Q&A: ${question.substring(0, 30)}...`);
    }

    const conversationId = conversation.id;

    // Save User Message
    await ChatRepository.addMessage(conversationId, 'user', question);

    // Save Assistant Message
    const assistantMessage = await ChatRepository.addMessage(conversationId, 'assistant', parsedResponse.answer);

    // 5. Save Citations
    if (parsedResponse.citations && parsedResponse.citations.length > 0) {
      // Validate that cited chunk IDs actually exist in the context to prevent hallucinated citations
      const validChunkIds = new Set(chunks.map((c: any) => c.id));
      
      const citationsToInsert = parsedResponse.citations
        .filter((cite: any) => validChunkIds.has(cite.chunkId))
        .map((cite: any) => ({
          message_id: assistantMessage.id,
          document_chunk_id: cite.chunkId,
        }));

      if (citationsToInsert.length > 0) {
        await ChatRepository.createCitations(citationsToInsert);
      }
    }

    return {
      answer: parsedResponse.answer,
      isInsufficientContext: parsedResponse.isInsufficientContext,
      citations: parsedResponse.citations,
      conversationId: conversationId
    };
  }
}
