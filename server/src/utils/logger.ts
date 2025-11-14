/**
 * Winston Logger Configuration
 *
 * Structured logging with different levels and outputs:
 * - Console: Colorized output for development
 * - Files: Rotating log files for production (errors separate from combined logs)
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config.js';

// Log format for files (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Log format for console (human-readable, colorized)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    const metaKeys = Object.keys(meta).filter(key => key !== 'timestamp' && key !== 'level' && key !== 'message');
    if (metaKeys.length > 0) {
      const metaObj: Record<string, any> = {};
      metaKeys.forEach(key => {
        metaObj[key] = meta[key];
      });
      msg += ` ${JSON.stringify(metaObj)}`;
    }

    return msg;
  })
);

// Transports array
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
  }),
];

// Add file logging in production
if (config.nodeEnv === 'production') {
  // Error log file (errors only)
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m', // 20MB max file size
      maxFiles: '14d', // Keep 14 days of logs
      zippedArchive: true, // Compress old logs
    })
  );

  // Combined log file (all levels)
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports,
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Log unhandled rejections and exceptions
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  // Exit after logging (uncaught exceptions are fatal)
  process.exit(1);
});

// Export convenience methods
export default logger;

/**
 * Example usage:
 *
 * import { logger } from './utils/logger';
 *
 * logger.info('Server started', { port: 3001, env: 'production' });
 * logger.error('Database error', { error: err.message, stack: err.stack });
 * logger.debug('Processing request', { userId: '123', action: 'create_campaign' });
 * logger.warn('Rate limit approaching', { remaining: 10, limit: 100 });
 */
