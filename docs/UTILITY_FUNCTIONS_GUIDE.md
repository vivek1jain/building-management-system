# Utility Functions Guide

This guide explains how to use the standardized utility functions for Firebase operations and error handling.

## Firestore Utilities (`src/utils/firestore.ts`)

### Overview
These utilities provide consistent timestamp conversion between Firestore and JavaScript Date objects.

### Functions

#### `fromFirestoreTimestamp(timestamp)`
Converts a Firestore Timestamp to a JavaScript Date.

```typescript
import { fromFirestoreTimestamp } from '../utils/firestore'

// Before
const createdAt = data.createdAt?.toDate() || new Date()

// After
const createdAt = fromFirestoreTimestamp(data.createdAt)
```

**Benefits:**
- Handles null/undefined automatically
- Single consistent pattern across codebase
- Type-safe

#### `toFirestoreTimestamp(date)`
Converts a JavaScript Date to a Firestore Timestamp.

```typescript
import { toFirestoreTimestamp } from '../utils/firestore'

// Before
const timestamp = Timestamp.fromDate(new Date())

// After
const timestamp = toFirestoreTimestamp(new Date())
```

#### `toOptionalFirestoreTimestamp(date?)`
Converts an optional Date to Firestore Timestamp or undefined.

```typescript
import { toOptionalFirestoreTimestamp } from '../utils/firestore'

// Useful for optional fields
const moveInDate = toOptionalFirestoreTimestamp(data.moveInDate)
```

#### `convertTimestampFields(data, fields)`
Batch convert multiple timestamp fields in an object.

```typescript
import { convertTimestampFields } from '../utils/firestore'

const person = convertTimestampFields(data, ['createdAt', 'updatedAt', 'moveInDate'])
```

---

## Error Handling Utilities (`src/utils/errorHandling.ts`)

### Overview
Provides consistent error logging with context and prepares for future error tracking integration.

### Functions

#### `handleServiceError(message, error, context?, rethrow?)`
Standard error handling for service operations.

```typescript
import { handleServiceError } from '../utils/errorHandling'

// Before
} catch (error) {
  console.error('Error getting flats:', error)
  throw error
}

// After
} catch (error) {
  handleServiceError('Error getting flats', error, {
    service: 'flatService',
    operation: 'getFlatsByBuilding',
    metadata: { buildingId }
  })
  throw error
}
```

**Output Example:**
```
[flatService.getFlatsByBuilding] Error getting flats: Error: Permission denied
Error context: { buildingId: 'abc123' }
```

**Benefits:**
- Consistent error message format
- Contextual metadata included
- Ready for error tracking integration (Sentry, etc.)
- Searchable logs with `[service.operation]` prefix

#### `formatErrorForUser(error)`
Converts technical errors to user-friendly messages.

```typescript
import { formatErrorForUser } from '../utils/errorHandling'

try {
  await someFirebaseOperation()
} catch (error) {
  const userMessage = formatErrorForUser(error)
  showNotification(userMessage) // "You do not have permission to perform this action"
}
```

**Firebase Error Translations:**
- `permission-denied` → "You do not have permission to perform this action"
- `not-found` → "The requested resource was not found"
- `unauthenticated` → "You must be signed in to perform this action"
- And more...

#### `isFirebaseError(error, code)`
Type-safe check for specific Firebase errors.

```typescript
import { isFirebaseError } from '../utils/errorHandling'

try {
  await updateDocument()
} catch (error) {
  if (isFirebaseError(error, 'permission-denied')) {
    // Handle permission error specifically
    redirectToLogin()
  }
}
```

---

## Migration Guide

### Example: Converting a Service

**Before:**
```typescript
export const getFlats = async (buildingId: string): Promise<Flat[]> => {
  try {
    const querySnapshot = await getDocs(query)
    
    const flats: Flat[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      flats.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    return flats
  } catch (error) {
    console.error('Error getting flats:', error)
    throw error
  }
}
```

