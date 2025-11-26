# Error Code Reference Guide

## Overview

This application uses a structured error code system for consistent error handling and easy troubleshooting. Every error has a unique code, user-friendly message, and troubleshooting guidance.

## Error Code Format

```
ERR-[CATEGORY]-[NUMBER]

Examples:
- ERR-AUTH-001: Login authentication failed
- ERR-DB-002: Failed to create document
- ERR-PERMISSION-001: Insufficient permissions
```

## Quick Reference

| Code | User Message | When It Occurs |
|------|-------------|----------------|
| ERR-AUTH-001 | Unable to log in. Please check your email and password. | Wrong email/password |
| ERR-AUTH-002 | Your session has expired. Please log in again. | Session timeout |
| ERR-AUTH-003 | Account not found. Please contact support. | User exists in Auth but not Firestore |
| ERR-DB-001 | Unable to load data. Please refresh the page. | Firestore read failed |
| ERR-DB-002 | Unable to save data. Please try again. | Firestore create failed |
| ERR-PERMISSION-002 | Access denied. Please contact your administrator. | Firestore rules deny access |
| ERR-STORAGE-001 | Unable to upload file. Please try again. | File upload failed |
| ERR-NETWORK-001 | No internet connection. Please check your network. | Network unavailable |

---

## Authentication Errors (AUTH-001 to AUTH-099)

### ERR-AUTH-001
**User Message:** Unable to log in. Please check your email and password.  
**Technical:** Email/password authentication failed  
**Source:** `src/contexts/AuthContext.tsx`, `src/services/authService.ts`  
**Troubleshooting:**
- Verify email and password are correct
- Check if account exists
- Ensure Firebase Auth is configured correctly
- Check browser console for Firebase error details

### ERR-AUTH-002
**User Message:** Your session has expired. Please log in again.  
**Technical:** User session expired or invalid  
**Source:** `src/contexts/AuthContext.tsx`  
**Troubleshooting:**
- User needs to re-authenticate
- Check if token refresh is working
- Verify Firebase Auth session timeout settings

### ERR-AUTH-003
**User Message:** Account not found. Please contact support.  
**Technical:** User account not found in database  
**Source:** `src/contexts/AuthContext.tsx`, `src/services/authService.ts`  
**Troubleshooting:**
- User authenticated in Firebase Auth but no Firestore user document
- Run: Check if user document exists in `users` collection
- Create user document if missing

### ERR-AUTH-004
**User Message:** Unable to create account. Please try again.  
**Technical:** Registration failed  
**Source:** `src/contexts/AuthContext.tsx`  
**Troubleshooting:**
- Check Firebase Auth settings
- Verify email validation rules
- Check if email domain is allowed

### ERR-AUTH-005
**User Message:** An account with this email already exists.  
**Technical:** Email already in use  
**Source:** `src/contexts/AuthContext.tsx`  
**Troubleshooting:**
- User should log in instead of registering
- Offer password reset if user forgot password

### ERR-AUTH-006
**User Message:** Unable to log out. Please try again.  
**Technical:** Logout failed  
**Source:** `src/contexts/AuthContext.tsx`  
**Troubleshooting:**
- Usually rare, check network connection
- Clear browser cache and try again

### ERR-AUTH-007
**User Message:** Unable to send password reset email. Please try again.  
**Technical:** Password reset failed  
**Source:** `src/services/authService.ts`  
**Troubleshooting:**
- Verify email address is correct
- Check Firebase Auth email templates are configured
- Check spam folder

---

## Database Errors (DB-001 to DB-099)

### ERR-DB-001
**User Message:** Unable to load data. Please refresh the page.  
**Technical:** Failed to fetch data from Firestore  
**Source:** All service files  
**Troubleshooting:**
- Check network connection
- Verify Firestore rules allow read access
- Check Firebase Console for service status
- Review Firestore indexes for queries

### ERR-DB-002
**User Message:** Unable to save data. Please try again.  
**Technical:** Failed to create document  
**Source:** All service files  
**Troubleshooting:**
- Check Firestore rules allow creation for user role
- Verify data format matches schema
- Check for required fields

### ERR-DB-003
**User Message:** Unable to update. Please try again.  
**Technical:** Failed to update document  
**Source:** All service files  
**Troubleshooting:**
- Check Firestore rules allow updates for user role
- Verify document exists
- Check if user has permission to update specific fields

### ERR-DB-004
**User Message:** Unable to delete. Please try again.  
**Technical:** Failed to delete document  
**Source:** All service files  
**Troubleshooting:**
- Check Firestore rules allow deletion
- In production, some collections (finances) disable deletion

