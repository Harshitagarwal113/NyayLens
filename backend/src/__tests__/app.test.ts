import request from 'supertest';
import app from '../app';

describe('App and Health', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Resource not found');
  });

  // Depending on how health is implemented, let's just check the root or a dummy
  it('should reject requests without authorization on protected routes', async () => {
    const res = await request(app).get('/api/v1/documents');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
