import { Request, Response, NextFunction } from 'express';
import * as healthService from '../services/health.service';

export const checkHealth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = healthService.getHealthStatus();
    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};