### ERR-DB-005
**User Message:** Item not found. It may have been deleted.  
**Technical:** Document not found  
**Source:** All service files  
**Troubleshooting:**
- Verify document ID is correct
- Check if document was deleted by another user
- Refresh the page to get latest data

### ERR-DB-006
**User Message:** Unable to search. Please try again.  
**Technical:** Query failed  
**Source:** All service files  
**Troubleshooting:**
- Check Firestore indexes exist for this query
- Go to Firebase Console → Firestore → Indexes
- Create missing indexes (Firebase will show link in error)

---

## Permission Errors (PERMISSION-001 to PERMISSION-099)

### ERR-PERMISSION-001
**User Message:** You don't have permission to perform this action.  
**Technical:** Insufficient permissions  
**Source:** All service files  
**Troubleshooting:**
- Check user role (admin, manager, finance, etc.)
- Verify Firestore security rules for this operation
- Contact admin to request necessary permissions

### ERR-PERMISSION-002
**User Message:** Access denied. Please contact your administrator.  
**Technical:** Permission denied by Firestore rules  
**Source:** All service files  
**Troubleshooting:**
- Review Firestore rules for collection
- Check if user has correct role
- Verify user's `accessibleBuildingIds` includes target building
- Check Firebase Console → Firestore → Rules

### ERR-PERMISSION-003
**User Message:** You don't have access to this building.  
**Technical:** Building access denied  
**Source:** All service files  
**Troubleshooting:**
- User doesn't have building in `accessibleBuildingIds`
- Admin needs to grant building access
- Check user document in Firestore

---

## Storage Errors (STORAGE-001 to STORAGE-099)

### ERR-STORAGE-001
**User Message:** Unable to upload file. Please try again.  
**Technical:** File upload failed  
**Source:** `src/services/ticketService.ts`  
**Troubleshooting:**
- Check file size (max 10MB)
- Verify file format is allowed
- Check Firebase Storage rules
- Verify network connection

### ERR-STORAGE-002
**User Message:** File is too large. Maximum size is 10MB.  
**Technical:** File too large  
**Source:** `src/services/ticketService.ts`  
**Troubleshooting:**
- Compress file before uploading
- Use file compression tools
- Maximum size: 10MB

### ERR-STORAGE-003
**User Message:** File type not supported. Please use PDF, PNG, JPG, or DOC.  
**Technical:** Invalid file type  
**Source:** `src/services/ticketService.ts`  
**Troubleshooting:**
- Convert file to supported format
- Supported: PDF, PNG, JPG, JPEG, DOC, DOCX

### ERR-STORAGE-004
**User Message:** Unable to download file. Please try again.  
**Technical:** File download failed  
**Source:** `src/services/ticketService.ts`  
**Troubleshooting:**
- Check if file still exists in Storage
- Verify download URL is valid
- Check network connection

### ERR-STORAGE-005
**User Message:** Unable to delete file. Please try again.  
**Technical:** File deletion failed  
**Source:** `src/services/ticketService.ts`  
**Troubleshooting:**
- Check Firebase Storage rules
- Verify file exists
- Check user permissions

---

## Validation Errors (VALIDATION-001 to VALIDATION-099)

### ERR-VALIDATION-001
**User Message:** Please fill in all required fields.  
**Technical:** Required field missing  
**Source:** Form components  
**Troubleshooting:**
- Check which fields are marked as required
- Ensure all required fields have values

### ERR-VALIDATION-002
**User Message:** Please enter a valid email address.  
**Technical:** Invalid email format  
**Source:** Form components  
**Troubleshooting:**
- Check email format (must include @)
- Remove spaces
- Example: user@example.com

### ERR-VALIDATION-003
**User Message:** Please enter a valid date.  
**Technical:** Invalid date format  
**Source:** Form components  
**Troubleshooting:**
- Use date picker if available
- Format: YYYY-MM-DD or MM/DD/YYYY

### ERR-VALIDATION-004
**User Message:** Please enter a valid amount.  
**Technical:** Invalid amount  
**Source:** Form components  
**Troubleshooting:**
- Use numbers only
- No currency symbols
- Example: 100.50 (not $100.50)

### ERR-VALIDATION-005
**User Message:** Password must be at least 6 characters.  
**Technical:** Password too weak  
**Source:** `src/pages/Login.tsx`  
**Troubleshooting:**
- Use at least 6 characters
- Mix letters and numbers for better security

---

## Network Errors (NETWORK-001 to NETWORK-099)

