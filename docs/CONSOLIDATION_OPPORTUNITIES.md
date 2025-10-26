# Code Consolidation Opportunities

This document tracks opportunities for reducing code duplication and improving maintainability.

## Summary

- **364** Firebase CRUD operations across services
- **58** unused service exports (potential dead code)
- Consistent patterns for error handling, timestamp conversion, and data fetching

## 1. Firebase CRUD Abstraction (HIGH IMPACT)

### Current State
Each service reimplements basic Firebase operations:
- `getDocs` queries (fetching collections)
- `getDoc` lookups (single document)
- `addDoc` creates
- `updateDoc` updates
- `deleteDoc` deletes

### Opportunity
Create a generic `FirestoreService<T>` base class or helper functions:

```typescript
// Example abstraction
class FirestoreService<T> {
  constructor(private collectionName: string) {}
  
  async getAll(buildingId?: string): Promise<T[]>
  async getById(id: string): Promise<T | null>
  async create(data: Omit<T, 'id'>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<void>
  async delete(id: string): Promise<void>
}
```

### Affected Services
- `assetService.ts`
- `flatService.ts`
- `peopleService.ts`
- `supplierService.ts`
- `invoiceService.ts`
- `expenseService.ts`
- And more...

### Estimated Impact
- Reduce ~500-800 lines of duplicated code
- More consistent error handling
- Easier to add features (caching, validation, etc.)

### Risk Level
⚠️ **HIGH** - Significant refactor, requires careful testing

---

## 2. Error Handling Standardization (MEDIUM IMPACT)

### Current State
Inconsistent error handling patterns:
```typescript
catch (error) {
  console.error('Error message:', error)
  throw error
}
```

### Opportunity
Create standardized error handling utilities:

```typescript
// src/utils/errorHandling.ts
export function handleServiceError(
  context: string,
  error: unknown,
  rethrow: boolean = true
): void {
  console.error(`[${context}] Error:`, error)
  
  // Optional: Send to error tracking service
  // trackError(error, context)
  
  if (rethrow) throw error
}
```

### Estimated Impact
- More consistent error messages
- Easier to add error tracking (Sentry, etc.)
- ~50-100 lines reduced

### Risk Level
✅ **LOW** - Simple utility function

---

## 3. Timestamp Conversion Utilities (LOW IMPACT)

### Current State
Manual timestamp conversions scattered throughout:
```typescript
createdAt: data.createdAt?.toDate() || new Date()
date: Timestamp.fromDate(updates.date)
```

### Opportunity
Create conversion utilities:

```typescript
// src/utils/firestore.ts
export const fromFirestoreTimestamp = (
  timestamp?: FirestoreTimestamp
): Date => timestamp?.toDate() || new Date()

export const toFirestoreTimestamp = (date: Date) => 
  Timestamp.fromDate(date)
```

### Estimated Impact
- Consistent date handling
- ~30-50 lines reduced

### Risk Level
✅ **LOW** - Simple utility functions

---

## 4. Unused Service Exports (QUICK WIN)

### Current State
58 exported functions that are never imported:
- `buildingService.ts`: `getBuildingsByManager`, `getMeterById`, etc.
- `invoiceService.ts`: `getInvoicesByTicket`, `searchInvoices`, etc.
- `peopleService.ts`: `getPersonById`, `getPeopleByStatus`, etc.

### Opportunity
Review and either:
1. Remove if truly unused
2. Mark as `@internal` if kept for future use
3. Add tests if part of public API

### Estimated Impact
- Clearer public API surface
- Smaller bundle (tree-shaking)

### Risk Level
✅ **LOW** - Can be done incrementally

---

## 5. Query Builder Pattern (MEDIUM IMPACT)

### Current State
Repetitive Firestore query construction:
```typescript
const q = query(
  collection(db, 'expenses'),
  where('buildingId', '==', buildingId),
  where('status', '==', 'pending'),
  orderBy('date', 'desc')
)
```

