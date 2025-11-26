/**
 * Error Handler Utility
 * 
 * Provides consistent error handling, formatting, and logging across the application.
 */

import { FirebaseError } from 'firebase/app';
import { AppError, ErrorCategory, getErrorDefinition } from './errorCodes';
import { captureException } from './sentry';

/**
 * Create a structured AppError from an error code
 */
export function createAppError(
  errorCode: string,
  details?: Record<string, unknown>,
  originalError?: Error
): AppError {
  const definition = getErrorDefinition(errorCode);
  
  if (!definition) {
    // Fallback for unknown error codes
    return {
      code: 'ERR-UNKNOWN-001',
      category: ErrorCategory.UI,
      message: 'Unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      source: 'Unknown',
      details,
      originalError,
      timestamp: new Date(),
    };
  }

  return {
    code: definition.code,
    category: definition.category,
    message: definition.message,
    userMessage: definition.userMessage,
    source: definition.source,
    details,
    originalError,
    timestamp: new Date(),
  };
}

/**
 * Handle Firebase errors and map to app error codes
 */
export function handleFirebaseError(error: FirebaseError, context?: Record<string, unknown>): AppError {
  let errorCode = 'ERR-DB-001'; // Default to generic DB error

  // Map Firebase error codes to our error codes
  switch (error.code) {
    // Authentication errors
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      errorCode = 'ERR-AUTH-001';
      break;
    case 'auth/user-disabled':
    case 'auth/too-many-requests':
      errorCode = 'ERR-AUTH-002';
      break;
    case 'auth/email-already-in-use':
      errorCode = 'ERR-AUTH-005';
      break;
    case 'auth/weak-password':
      errorCode = 'ERR-VALIDATION-005';
      break;

    // Firestore errors
    case 'permission-denied':
      errorCode = 'ERR-PERMISSION-002';
      break;
    case 'not-found':
      errorCode = 'ERR-DB-005';
      break;
    case 'already-exists':
      errorCode = 'ERR-DB-002';
      break;
    case 'failed-precondition':
      errorCode = 'ERR-DB-006';
      break;
    case 'resource-exhausted':
      errorCode = 'ERR-DB-006';
      break;
    case 'unauthenticated':
      errorCode = 'ERR-AUTH-002';
      break;

    // Storage errors
    case 'storage/unauthorized':
      errorCode = 'ERR-PERMISSION-002';
      break;
    case 'storage/object-not-found':
      errorCode = 'ERR-STORAGE-004';
      break;
    case 'storage/quota-exceeded':
      errorCode = 'ERR-STORAGE-002';
      break;

    // Network errors
    case 'unavailable':
      errorCode = 'ERR-NETWORK-003';
      break;
    case 'deadline-exceeded':
      errorCode = 'ERR-NETWORK-002';
      break;
    case 'cancelled':
      errorCode = 'ERR-NETWORK-001';
      break;

    default:
      // Check error message for additional context
      if (error.message.includes('network')) {
        errorCode = 'ERR-NETWORK-001';
      } else if (error.message.includes('permission')) {
        errorCode = 'ERR-PERMISSION-002';
      }
  }

  const appError = createAppError(errorCode, context, error);
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Firebase Error]', {
      code: error.code,
      message: error.message,
      appError,
    });
  }

  // Send to Sentry
  captureException(error, {
    ...context,
    appErrorCode: errorCode,
    firebaseCode: error.code,
  });

  return appError;
}

/**
 * Handle generic JavaScript errors
 */
export function handleGenericError(error: Error, context?: Record<string, unknown>): AppError {
  // Check if it's a Firebase error
  if ('code' in error && typeof (error as FirebaseError).code === 'string') {
    return handleFirebaseError(error as FirebaseError, context);
  }

  // Check for network errors
  if (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch')
  ) {
    return createAppError('ERR-NETWORK-001', context, error);
  }

  // Default to generic UI error
  const appError = createAppError('ERR-UI-001', context, error);

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Generic Error]', {
      message: error.message,
      stack: error.stack,
      appError,
    });
  }

  // Send to Sentry
  captureException(error, context);

  return appError;
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: AppError | Error | unknown): string {
  if (isAppError(error)) {
    return `${error.userMessage} (${error.code})`;
  }

  if (error instanceof Error) {
    return `Something went wrong. Please try again.`;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error &&
    'category' in error
  );
}

/**
 * Log error for debugging (development only)
 */
export function logError(error: AppError | Error, context?: string): void {
  if (!import.meta.env.DEV) return;

  console.group(`🔴 Error ${context ? `in ${context}` : ''}`);
  
  if (isAppError(error)) {
    console.error('Code:', error.code);
    console.error('Category:', error.category);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);
    console.error('Source:', error.source);
    if (error.details) {
      console.error('Details:', error.details);
    }
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
  } else {
    console.error(error);
  }
  
  console.groupEnd();
}

/**
 * Retry function with exponential backoff
 * Useful for transient errors like network issues
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on permission errors or validation errors
      if (error instanceof FirebaseError) {
        if (
          error.code === 'permission-denied' ||
          error.code === 'unauthenticated' ||
          error.code === 'invalid-argument'
        ) {
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (import.meta.env.DEV) {
        console.log(`Retrying... Attempt ${attempt + 2}/${maxRetries}`);
      }
    }
  }

  throw lastError;
}

/**
 * Wrap async function with error handling
 * Returns [result, error] tuple (like Go)
 */
export async function catchAsync<T>(
  promise: Promise<T>
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    if (error instanceof FirebaseError) {
      return [null, handleFirebaseError(error)];
    }
    return [null, handleGenericError(error as Error)];
  }
}

/**
 * Check if error is a specific error code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return isAppError(error) && error.code === code;
}

/**
 * Check if error is in a specific category
 */
export function isErrorCategory(error: unknown, category: ErrorCategory): boolean {
  return isAppError(error) && error.category === category;
}
