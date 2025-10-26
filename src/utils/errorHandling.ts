/**
 * Standardized error handling for services
 * Provides consistent logging and optional error tracking integration
 */

export interface ErrorContext {
  service?: string
  operation?: string
  metadata?: Record<string, any>
}

/**
 * Handle service errors with consistent logging
 * 
 * @param message - Human-readable error message
 * @param error - The error object
 * @param context - Additional context about where the error occurred
 * @param rethrow - Whether to re-throw the error after logging (default: true)
 */
export function handleServiceError(
  message: string,
  error: unknown,
  context?: ErrorContext,
  rethrow: boolean = true
): void {
  // Build context string
  const contextParts: string[] = []
  if (context?.service) contextParts.push(context.service)
  if (context?.operation) contextParts.push(context.operation)
  const contextStr = contextParts.length > 0 ? `[${contextParts.join('.')}]` : ''
  
  // Log the error
  console.error(`${contextStr} ${message}:`, error)
  
  // Log metadata if provided
  if (context?.metadata) {
    console.error('Error context:', context.metadata)
  }
  
  // Future: Send to error tracking service
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     tags: { service: context?.service, operation: context?.operation },
  //     extra: context?.metadata
  //   })
  // }
  
  if (rethrow) {
    throw error
  }
}

/**
 * Wrap a service function with error handling
 * Useful for adding consistent error handling to existing functions
 * 
 * @param fn - The async function to wrap
 * @param errorMessage - Error message to log on failure
 * @param context - Error context
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage: string,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleServiceError(errorMessage, error, context)
      throw error // handleServiceError already throws, but TypeScript needs this
    }
  }) as T
}

/**
 * Format an error for display to users
 * Extracts a user-friendly message from various error types
 * 
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  // Firebase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message?: string }
    
    // Translate common Firebase error codes to user-friendly messages
    switch (firebaseError.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action'
      case 'not-found':
        return 'The requested resource was not found'
      case 'already-exists':
        return 'This resource already exists'
      case 'resource-exhausted':
        return 'Service quota exceeded. Please try again later'
      case 'unauthenticated':
        return 'You must be signed in to perform this action'
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again'
      default:
        return firebaseError.message || 'An unexpected error occurred'
    }
  }
  
  return 'An unexpected error occurred'
}

/**
 * Check if an error is a specific Firebase error code
 * 
 * @param error - The error to check
 * @param code - The Firebase error code to check for
 * @returns True if the error matches the code
 */
export function isFirebaseError(error: unknown, code: string): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === code
  )
}
