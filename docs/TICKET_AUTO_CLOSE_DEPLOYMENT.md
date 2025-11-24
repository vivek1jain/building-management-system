# Ticket Auto-Close Deployment Guide

## 🎯 Overview

This guide walks you through testing and deploying the auto-close functionality for completed tickets. The system automatically closes tickets after they've been in "Complete" status for 7 days.

## 📋 What Was Set Up

### 1. **Manual Testing Component** ✅
- Location: Admin → Data Tools tab
- Component: `TicketAutoCloseUtility`
- Purpose: Test the auto-close logic before enabling overnight automation

### 2. **Cloud Functions** ✅
- `autoCloseCompletedTickets` (Scheduled) - Runs daily at 2 AM UK time
- `manualAutoCloseCompletedTickets` (Callable) - Triggered from admin panel

### 3. **Frontend Integration** ✅
- Warning messages on Complete tickets showing days remaining
- Reopen functionality for managers within grace period
- Activity log tracking for all closures

## 🧪 Testing Phase (Now)

### Step 1: Deploy Functions to Firebase

```bash
# Make sure you're in the project root
cd /Users/ankur/Code/building-management-system

# Deploy only the functions
firebase deploy --only functions
```

**Note:** This requires Firebase Blaze plan (pay-as-you-go). The scheduled function won't work on the free Spark plan.

### Step 2: Test with Manual Trigger

1. **Navigate to Admin Panel**
   - Go to your app
   - Click "Admin" in the navigation
   - Select the "Data Tools" tab
   - You'll see the "Ticket Auto-Close Utility" card

2. **Run Manual Test**
   - Click "Run Auto-Close Now"
   - Confirm the action
   - Watch the results in the utility card
   - Check browser console for detailed logs
   - Check Firebase Functions logs: `firebase functions:log`

3. **What to Check**
   - ✅ Number of tickets processed
   - ✅ Number of tickets closed
   - ✅ Activity log entries on closed tickets
   - ✅ Tickets with < 7 days remain untouched
   - ✅ Tickets with ≥ 7 days are closed
   - ✅ UI updates reflect the closed status

### Step 3: Verify Results

Look at the tickets that were closed:

1. **Check Activity Log**
   - Action: "Manual Auto Close"
   - Description: Shows days since completion
   - Performed By: Your user ID
   - Metadata includes: completion date, days since, reason

2. **Check Status Change**
   - Status changed from "Complete" to "Closed"
   - Cannot be reopened (grace period expired)

3. **Console Logs**
   ```
   [TicketAutoClose] 🔄 Starting manual auto-close operation
   🔍 Ticket ABC123: Completed 8 days ago
   ✅ Auto-closing ticket ABC123 (completed 8 days ago)
   ⏳ Ticket XYZ789: Still within 7-day grace period (3 days remaining)
   ```

## 🚀 Production Deployment (After Testing)

Once you're satisfied with the manual tests, the scheduled function is **already deployed** and will automatically run.

### Scheduled Job Details

- **Function Name:** `autoCloseCompletedTickets`
- **Schedule:** Daily at 2:00 AM UK time
- **Timezone:** Europe/London
- **CRON Expression:** `0 2 * * *`

### The scheduled function will:

1. Run automatically every night at 2 AM
2. Find all tickets in "Complete" status
3. Check completion date from activity log
4. Close tickets that have been complete for 7+ days
5. Add activity log entry with action "Auto Closed" (system)
6. Log results to Firebase Functions logs

### Monitoring

**View Execution Logs:**
```bash
# View recent logs
firebase functions:log

# Watch logs in real-time
firebase functions:log --only autoCloseCompletedTickets
```

**What to Monitor:**
- ✅ Daily execution at 2 AM
- ✅ Number of tickets processed
- ✅ Number of tickets closed
- ✅ Any errors or warnings

## 🔧 Configuration

