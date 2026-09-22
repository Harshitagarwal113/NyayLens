process.env.PORT = '4000';
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy-key';
process.env.GEMINI_API_KEY = 'dummy-gemini-key';
process.env.FRONTEND_URL = 'http://localhost:3000';
jest.mock('../config/supabase', () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null }),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
  return {
    supabase: {
      from: jest.fn(() => chain),
      auth: {
        getUser: jest.fn(),
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn(),
          createSignedUrl: jest.fn(),
          remove: jest.fn(),
          download: jest.fn()
        })
      }
    }
  };
});

jest.mock('../services/gemini.service', () => ({
  GeminiService: {
    generateText: jest.fn(),
    generateJson: jest.fn(),
    generateEmbedding: jest.fn(),
  }
}));