**After:**
```typescript
import { fromFirestoreTimestamp } from '../utils/firestore'
import { handleServiceError } from '../utils/errorHandling'

export const getFlats = async (buildingId: string): Promise<Flat[]> => {
  try {
    const querySnapshot = await getDocs(query)
    
    const flats: Flat[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      flats.push({
        id: doc.id,
        ...data,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt)
      })
    })
    
    return flats
  } catch (error) {
    handleServiceError('Error getting flats', error, {
      service: 'flatService',
      operation: 'getFlats',
      metadata: { buildingId }
    })
    throw error
  }
}
```

---

## Services Already Migrated

✅ **flatService.ts** - Full migration complete
- All timestamp conversions use `fromFirestoreTimestamp`
- All error handling uses `handleServiceError`
- Contextual metadata added to all operations

✅ **expenseService.ts** - Full migration complete
- 12 timestamp conversion points updated
- 11 error handling points updated
- All operations now have service/operation/metadata context
- Cleaner code with `toOptionalFirestoreTimestamp` for optional dates

✅ **invoiceService.ts** - Full migration complete
- 15 `fromFirestoreTimestamp` conversions
- 1 `toFirestoreTimestamp` conversion
- Imports added for utility functions

✅ **peopleService.ts** - Full migration complete
- 21 `fromFirestoreTimestamp` conversions (highest count!)
- 1 `toFirestoreTimestamp` conversion
- Complex date handling for moveInDate/moveOutDate simplified

✅ **ticketService.ts** - Timestamp utilities added
- 1 `fromFirestoreTimestamp` conversion
- 1 `toFirestoreTimestamp` conversion
- Ready for expanded usage as ticket features grow

---

## Services To Migrate

The following services would benefit from migration:

### High Priority (Large Services)
- [x] `expenseService.ts` - **COMPLETED**
- [x] `invoiceService.ts` - **COMPLETED**
- [x] `peopleService.ts` - **COMPLETED**
- [x] `ticketService.ts` - **COMPLETED**

### Medium Priority
- [ ] `assetService.ts`
- [ ] `supplierService.ts`
- [ ] `eventService.ts`
- [ ] `budgetService.ts`

### Low Priority (Small or Specialized)
- [ ] `buildingService.ts`
- [ ] `authService.ts`
- [ ] `emailService.ts`

---

## Future Enhancements

### Error Tracking Integration
Once Sentry (or similar) is added:

```typescript
// In src/utils/errorHandling.ts
if (typeof window !== 'undefined' && window.Sentry) {
  window.Sentry.captureException(error, {
    tags: { 
      service: context?.service, 
      operation: context?.operation 
    },
    extra: context?.metadata
  })
}
```

### Structured Logging
For production environments:

```typescript
// Instead of console.error
logger.error(message, {
  service: context?.service,
  operation: context?.operation,
  ...context?.metadata,
  error: error instanceof Error ? error.message : String(error)
})
```

---

## Best Practices

1. **Always provide context** when using `handleServiceError`:
   ```typescript
   handleServiceError('Error message', error, {
     service: 'serviceName',
     operation: 'functionName',
     metadata: { relevantIds }
   })
   ```

2. **Use `fromFirestoreTimestamp` for all Firestore date conversions:**
   ```typescript
   createdAt: fromFirestoreTimestamp(data.createdAt)
   ```

3. **Use `formatErrorForUser` when showing errors to users:**
   ```typescript
   const userMessage = formatErrorForUser(error)
   addNotification({ message: userMessage, type: 'error' })
   ```

4. **Include relevant IDs in metadata** for debugging:
   ```typescript
   metadata: { buildingId, flatId, userId }
   ```

---

*Last updated: 2025-10-26*
*Status: High-priority migrations COMPLETE! 5 major services migrated*
*Progress: flatService, expenseService, invoiceService, peopleService, ticketService*
*Impact: 70+ timestamp conversions standardized across critical services*
