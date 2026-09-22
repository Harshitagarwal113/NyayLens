import morgan from 'morgan';

// We use 'dev' format for development which includes colors
// and 'combined' for production.
const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const requestLogger = morgan(format);
