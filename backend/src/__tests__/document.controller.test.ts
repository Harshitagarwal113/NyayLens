import request from 'supertest';
import app from '../app';
import { supabase } from '../config/supabase';
import { GeminiService } from '../services/gemini.service';

describe('Document Controller (CRUD & Features)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user authentication globally for these routes
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null
    });
  });

  describe('GET /api/v1/documents', () => {
    it('should return a list of documents for the authenticated user', async () => {
      // Mock the document repository calls
      const mockData = [{ id: 'doc-1', filename: 'test.pdf' }];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', 'Bearer dummy-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockData);
    });
  });

  describe('POST /api/v1/documents/:id/checklist', () => {
    it('should generate a checklist and return structured JSON', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: validUuid, status: 'processed' }, error: null }),
        single: jest.fn().mockResolvedValue({ data: { id: validUuid, status: 'processed' }, error: null }),
        order: jest.fn().mockResolvedValue({ data: [{ page_number: 1, text_content: 'page 1 text' }], error: null }),
      });

      // Mock Gemini JSON output
      const mockedChecklist = [{ task: 'Sign doc', assignee: 'Client', deadline: 'ASAP', source_page: 1 }];
      (GeminiService.generateJson as jest.Mock).mockResolvedValue(JSON.stringify(mockedChecklist));

      const res = await request(app)
        .post(`/api/v1/documents/${validUuid}/checklist`)
        .set('Authorization', 'Bearer dummy-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockedChecklist);
    });
  });
});
