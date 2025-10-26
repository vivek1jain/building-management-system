# Service Migration Guide

Quick reference for migrating services to use utility functions.

## Migration Pattern

### 1. Add Imports

```typescript
// Add these two imports at the top
import { fromFirestoreTimestamp, toFirestoreTimestamp } from '../utils/firestore'
import { handleServiceError } from '../utils/errorHandling'
```

### 2. Replace Timestamp Conversions

**Pattern to find**: `?.toDate?.() || new Date(` or `.toDate()`

```typescript
// ❌ Before
createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
updatedAt: data.updatedAt?.toDate() || new Date()
financialYearStart: data.financialYearStart?.toDate()

// ✅ After
createdAt: fromFirestoreTimestamp(data.createdAt)
updatedAt: fromFirestoreTimestamp(data.updatedAt)
financialYearStart: fromFirestoreTimestamp(data.financialYearStart)
```

**For optional dates** (can be null):
```typescript
// ❌ Before
accountClosedDate: data.accountClosedDate?.toDate?.() || null

// ✅ After
accountClosedDate: data.accountClosedDate ? fromFirestoreTimestamp(data.accountClosedDate) : null
```

### 3. Replace Error Handlers

**Pattern to find**: `console.error('Error`

```typescript
// ❌ Before
} catch (error) {
  console.error('Error fetching buildings:', error)
  throw error
}

// ✅ After
} catch (error) {
  handleServiceError('Error fetching buildings', error, {
    service: 'buildingService',
    operation: 'getAllBuildings',
    metadata: { /* relevant context */ }
  })
  throw error
}
```

## Quick Migration Checklist

For each service:

- [ ] **Step 1**: Add utility imports at top
- [ ] **Step 2**: Find/replace all timestamp conversions
  - Search: `\.toDate\(\)`
  - Replace with: `fromFirestoreTimestamp()`
- [ ] **Step 3**: Find/replace all error handlers
  - Search: `console\.error\(`
  - Replace with: `handleServiceError(`
- [ ] **Step 4**: Run `npm run type-check` to verify
- [ ] **Step 5**: Test the service still works

## Remaining Services to Migrate

### High Priority (Most Impact)

1. **buildingService.ts** (514 lines)
   - 31 timestamps, 18 error handlers
   - Functions: getAllBuildings, getBuildingsByManager, getBuildingById, etc.

2. **workOrderService.ts** (478 lines)
   - 1 timestamp, 13 error handlers
   - Functions: Work order CRUD operations

3. **residentAccountService.ts** (600 lines)
   - 11 error handlers
   - Functions: Account management, credit processing

4. **flatLedgerSyncService.ts** (442 lines)
   - 11 error handlers
   - Functions: Ledger synchronization

5. **flatLedgerService.ts** (587 lines)
   - 7 error handlers
   - Functions: Ledger transactions

### Medium Priority

6. **budgetApprovalWorkflowService.ts** (561 lines)
   - 8 timestamps, 6 error handlers

7. **budgetCompletionService.ts** (406 lines)
   - 6 error handlers

8. **creditApplicationService.ts** (522 lines)
   - 4 error handlers

9. **serviceChargeRateIntegrationService.ts** (575 lines)
   - 5 error handlers

## Example: Full Migration

```typescript
// BEFORE
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getAllBuildings = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'buildings'))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }))
  } catch (error) {
    console.error('Error getting buildings:', error)
    throw error
  }
}

// AFTER
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { fromFirestoreTimestamp } from '../utils/firestore'
import { handleServiceError } from '../utils/errorHandling'

export const getAllBuildings = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'buildings'))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: fromFirestoreTimestamp(doc.data().createdAt),
      updatedAt: fromFirestoreTimestamp(doc.data().updatedAt)
    }))
  } catch (error) {
    handleServiceError('Error getting buildings', error, {
      service: 'buildingService',
      operation: 'getAllBuildings'
    })
    throw error
  }
}
```

## Testing After Migration

```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Run tests
npm run test:regression

# 4. Manual testing
npm run dev
# Test the migrated service functionality
```

## Migration Status

**Completed** ✅ (6 services):
- flatService.ts
- expenseService.ts
- invoiceService.ts
- peopleService.ts
- ticketService.ts
- serviceChargeService.ts

**To Do** (9 services):
- buildingService.ts
- workOrderService.ts
- residentAccountService.ts
- flatLedgerSyncService.ts
- flatLedgerService.ts
- budgetApprovalWorkflowService.ts
- budgetCompletionService.ts
- creditApplicationService.ts
- serviceChargeRateIntegrationService.ts

**Total Progress**: 6/15 services migrated (40%)

---

**Estimated Time**: ~30-45 minutes per service (depending on size)
**Total Remaining**: ~4-6 hours for all 9 services