### Opportunity
Create a fluent query builder:

```typescript
const expenses = await QueryBuilder
  .from('expenses')
  .where('buildingId', buildingId)
  .where('status', 'pending')
  .orderBy('date', 'desc')
  .execute<Expense>()
```

### Estimated Impact
- More readable queries
- Type-safe query construction
- ~100-200 lines reduced

### Risk Level
⚠️ **MEDIUM** - Requires testing across services

---

## Implementation Priority

### Phase 1 (Low Risk, Quick Wins)
1. ✅ Remove unused page files (Assets, Budget, Flats, etc.) - **DONE**
2. ✅ Remove unused components (DateTimePicker) - **DONE**
3. ✅ Document unused service exports - **DONE**
4. ✅ Create timestamp conversion utilities - **DONE** (see `src/utils/firestore.ts`)
5. ✅ Standardize error handling - **DONE** (see `src/utils/errorHandling.ts`)
6. ✅ Apply utilities to flatService - **DONE** (example migration complete)
7. ✅ Create usage guide - **DONE** (see `docs/UTILITY_FUNCTIONS_GUIDE.md`)

### Phase 2 (Medium Risk, Higher Impact)
1. Create query builder pattern
2. Abstract common service patterns
3. Consolidate validation logic

### Phase 3 (High Risk, Highest Impact)
1. Create generic Firestore service abstraction
2. Migrate services to use abstraction
3. Add comprehensive tests

---

## Metrics

### Before Cleanup
- Total service files: 30+
- Unused pages: 7 (187 KB)
- Unused components: 1
- Duplicate CRUD operations: 364
- Unused exports: 58

### After Phase 1 Completion
- ✅ Unused pages removed: 7 files (187 KB)
- ✅ Unused components removed: 1 file
- ✅ Timestamp utilities created and documented
- ✅ Error handling utilities created and documented
- ✅ Example service migrated (flatService.ts)
- Remaining unused exports: 58 (documented, can be addressed incrementally)
- Duplicate patterns: Utilities created, ready for gradual migration

### Phase 2A Progress (In Progress)
- ✅ **6 services migrated** (40% of top 15):
  - flatService.ts (401 lines)
  - expenseService.ts (399 lines)
  - invoiceService.ts (487 lines)
  - peopleService.ts (467 lines)
  - ticketService.ts (933 lines)
  - serviceChargeService.ts (1,027 lines) - largest service!
- ✅ Migration guide created (SERVICE_MIGRATION_GUIDE.md)
- ✅ Analysis script for remaining services
- **Total migrated**: 3,714 lines of service code
- **Timestamp conversions standardized**: 100+
- **Error handlers upgraded**: 80+

**Remaining Services** (9 of top 15):
- buildingService.ts (514 lines, 31 timestamps, 18 errors)
- workOrderService.ts (478 lines, 1 timestamp, 13 errors)
- residentAccountService.ts (600 lines, 11 errors)
- flatLedgerSyncService.ts (442 lines, 11 errors)
- flatLedgerService.ts (587 lines, 7 errors)
- budgetApprovalWorkflowService.ts (561 lines, 8 timestamps, 6 errors)
- budgetCompletionService.ts (406 lines, 6 errors)
- creditApplicationService.ts (522 lines, 4 errors)
- serviceChargeRateIntegrationService.ts (575 lines, 5 errors)

**Impact so far**:
- 6 of 30 total services fully migrated (20%)
- 6 of 15 top services migrated (40%)
- Focus on high-impact services first
- Pattern established for future migrations

---

## Notes

- **Conservative approach**: We're prioritizing safe, incremental improvements over large refactors
- **Testing required**: Any abstraction should have comprehensive tests before migration
- **Backwards compatibility**: Maintain existing service APIs during transitions
- **Documentation**: Update docs when patterns change

---

*Last updated: 2025-10-26*
*Status: Phase 1 complete - Utilities created, documentation ready, example migration done*
*Next steps: Gradually migrate remaining services using new utilities*
