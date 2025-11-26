/**
 * Service Error Wrapper
 * 
 * Utility to wrap service functions with consistent error handling
 */

import { handleFirebaseError, createAppError } from './errorHandler';

/**
 * Wrap a service function with error handling
 * 
 * @example
 * const getTickets = wrapServiceFunction(
 *   'ticketService.getTickets',
 *   async (buildingId: string) => {
 *     const q = query(collection(db, 'tickets'), where('buildingId', '==', buildingId));
 *     return await getDocs(q);
 *   }
 * );
 */
export function wrapServiceFunction<T extends (...args: any[]) => Promise<any>>(
  functionName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // Check if it's already an AppError
      if (error.code && error.category && error.userMessage) {
        throw error;
      }

      // Handle Firebase errors
      const appError = handleFirebaseError(error, {
        service: functionName,
        args: args.map((arg, i) => `arg${i}: ${typeof arg}`),
      });
      
      throw appError;
    }
  }) as T;
}

/**
 * Wrap database read operations
 */
export function wrapDbRead<T extends (...args: any[]) => Promise<any>>(
  functionName: string,
  fn: T
): T {
  return wrapServiceFunction(functionName, fn);
}

/**
 * Wrap database write operations
 */
export function wrapDbWrite<T extends (...args: any[]) => Promise<any>>(
  functionName: string,
  fn: T
): T {
  return wrapServiceFunction(functionName, fn);
}

/**
 * Quick error handling for simple service methods
 * Use in catch blocks for consistent error mapping
 */
export function handleServiceError(
  error: any,
  serviceName: string,
  operation: string,
  context?: Record<string, unknown>
): never {
  const appError = handleFirebaseError(error, {
    service: serviceName,
    operation,
    ...context,
  });
  
  throw appError;
}
