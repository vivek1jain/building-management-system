# Technical Debt Tracker

## ✅ Completed

### Console Statements (756 → 0 in production)
- **Status:** RESOLVED ✅
- **Solution:** Configured Vite with Terser to automatically strip all console.log/warn/error in production builds
- **Files:** `vite.config.ts` now includes `drop_console: true`
- **Verification:** Production build contains only 2 console statements (from Firebase SDK)
- **Logging Service:** Created `src/utils/logger.ts` for structured logging that's production-safe

## 🚧 In Progress

### Unused Exports (218 items)
- **Status:** DOCUMENTED, needs systematic removal
- **Impact:** ~50-100KB bundle bloat, no runtime issues
- **Priority:** Medium (cleanup when touching files)

#### Top Offenders:
1. **src/components/UI/index.ts** - 59 unused exports
   - Many UI components exported but not used
   - Consider creating separate entry points for different UI categories
   
2. **src/types/index.ts** - 41 unused type exports
   - Types like `Person`, `Flat`, `Building` exported but imported directly
   - Consider removing re-exports, import from source files

3. **src/services/budgetWorkflow/index.ts** - 13 unused exports
   - Barrel export file with many unused services
   
4. **src/services/invoiceService.ts** - 12 unused functions
   - `getInvoicesByTicket`, `getInvoicesByVendor`, `getPendingInvoices`, etc.
   - Future features or dead code to remove
   
5. **src/services/peopleService.ts** - 11 unused functions
   - `getPersonById`, `deletePerson`, `getPeopleByStatus`, etc.
   - Likely for future admin features

#### Unused Service Functions (Safe to Remove):
```
buildingService.ts:
- getBuildingsByManager
- getBuildingById
- getAssetById  
- getMeterById
- createMeter
- updateMeter
- deleteMeter
- searchBuildings

invoiceService.ts:
- getInvoicesByTicket
- getInvoicesByVendor
- getPendingInvoices
- getOverdueInvoices
- getAllInvoices
- getInvoiceById
- createInvoice
- updateInvoice
- deleteInvoice
- approveInvoice
- markInvoiceAsPaid
- searchInvoices

peopleService.ts:
- getPersonById
- deletePerson
- getPeopleByStatus
- getPeopleByFlat
- getPrimaryContacts
- setPrimaryContact
- updatePersonStatus
- searchPeople
- bulkUpdatePeople
- bulkCreatePeople

workOrderService.ts:
- createWorkOrder
- updateWorkOrder
- updateWorkOrderStatus
- deleteWorkOrder
- subscribeToWorkOrders
- updateWorkOrderWithSupplierAndPrice
- updateWorkOrderFinalPrice
- acceptQuoteForWorkOrder
```

#### Cleanup Strategy:
1. Mark unused exports with `@internal` JSDoc comment
2. Remove when you work on that file
3. Run `npx ts-prune` periodically to check progress
4. Use IDE "Find Usages" before removing to be sure

### Unused Variables/Imports (412 warnings)
- **Status:** WARNINGS ONLY, non-blocking
- **Impact:** Code quality, no runtime issues  
- **Priority:** Low (cleanup incrementally)

#### Top Offenders:
- `src/pages/Finances.tsx` - 41 unused vars
- `src/pages/ComprehensiveDashboard.tsx` - 40 unused vars
- `src/pages/Dashboard.tsx` - 21 unused vars
- `src/pages/Events.tsx` - 19 unused vars

#### Approach:
- Prefix unused args with `_` (already configured in ESLint)
- Remove unused imports as you work on files
- Current config: warnings only, doesn't block build

## 📊 Metrics

| Metric | Count | Status |
|--------|-------|--------|
| Source Files | 151 | - |
| Lines of Code | ~54,000 | - |
| Console Statements | 756 → 0 | ✅ FIXED |
| Unused Exports | 218 | 📋 DOCUMENTED |
| Unused Vars | 412 | ⚠️ WARNINGS |
| Test Files | 1 | ❌ NEEDS WORK |
| Bundle Size (Firebase) | 630kb | ⚠️ LARGE |

## 🎯 Next Steps

### High Priority
1. ✅ Console logging - DONE
2. 🔄 Get tests passing
3. 🔄 Remove unused service exports (safe, high impact)

### Medium Priority  
4. Clean up unused type exports
5. Add unit tests for services
6. Bundle size optimization

### Low Priority
7. Remove unused variables incrementally
8. TypeScript strict mode
9. Replace `any` types

## 🔍 How to Check

```bash
# Check unused exports
npx ts-prune | grep -v "used in module"

# Count console statements in source
grep -r "console\." src --include="*.ts" --include="*.tsx" | wc -l

# Verify production build strips console
grep "console\." dist/assets/*.js | wc -l

# Check lint warnings
npm run lint 2>&1 | grep "warning" | wc -l
```

## 📝 Notes

- All changes tested with build + lint
- Production build automatically strips console statements
- Unused exports don't hurt production, just bundle size
- Focus on unused service functions first (easy wins)
