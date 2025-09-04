import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge class names with conditional logic
 * Combines clsx for conditional classes and tailwind-merge for handling Tailwind CSS conflicts
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export default cn
