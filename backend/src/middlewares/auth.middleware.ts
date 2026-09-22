import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized - Missing or invalid token format' },
      });
    }

    const token = authHeader.split(' ')[1];


    // Validate the token using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized - Invalid or expired token' },
      });
    }

    // Attach the authenticated user to the request object
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
