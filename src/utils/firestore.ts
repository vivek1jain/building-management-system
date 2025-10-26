import { Timestamp } from 'firebase/firestore'

/**
 * Convert a Firestore Timestamp to a JavaScript Date
 * Handles null/undefined timestamps by returning the current date
 * 
 * @param timestamp - Firestore Timestamp or undefined
 * @returns JavaScript Date object
 */
export const fromFirestoreTimestamp = (
  timestamp?: Timestamp | { toDate: () => Date }
): Date => {
  if (!timestamp) return new Date()
  
  // Handle Firestore Timestamp with toDate method
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }
  
  return new Date()
}

/**
 * Convert a JavaScript Date to a Firestore Timestamp
 * 
 * @param date - JavaScript Date object
 * @returns Firestore Timestamp
 */
export const toFirestoreTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date)
}

/**
 * Convert an optional JavaScript Date to a Firestore Timestamp or undefined
 * Useful for optional date fields
 * 
 * @param date - JavaScript Date object or undefined
 * @returns Firestore Timestamp or undefined
 */
export const toOptionalFirestoreTimestamp = (
  date?: Date
): Timestamp | undefined => {
  return date ? Timestamp.fromDate(date) : undefined
}

/**
 * Get the current time as a Firestore Timestamp
 * 
 * @returns Firestore Timestamp representing now
 */
export const nowTimestamp = (): Timestamp => {
  return Timestamp.now()
}

/**
 * Convert multiple Firestore Timestamps in an object to Dates
 * Useful for batch conversions after fetching from Firestore
 * 
 * @param data - Object with Firestore Timestamps
 * @param fields - Array of field names to convert
 * @returns New object with converted Date fields
 */
export const convertTimestampFields = <T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T => {
  const converted = { ...data }
  
  for (const field of fields) {
    if (converted[field]) {
      converted[field] = fromFirestoreTimestamp(converted[field]) as any
    }
  }
  
  return converted
}
