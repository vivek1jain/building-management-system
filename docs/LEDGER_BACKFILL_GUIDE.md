# Ledger Backfill Utility - Usage Guide

## 📋 Overview

The Ledger Backfill Utility is an administrative tool that syncs all historical service charge demands to the flat ledger system. This is a **one-time operation** per building that should be run after upgrading to the new integrated ledger system.

## 🚀 How to Access

1. Navigate to **Admin** page
2. Click on the **Data Tools** tab (database icon)
3. You'll see the **Flat Ledger Backfill Utility** card

## ⚙️ What It Does

The backfill utility performs the following operations:

- ✅ Loads all existing service charge demands from Firestore
- ✅ Creates corresponding ledger transactions with proper linking (`serviceChargeDemandId`)
- ✅ Recalculates running balances for all flats chronologically
- ✅ Enables accurate historical statements and analytics

## 📝 Step-by-Step Instructions

### Prerequisites

Before running the backfill:

1. **Select your building** in the building selector
2. **Ensure you're logged in** as an admin
3. **Open browser console** (F12 or Cmd+Option+I) to monitor progress
4. **Ensure no one is generating new demands** during the backfill process

### Running the Backfill

1. **Navigate to Admin → Data Tools**

2. **Review the information card** that explains what the utility does

3. **Click "Backfill Ledger Data"** button

4. **Read the confirmation dialog** carefully:
   ```
   ⚠️ BACKFILL CONFIRMATION
   
   This will sync ALL existing service charge demands to the flat ledger system.
   
   Building: [Your Building Name]
   
   This operation:
   - Creates ledger transactions for all historical demands
   - Recalculates running balances for all flats
   - Should only be run ONCE per building
   - May take several minutes for large datasets
   
   Do you want to proceed?
   ```

5. **Click "OK"** to proceed or "Cancel" to abort

6. **Monitor the console** for detailed progress logs

7. **Wait for completion** - You'll see:
   - Success notification: "Backfill completed successfully"
   - Result card showing completion time
   - Console logs showing all synced demands

## 📊 Console Logs to Expect

During backfill, you'll see logs like:

```
[LedgerBackfill] Starting backfill operation for building: abc123
[LedgerSync] Starting backfill for building { buildingId: "abc123" }
[LedgerSync] Found demands to backfill { buildingId: "abc123", demandsCount: 25 }
[LedgerSync] Syncing demand to ledger { demandId: "...", flatId: "...", amount: 450 }
[LedgerSync] ✅ Demand synced successfully { demandId: "...", flatId: "..." }
...
[LedgerSync] ✅ Backfill completed { totalDemands: 25, synced: 25, errors: 0 }
[LedgerBackfill] ✅ Backfill operation completed successfully
```

## ⚠️ Important Notes

### Run Only Once
- This operation should only be run **ONE TIME** per building
- Running it multiple times will create duplicate ledger entries
- If you accidentally run it twice, you may need to manually clean up duplicates

### Performance
- **Small buildings** (< 50 demands): < 30 seconds
- **Medium buildings** (50-200 demands): 1-2 minutes
- **Large buildings** (> 200 demands): 3-5 minutes

### Error Handling
- If individual demands fail, the operation continues with others
- Check the console for specific error details
- Failed demands can be manually synced later if needed

### Network Requirements
- Ensure stable internet connection
- Don't close the browser tab during backfill
- Don't navigate away from the page

## 🔍 Verification

After backfill completes, verify the data:

### 1. Check Firestore
- Go to Firestore Console → `flatLedgerTransactions` collection
- Filter by your building ID
- You should see entries with:
  - `type: SERVICE_CHARGE_DEMAND`
  - `serviceChargeDemandId` populated
  - `runningBalance` calculated
  - `quarter` and `period` fields filled

### 2. Test Statements
- Go to **Reports** page
- Generate a statement for any flat
- Verify it shows historical demands correctly
- Check that balances and totals are accurate

### 3. Check Flat Ledger View
- Go to **Finances** page
- Click on any flat's ledger icon
- You should see all historical demands listed
- Running balances should be accurate

## ❌ Troubleshooting

### Error: "No demands found"
**Cause:** No service charge demands exist for the selected building  
**Solution:** Generate some demands first, then run backfill

### Error: "Building not found"
**Cause:** No building is selected  
**Solution:** Select a building in the building selector

### Error: "Please select a building and ensure you are logged in"
**Cause:** Not authenticated or no building selected  
**Solution:** Log in and select a building

### Timeout or slow performance
**Cause:** Large dataset or slow network  
**Solution:** 
- Ensure stable internet connection
- Be patient - check console for progress
- Consider running during off-peak hours

### Duplicate entries
**Cause:** Backfill was run multiple times  
**Solution:**
- Don't run again
- Contact support for cleanup scripts
- Or manually delete duplicate `flatLedgerTransactions` in Firestore

## 🔧 Technical Details

### What Gets Synced

For each service charge demand, the backfill creates:

```typescript
{
  type: 'SERVICE_CHARGE_DEMAND',
  flatId: demand.flatId,
  flatNumber: demand.flatNumber,
  residentName: demand.residentName,
  debitAmount: demand.totalAmountDue,
  serviceChargeDemandId: demand.id, // Critical link
  quarter: demand.financialQuarterDisplayString,
  dueDate: demand.dueDate,
  transactionDate: demand.issuedDate,
  status: 'PENDING' or 'PROCESSED',
  runningBalance: (calculated),
  // ... other fields
}
```

### After Backfill

After successful backfill:
- ✅ New demands auto-sync going forward
- ✅ New payments auto-sync going forward
- ✅ Statements use authoritative ledger data
- ✅ Payment reliability scores are accurate
- ✅ Analytics reflect historical data

## 📞 Support

If you encounter issues:

1. Check the browser console for detailed error logs
2. Take a screenshot of any error messages
3. Note which building and how many demands you have
4. Review the troubleshooting section above

## 🎯 Success Criteria

After successful backfill, you should have:

- ✅ Ledger transactions for every historical demand
- ✅ Accurate running balances for all flats
- ✅ Statements showing complete transaction history
- ✅ No console errors in the logs
- ✅ Positive count in the success message

---

**Last Updated:** 2025-10-25  
**Version:** 1.0.0
