import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import xss from 'xss-clean';
import { env } from './config/env';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

const app: Application = express();

// 1. Security Headers
app.use(helmet());

// 2. Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { message: 'Too many requests, please try again later.' } }
});
app.use('/api/', limiter);

// 3. Middlewares
app.use(requestLogger);
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Data Sanitization against XSS
app.use(xss());

// Routes
app.get('/', (req, res) => {
  res.json({ success: true, message: 'NyayLens API is running' });
});
app.use('/api/v1', v1Routes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
