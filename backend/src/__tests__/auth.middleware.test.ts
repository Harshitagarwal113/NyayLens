import request from 'supertest';
import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { supabase } from '../config/supabase';

const app = express();
app.use(requireAuth);
app.get('/protected', (req, res) => res.status(200).json({ success: true, user: req.user }));

describe('Authentication Middleware', () => {
  it('should return 401 if no authorization header is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 if header format is invalid', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'InvalidToken');
    expect(res.statusCode).toBe(401);
  });

  it('should call next and attach user if token is valid', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null
    });

    const res = await request(app).get('/protected').set('Authorization', 'Bearer valid-token');
    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe('user-123');
  });

  it('should return 401 if token is invalid or expired', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    const res = await request(app).get('/protected').set('Authorization', 'Bearer invalid-token');
    expect(res.statusCode).toBe(401);
  });
});
