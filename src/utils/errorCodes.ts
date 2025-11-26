/**
 * Error Code Registry
 * 
 * Centralized error code system for consistent error handling across the application.
 * Each error has a unique code, user-friendly message, and source tracking.
 */

export enum ErrorCategory {
  AUTH = 'AUTH',
  DB = 'DB',
  STORAGE = 'STORAGE',
  API = 'API',
  UI = 'UI',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  BUSINESS = 'BUSINESS',
}

export interface AppError {
  code: string;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  source: string;
  details?: Record<string, unknown>;
  originalError?: Error;
  timestamp: Date;
  userId?: string;
}

export interface ErrorDefinition {
  code: string;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  source: string;
  troubleshooting?: string;
}

/**
 * Central Error Code Registry
 * Format: ERR-[CATEGORY]-[NUMBER]
 */
export const ERROR_REGISTRY: Record<string, ErrorDefinition> = {
  // ====================================================================
  // AUTHENTICATION ERRORS (AUTH-001 to AUTH-099)
  // ====================================================================
  'ERR-AUTH-001': {
    code: 'ERR-AUTH-001',
    category: ErrorCategory.AUTH,
    message: 'Email/password authentication failed',
    userMessage: 'Unable to log in. Please check your email and password.',
    source: 'src/contexts/AuthContext.tsx',
    troubleshooting: 'Verify credentials are correct. Check if account exists.',
  },
  'ERR-AUTH-002': {
    code: 'ERR-AUTH-002',
    category: ErrorCategory.AUTH,
    message: 'User session expired or invalid',
    userMessage: 'Your session has expired. Please log in again.',
    source: 'src/contexts/AuthContext.tsx',
    troubleshooting: 'User needs to re-authenticate.',
  },
  'ERR-AUTH-003': {
    code: 'ERR-AUTH-003',
    category: ErrorCategory.AUTH,
    message: 'User account not found in database',
    userMessage: 'Account not found. Please contact support.',
    source: 'src/contexts/AuthContext.tsx',
    troubleshooting: 'User authenticated but no Firestore user document exists.',
  },
  'ERR-AUTH-004': {
    code: 'ERR-AUTH-004',
    category: ErrorCategory.AUTH,
    message: 'Registration failed',
    userMessage: 'Unable to create account. Please try again.',
    source: 'src/contexts/AuthContext.tsx',
    troubleshooting: 'Check Firebase Auth settings and email validation.',
  },
  'ERR-AUTH-005': {
    code: 'ERR-AUTH-005',
    category: ErrorCategory.AUTH,
    message: 'Email already in use',
    userMessage: 'An account with this email already exists.',
    source: 'src/contexts/AuthContext.tsx',
    troubleshooting: 'User should log in instead of registering.',
  },
  'ERR-AUTH-006': {
    code: 'ERR-AUTH-006',
    category: ErrorCategory.AUTH,
    message: 'Logout failed',
    userMessage: 'Unable to log out. Please try again.',
    source: 'src/contexts/AuthContext.tsx',
  },
  'ERR-AUTH-007': {
    code: 'ERR-AUTH-007',
    category: ErrorCategory.AUTH,
    message: 'Password reset failed',
    userMessage: 'Unable to send password reset email. Please try again.',
    source: 'src/services/authService.ts',
  },

  // ====================================================================
  // DATABASE ERRORS (DB-001 to DB-099)
  // ====================================================================
  'ERR-DB-001': {
    code: 'ERR-DB-001',
    category: ErrorCategory.DB,
    message: 'Failed to fetch data from Firestore',
    userMessage: 'Unable to load data. Please refresh the page.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Check network connection and Firestore rules.',
  },
  'ERR-DB-002': {
    code: 'ERR-DB-002',
    category: ErrorCategory.DB,
    message: 'Failed to create document',
    userMessage: 'Unable to save data. Please try again.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Check Firestore rules allow creation for this user role.',
  },
  'ERR-DB-003': {
    code: 'ERR-DB-003',
    category: ErrorCategory.DB,
    message: 'Failed to update document',
    userMessage: 'Unable to update. Please try again.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Check Firestore rules allow updates for this user role.',
  },
  'ERR-DB-004': {
    code: 'ERR-DB-004',
    category: ErrorCategory.DB,
    message: 'Failed to delete document',
    userMessage: 'Unable to delete. Please try again.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Check Firestore rules allow deletion for this user role.',
  },
  'ERR-DB-005': {
    code: 'ERR-DB-005',
    category: ErrorCategory.DB,
    message: 'Document not found',
    userMessage: 'Item not found. It may have been deleted.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Verify document ID is correct and exists.',
  },
  'ERR-DB-006': {
    code: 'ERR-DB-006',
    category: ErrorCategory.DB,
    message: 'Query failed',
    userMessage: 'Unable to search. Please try again.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Check Firestore indexes exist for this query.',
  },

  // ====================================================================
  // PERMISSION ERRORS (PERMISSION-001 to PERMISSION-099)
  // ====================================================================
  'ERR-PERMISSION-001': {
    code: 'ERR-PERMISSION-001',
    category: ErrorCategory.PERMISSION,
    message: 'Insufficient permissions',
    userMessage: 'You don\'t have permission to perform this action.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Check user role and Firestore security rules.',
  },
  'ERR-PERMISSION-002': {
    code: 'ERR-PERMISSION-002',
    category: ErrorCategory.PERMISSION,
    message: 'Permission denied by Firestore rules',
    userMessage: 'Access denied. Please contact your administrator.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Review Firestore rules for this collection and operation.',
  },
  'ERR-PERMISSION-003': {
    code: 'ERR-PERMISSION-003',
    category: ErrorCategory.PERMISSION,
    message: 'Building access denied',
    userMessage: 'You don\'t have access to this building.',
    source: 'src/services/*Service.ts',
    troubleshooting: 'Verify user has building in accessibleBuildingIds.',
  },

  // ====================================================================
  // STORAGE ERRORS (STORAGE-001 to STORAGE-099)
  // ====================================================================
  'ERR-STORAGE-001': {
    code: 'ERR-STORAGE-001',
    category: ErrorCategory.STORAGE,
    message: 'File upload failed',
    userMessage: 'Unable to upload file. Please try again.',
    source: 'src/services/ticketService.ts',
    troubleshooting: 'Check file size, format, and Storage rules.',
  },
  'ERR-STORAGE-002': {
    code: 'ERR-STORAGE-002',
    category: ErrorCategory.STORAGE,
    message: 'File too large',
    userMessage: 'File is too large. Maximum size is 10MB.',
    source: 'src/services/ticketService.ts',
  },
  'ERR-STORAGE-003': {
    code: 'ERR-STORAGE-003',
    category: ErrorCategory.STORAGE,
    message: 'Invalid file type',
    userMessage: 'File type not supported. Please use PDF, PNG, JPG, or DOC.',
    source: 'src/services/ticketService.ts',
  },
  'ERR-STORAGE-004': {
    code: 'ERR-STORAGE-004',
    category: ErrorCategory.STORAGE,
    message: 'File download failed',
    userMessage: 'Unable to download file. Please try again.',
    source: 'src/services/ticketService.ts',
  },
  'ERR-STORAGE-005': {
    code: 'ERR-STORAGE-005',
    category: ErrorCategory.STORAGE,
    message: 'File deletion failed',
    userMessage: 'Unable to delete file. Please try again.',
    source: 'src/services/ticketService.ts',
  },

  // ====================================================================
  // VALIDATION ERRORS (VALIDATION-001 to VALIDATION-099)
  // ====================================================================
  'ERR-VALIDATION-001': {
    code: 'ERR-VALIDATION-001',
    category: ErrorCategory.VALIDATION,
    message: 'Required field missing',
    userMessage: 'Please fill in all required fields.',
    source: 'src/pages/*.tsx',
  },
  'ERR-VALIDATION-002': {
    code: 'ERR-VALIDATION-002',
    category: ErrorCategory.VALIDATION,
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address.',
    source: 'src/pages/*.tsx',
  },
  'ERR-VALIDATION-003': {
    code: 'ERR-VALIDATION-003',
    category: ErrorCategory.VALIDATION,
    message: 'Invalid date format',
    userMessage: 'Please enter a valid date.',
    source: 'src/pages/*.tsx',
  },
  'ERR-VALIDATION-004': {
    code: 'ERR-VALIDATION-004',
    category: ErrorCategory.VALIDATION,
    message: 'Invalid amount',
    userMessage: 'Please enter a valid amount.',
    source: 'src/pages/*.tsx',
  },
  'ERR-VALIDATION-005': {
    code: 'ERR-VALIDATION-005',
    category: ErrorCategory.VALIDATION,
    message: 'Password too weak',
    userMessage: 'Password must be at least 6 characters.',
    source: 'src/pages/Login.tsx',
  },

  // ====================================================================
  // NETWORK ERRORS (NETWORK-001 to NETWORK-099)
  // ====================================================================
  'ERR-NETWORK-001': {
    code: 'ERR-NETWORK-001',
    category: ErrorCategory.NETWORK,
    message: 'Network connection failed',
    userMessage: 'No internet connection. Please check your network.',
    source: 'Global',
    troubleshooting: 'Check device network connectivity.',
  },
  'ERR-NETWORK-002': {
    code: 'ERR-NETWORK-002',
    category: ErrorCategory.NETWORK,
    message: 'Request timeout',
    userMessage: 'Request timed out. Please try again.',
    source: 'Global',
    troubleshooting: 'Check network speed and Firebase status.',
  },
  'ERR-NETWORK-003': {
    code: 'ERR-NETWORK-003',
    category: ErrorCategory.NETWORK,
    message: 'Server unavailable',
    userMessage: 'Service temporarily unavailable. Please try again later.',
    source: 'Global',
    troubleshooting: 'Check Firebase status page.',
  },

  // ====================================================================
  // BUSINESS LOGIC ERRORS (BUSINESS-001 to BUSINESS-099)
  // ====================================================================
  'ERR-BUSINESS-001': {
    code: 'ERR-BUSINESS-001',
    category: ErrorCategory.BUSINESS,
    message: 'Budget already exists for this year',
    userMessage: 'A budget already exists for this year.',
    source: 'src/services/budgetService.ts',
  },
  'ERR-BUSINESS-002': {
    code: 'ERR-BUSINESS-002',
    category: ErrorCategory.BUSINESS,
    message: 'Ticket cannot be reopened',
    userMessage: 'This ticket cannot be reopened after 7 days.',
    source: 'src/services/ticketService.ts',
  },
  'ERR-BUSINESS-003': {
    code: 'ERR-BUSINESS-003',
    category: ErrorCategory.BUSINESS,
    message: 'Budget year must be in the future',
    userMessage: 'Budget year must be current year or later.',
    source: 'src/services/budgetService.ts',
  },
  'ERR-BUSINESS-004': {
    code: 'ERR-BUSINESS-004',
    category: ErrorCategory.BUSINESS,
    message: 'Cannot delete approved budget',
    userMessage: 'Cannot delete an approved budget.',
    source: 'src/services/budgetService.ts',
  },
  'ERR-BUSINESS-005': {
    code: 'ERR-BUSINESS-005',
    category: ErrorCategory.BUSINESS,
    message: 'Flat already assigned to person',
    userMessage: 'This flat is already assigned to another person.',
    source: 'src/services/peopleService.ts',
  },

  // ====================================================================
  // UI COMPONENT ERRORS (UI-001 to UI-099)
  // ====================================================================
  'ERR-UI-001': {
    code: 'ERR-UI-001',
    category: ErrorCategory.UI,
    message: 'Component render failed',
    userMessage: 'Something went wrong. Please refresh the page.',
    source: 'src/components/*.tsx',
    troubleshooting: 'Check component props and state.',
  },
  'ERR-UI-002': {
    code: 'ERR-UI-002',
    category: ErrorCategory.UI,
    message: 'Form submission failed',
    userMessage: 'Unable to submit form. Please try again.',
    source: 'src/pages/*.tsx',
  },
  'ERR-UI-003': {
    code: 'ERR-UI-003',
    category: ErrorCategory.UI,
    message: 'Modal failed to open',
    userMessage: 'Unable to open dialog. Please try again.',
    source: 'src/components/*.tsx',
  },

  // ====================================================================
  // API ERRORS (API-001 to API-099)
  // ====================================================================
  'ERR-API-001': {
    code: 'ERR-API-001',
    category: ErrorCategory.API,
    message: 'Email service failed',
    userMessage: 'Unable to send email. The system will retry automatically.',
    source: 'src/services/emailService.ts',
    troubleshooting: 'Check email service configuration.',
  },
  'ERR-API-002': {
    code: 'ERR-API-002',
    category: ErrorCategory.API,
    message: 'External API call failed',
    userMessage: 'Unable to connect to external service. Please try again.',
    source: 'src/services/*.ts',
  },
};

/**
 * Get error definition by code
 */
export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_REGISTRY[code];
}

/**
 * Get all errors by category
 */
export function getErrorsByCategory(category: ErrorCategory): ErrorDefinition[] {
  return Object.values(ERROR_REGISTRY).filter(err => err.category === category);
}

/**
 * Search errors by keyword
 */
export function searchErrors(keyword: string): ErrorDefinition[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(ERROR_REGISTRY).filter(
    err =>
      err.code.toLowerCase().includes(lowerKeyword) ||
      err.message.toLowerCase().includes(lowerKeyword) ||
      err.userMessage.toLowerCase().includes(lowerKeyword)
  );
}
