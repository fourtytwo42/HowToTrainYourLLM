import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logs directory if it doesn't exist
async function ensureLogsDirectory() {
  try {
    await fs.mkdir(path.join(process.cwd(), 'logs'), { recursive: true });
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'model-workshop' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      level: 'info',
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
  ],
});

// Ensure logs directory exists
ensureLogsDirectory().catch(console.error);

export { logger }; 