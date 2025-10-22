# Ensuring Expenses Map to Budget Categories

## Current Issue
Expenses are being created with a hardcoded category `'reactive_maintenance'` which may not exist in the budget category masters. This prevents proper tracking of actual spending against budgeted amounts.

## Recommended Solution

### 1. **Short-term Fix** (Immediate)
Update the expense creation to use the `category` field (which exists in the Expense type) instead of `categoryId`:

**In `expenseService.ts` - line 59:**
```typescript
category: budgetCategoryId,  // Change from categoryId to category
```

**In `ticketService.ts` - line 879 and `workOrderService.ts` - line 434:**
```typescript
'Maintenance & Repairs', // Use an actual budget category name instead of 'reactive_maintenance'
```

### 2. **Medium-term Solution** (Better UX)
Add a category selection field when expenses are created/edited:

**A. For Auto-created Expenses from Tickets:**
- When a ticket is completed, the expense is created with status 'forecast'
- Add a category field to the expense that can be edited
- Provide a dropdown of available budget category masters
- Show a warning badge if an expense doesn't have a category assigned

**B. For Manual Expenses:**
- Add expense creation form with required fields:
  - Description
  - Amount
  - Date
  - **Category** (dropdown from budget category masters) - REQUIRED
  - Supplier
  - Status

### 3. **Long-term Solution** (Most Robust)
Implement category intelligence:

**A. Smart Category Mapping:**
- Analyze ticket/work order type or description
- Auto-suggest appropriate budget category
- Allow user to confirm or change

**B. Default Category Rules:**
- Maintenance tickets → "Maintenance & Repairs"
- Security tickets → "Security"
- Cleaning tickets → "Cleaning"
- etc.

**C. Expense Review Workflow:**
- Add an "Uncategorized Expenses" view
- Show expenses without valid budget categories
- Allow bulk category assignment
- Prevent marking as 'paid' without a category

### 4. **Database Integrity**
Add validation to ensure:
- Every expense has a `category` field
- The category matches an active budget category master
- Show warnings in the UI for mismatched categories

### 5. **Budget Categories Table Enhancement**
Current implementation matches expenses by category name (case-insensitive):
```typescript
expense.category?.toLowerCase() === category.name.toLowerCase()
```

This is good but requires:
- Consistent category naming
- A way to handle renamed categories
- Historical category tracking (via historicalNames in BudgetCategoryMaster)

## Implementation Priority

1. **CRITICAL** - Fix hardcoded 'reactive_maintenance' to use actual budget category names
2. **HIGH** - Add category dropdown when editing forecast expenses  
3. **MEDIUM** - Add uncategorized expenses view
4. **LOW** - Add smart category suggestions

## Files to Modify

1. **`src/services/expenseService.ts`** - Update createExpenseFromTicket to use valid category
2. **`src/services/ticketService.ts`** - Line 879 - Use valid budget category
3. **`src/services/workOrderService.ts`** - Line 434 - Use valid budget category
4. **`src/pages/Finances.tsx`** - Add expense editing UI with category dropdown
5. **Add new file**: `src/components/Expenses/ExpenseCategorySelector.tsx` - Reusable category dropdown

## Testing Checklist
- [ ] Complete a ticket and verify expense has valid category
- [ ] Check budget categories table shows correct actuals
- [ ] Rename a category and verify historicalNames matching works
- [ ] Create expense with no category and verify validation
- [ ] Bulk assign categories to uncategorized expenses