Grace period and schedule can be adjusted in:
- File: `src/config/ticketWorkflowConfig.ts`
- Default: 7 days grace period
- Schedule: 2 AM UK time daily

### Environment-Specific Settings

```typescript
// Production (default)
REOPENING_GRACE_PERIOD_DAYS: 7
AUTO_CLOSE_SCHEDULE_CRON: '0 2 * * *' // Daily at 2 AM

// Development (for testing)
REOPENING_GRACE_PERIOD_DAYS: 1
AUTO_CLOSE_SCHEDULE_CRON: '0 */6 * * *' // Every 6 hours
```

## 🐛 Troubleshooting

### Issue: Function Not Found Error

**Symptoms:**
```
functions/manualAutoCloseCompletedTickets is not a function
```

**Solution:**
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Issue: No Tickets Being Closed

**Check:**
1. Are there tickets in "Complete" status?
2. Have they been complete for 7+ days?
3. Does the activity log have a completion entry?
4. Check Firebase Functions logs for processing details

**Debug:**
- Run manual trigger to see detailed logs
- Check activity log format on tickets
- Verify completion date is being found correctly

### Issue: Authentication Error

**Symptoms:**
```
unauthenticated: Must be authenticated
```

**Solution:**
- Make sure you're logged in as an admin
- Refresh your session
- Check Firebase Authentication status

## 📊 Key Metrics to Track

Once in production, monitor:

1. **Daily Execution Rate**
   - Should run every day at 2 AM
   - Check for missed executions

2. **Closure Rate**
   - How many tickets are auto-closed daily?
   - Is it within expected range?

3. **Reopen Rate** (From UI)
   - How often do managers reopen tickets?
   - Low rate = good workflow adoption

4. **Grace Period Utilization**
   - Are tickets typically closed at exactly 7 days?
   - Or are they reopened within the grace period?

## 🎓 User Communication

Once deployed, inform your team:

1. **For Managers:**
   - Complete tickets now have a 7-day grace period
   - UI shows countdown: "Can be reopened for X more days"
   - After 7 days, tickets auto-close overnight
   - Manual close is still available if needed immediately

2. **For All Users:**
   - Closed tickets can no longer be reopened (after grace period)
   - Activity log shows all auto-closure events
   - Check ticket status regularly if follow-up needed

## 📁 Related Files

### Frontend
- `src/components/Admin/TicketAutoCloseUtility.tsx` - Admin testing utility
- `src/components/TicketDetailModal.tsx` - Shows grace period warnings
- `src/config/ticketWorkflowConfig.ts` - Configuration

### Backend
- `functions/src/index.ts` - Cloud Functions (source)
- `functions/lib/index.js` - Compiled functions (deployed)

### Documentation
- `docs/TICKET_WORKFLOW_GUIDE.md` - Full workflow documentation
- `docs/TICKET_AUTO_CLOSE_DEPLOYMENT.md` - This guide

## ✅ Deployment Checklist

- [x] Functions code written and tested
- [x] Functions built (`npm run build`)
- [ ] Functions deployed (`firebase deploy --only functions`)
- [ ] Manual trigger tested from admin panel
- [ ] Results verified (logs, activity log, status changes)
- [ ] Team notified about new workflow
- [ ] Scheduled function running automatically
- [ ] Monitoring set up for daily execution

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ Manual trigger successfully closes old completed tickets
2. ✅ Activity logs show detailed closure information
3. ✅ UI correctly displays grace period countdowns
4. ✅ Tickets with < 7 days remain in "Complete" status
5. ✅ Tickets with ≥ 7 days transition to "Closed" status
6. ✅ Firebase Functions logs show daily execution at 2 AM
7. ✅ No errors in function execution logs

---

**Need Help?**
- Check Firebase Functions logs: `firebase functions:log`
- Review activity logs on affected tickets
- Test with manual trigger to see detailed output
- Check browser console for frontend errors