### ERR-NETWORK-001
**User Message:** No internet connection. Please check your network.  
**Technical:** Network connection failed  
**Source:** Global  
**Troubleshooting:**
- Check internet connection
- Try accessing another website
- Restart router if needed
- Check if firewall is blocking

### ERR-NETWORK-002
**User Message:** Request timed out. Please try again.  
**Technical:** Request timeout  
**Source:** Global  
**Troubleshooting:**
- Check network speed
- Try again in a few moments
- Check Firebase status page
- Clear browser cache

### ERR-NETWORK-003
**User Message:** Service temporarily unavailable. Please try again later.  
**Technical:** Server unavailable  
**Source:** Global  
**Troubleshooting:**
- Firebase service may be down
- Check Firebase status: https://status.firebase.google.com
- Wait 5-10 minutes and try again

---

## Business Logic Errors (BUSINESS-001 to BUSINESS-099)

### ERR-BUSINESS-001
**User Message:** A budget already exists for this year.  
**Technical:** Budget already exists for this year  
**Source:** `src/services/budgetService.ts`  
**Troubleshooting:**
- Edit existing budget instead of creating new one
- Delete existing budget first (if you have permissions)
- Use different year

### ERR-BUSINESS-002
**User Message:** This ticket cannot be reopened after 7 days.  
**Technical:** Ticket cannot be reopened  
**Source:** `src/services/ticketService.ts`  
**Troubleshooting:**
- Ticket completed more than 7 days ago
- Create new ticket instead
- Contact manager for override

### ERR-BUSINESS-003
**User Message:** Budget year must be current year or later.  
**Technical:** Budget year must be in the future  
**Source:** `src/services/budgetService.ts`  
**Troubleshooting:**
- Cannot create budget for past years
- Use current year or future year

### ERR-BUSINESS-004
**User Message:** Cannot delete an approved budget.  
**Technical:** Cannot delete approved budget  
**Source:** `src/services/budgetService.ts`  
**Troubleshooting:**
- Approved budgets are locked
- Contact admin to unapprove first

### ERR-BUSINESS-005
**User Message:** This flat is already assigned to another person.  
**Technical:** Flat already assigned to person  
**Source:** `src/services/peopleService.ts`  
**Troubleshooting:**
- Unassign flat from other person first
- Check if flat is occupied

---

## For Developers

### How to Use Error Codes in Your Code

#### 1. Import Error Handlers
```typescript
import { handleFirebaseError, createAppError, formatErrorForUser } from '../utils/errorHandler';
```

#### 2. In Service Functions
```typescript
async function createTicket(data: TicketData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'tickets'), data);
    return docRef.id;
  } catch (error: any) {
    const appError = handleFirebaseError(error, {
      action: 'createTicket',
      data,
    });
    throw appError;
  }
}
```

#### 3. Use Specific Error Codes
```typescript
if (!user) {
  throw createAppError('ERR-AUTH-003', { userId: uid });
}

if (!ticket) {
  throw createAppError('ERR-DB-005', { ticketId: id });
}
```

#### 4. In UI Components
```typescript
try {
  await createTicket(formData);
} catch (error) {
  const userMessage = formatErrorForUser(error);
  showNotification(userMessage); // Shows: "Unable to save data. Please try again. (ERR-DB-002)"
}
```

### Quick Service Error Handling
Use the wrapper utility:

```typescript
import { handleServiceError } from '../utils/serviceErrorWrapper';

try {
  // your code
} catch (error: any) {
  handleServiceError(error, 'ticketService', 'createTicket', { userId });
}
```

### Adding New Error Codes

1. Add to `src/utils/errorCodes.ts`:
```typescript
'ERR-NEWCAT-001': {
  code: 'ERR-NEWCAT-001',
  category: ErrorCategory.NEWCAT,
  message: 'Technical description',
  userMessage: 'User-friendly message',
  source: 'src/path/to/file.ts',
  troubleshooting: 'How to fix',
},
```

2. Document in this file

3. Use in your code

---

## Support

When reporting errors to support, always include:
1. **Error Code** (e.g., ERR-AUTH-001)
2. **When it occurred** (what you were doing)
3. **Your role** (admin, manager, resident, etc.)
4. **Screenshot** (if possible)

This helps us resolve issues quickly!

---

## Error Monitoring

All errors are automatically tracked in Sentry (if configured) with:
- Error code
- User context (ID, email, role)
- Action being performed
- Full stack trace
- Browser and device info

Developers and support team can view these in the Sentry dashboard.
