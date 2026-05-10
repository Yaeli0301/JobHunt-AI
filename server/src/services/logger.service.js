/**
 * Logger Service
 * Winston-based logging with multiple transports.
 * Logs requests and errors with appropriate levels.
 */

import winston from "winston";
import { NODE_ENV } from "../config/env.js";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: NODE_ENV === "production" ? logFormat : consoleFormat,
    }),
  ],
  exitOnError: false,
});

// Add file transport for production
if (NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({ 
      filename: "logs/error.log", 
      level: "error" 
    })
  );
  
  logger.add(
    new winston.transports.File({ 
      filename: "logs/combined.log" 
    })
  );
}

/**
 * Log an info message.
 * @param {string} message 
 * @param {object} meta 
 */
export function info(message, meta = {}) {
  logger.info(message, meta);
}

/**
 * Log an error message.
 * @param {string} message 
 * @param {Error|object} meta 
 */
export function error(message, meta = {}) {
  logger.error(message, meta);
}

/**
 * Log a warning message.
 * @param {string} message 
 * @param {object} meta 
 */
export function warn(message, meta = {}) {
  logger.warn(message, meta);
}

/**
 * Log debug message (only in development).
 * @param {string} message 
 * @param {object} meta 
 */
export function debug(message, meta = {}) {
  if (NODE_ENV !== "production") {
    logger.debug(message, meta);
  }
}

/**
 * Log HTTP request.
 * @param {object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} responseTime - Response time in ms
 */
export function logRequest(req, statusCode, responseTime) {
  const meta = {
    method: req.method,
    url: req.originalUrl || req.url,
    status: statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("user-agent"),
  };
  
  if (statusCode >= 500) {
    logger.error(`HTTP ${statusCode}`, meta);
  } else if (statusCode >= 400) {
    logger.warn(`HTTP ${statusCode}`, meta);
  } else {
    logger.info(`HTTP ${statusCode}`, meta);
  }
}

/**
 * Log application startup.
 * @param {number} port 
 */
export function logStartup(port) {
  logger.info("=".repeat(50));
  logger.info("AI Job Matching Platform Starting");
  logger.info(`Environment: ${NODE_ENV}`);
  logger.info(`Port: ${port}`);
  logger.info("=".repeat(50));
}

/**
 * Stream for morgan HTTP logging
 */
export const loggerStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default {
  info,
  error,
  warn,
  debug,
  logRequest,
  logStartup,
  loggerStream,
  logger,
};
