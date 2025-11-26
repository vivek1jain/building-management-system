/**
 * Sentry Error Monitoring Integration
 * 
 * To enable Sentry:
 * 1. Sign up at https://sentry.io
 * 2. Create a new project for your app
 * 3. Install: npm install @sentry/react
 * 4. Add VITE_SENTRY_DSN to your .env.local
 * 5. Uncomment the init() call in main.tsx
 */

import * as Sentry from "@sentry/react";

interface SentryConfig {
  dsn?: string;
  environment?: string;
  enabled: boolean;
}

/**
 * Initialize Sentry error monitoring
 * Only runs in production with valid DSN
 */
export function initSentry(): void {
  const config: SentryConfig = {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
  };

  if (!config.enabled) {
    console.log('Sentry disabled (development mode or no DSN provided)');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production (0.1 = 10% of transactions)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Capture Replay for Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    beforeSend(event, hint) {
      // Filter out errors that aren't useful
      const error = hint.originalException;
      
      // Don't send errors from browser extensions
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (message.includes('extension://')) {
          return null;
        }
      }
      
      return event;
    },
  });
  
  console.log('Sentry initialized:', config.environment);
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  console.error('Error captured:', error, context);
  
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: context,
    });
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; role?: string }): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
