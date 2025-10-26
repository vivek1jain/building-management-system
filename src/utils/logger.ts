/**
 * Production-safe logging service
 * Replaces console.log/error/warn statements throughout the app
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date()
    };

    // Store in history (useful for debugging)
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // In development, use console
    if (this.isDevelopment) {
      const formattedMessage = context 
        ? `[${level.toUpperCase()}] ${message}` 
        : `[${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(formattedMessage, context || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, context || '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, context || '');
          break;
      }
    } else {
      // In production, you would send to a logging service (e.g., Sentry, LogRocket)
      // For now, only log errors to console in production
      if (level === LogLevel.ERROR) {
        console.error(`[ERROR] ${message}`, context || '');
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };
    this.log(LogLevel.ERROR, message, errorContext);
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory(): void {
    this.logHistory = [];
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const logError = (message: string, error?: Error | unknown, context?: Record<string, any>) => logger.error(message, error, context);
