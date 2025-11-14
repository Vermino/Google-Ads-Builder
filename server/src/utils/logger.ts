import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about these colors
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define format for console output (human-readable with colors)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${
      info.stack ? `\n${info.stack}` : ''
    }${
      Object.keys(info).filter(k => !['timestamp', 'level', 'message', 'stack'].includes(k)).length > 0
        ? `\n${JSON.stringify(
            Object.fromEntries(
              Object.entries(info).filter(([k]) => !['timestamp', 'level', 'message', 'stack', 'splat', Symbol.for('level')].includes(k as any))
            ),
            null,
            2
          )}`
        : ''
    }`
  )
);

// Define format for file output (JSON for easy parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports only in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '../../logs');

  // Transport for error logs only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // Transport for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add file exception handlers in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '../../logs');

  logger.exceptions.handle(
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  logger.rejections.handle(
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

export default logger;
