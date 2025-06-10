import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.',
    });
  },
});

// Stricter limiter for training jobs
export const trainingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 training jobs per hour
  message: 'Too many training jobs from this IP, please try again later.',
  handler: (req: Request, res: Response) => {
    logger.warn(`Training rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many training jobs',
      message: 'Please wait before starting another training job.',
    });
  },
});

// Limiter for model pulls
export const modelPullLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // Limit each IP to 3 model pulls per 30 minutes
  message: 'Too many model pulls from this IP, please try again later.',
  handler: (req: Request, res: Response) => {
    logger.warn(`Model pull rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many model pulls',
      message: 'Please wait before pulling another model.',
    });
  },
});

// Limiter for data uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many uploads from this IP, please try again later.',
  handler: (req: Request, res: Response) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many uploads',
      message: 'Please wait before uploading more data.',
    });
  },
}); 