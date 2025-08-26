# Ticket Workflow: Complete to Closed Transition with Reopening Grace Period

## Overview

This document describes the enhanced ticket workflow system that introduces a 7-day grace period between ticket completion and permanent closure, allowing managers to reopen tickets if needed.

## Workflow States

### Previous Workflow (Legacy)
```
New → Quoting → Scheduled → Complete → Closed (permanent)
```

### New Workflow (Current)
```
New → Quoting → Scheduled → Complete (7-day grace period) → Closed (permanent)
                                ↑                              ↑
                                └── Reopen (managers only) ────┘
```

## Key Features

### 1. Grace Period System
- **Duration**: 7 days (configurable)
- **Status**: Complete tickets remain in "Complete" status during grace period
- **Auto-closure**: After 7 days, tickets automatically transition to "Closed"
- **Visibility**: Users see countdown ("Can be reopened for 3 more days")

### 2. Reopening Capability
- **Who**: Managers and Admins only
- **When**: Within 7 days of completion
- **Action**: Changes status from "Complete" back to "Scheduled"
- **Tracking**: All reopening actions are logged with reasons

### 3. Automated Management
- **Scheduled Job**: Runs daily at 2 AM UK time
- **Batch Processing**: Handles up to 500 tickets per batch
- **Activity Logging**: Automatically documents all transitions

## User Interface Changes

### Complete Status Display
```
✅ Work Completed
   Can be reopened for 4 more days

   The work has been completed. This ticket will auto-close after 7 days.

   ⚠️ Re-open Available
   You can re-open this ticket for 4 more days if needed.

   [Re-open Ticket] [Close Now]
```

### Closed Status Display (Legacy Tickets)
```
📁 Closed Ticket
   No further actions needed

   This ticket has been completed and closed.
```

## Technical Implementation

### 1. Database Changes
- No schema changes required
- Uses existing `activityLog` for tracking completion dates
- Maintains backward compatibility

### 2. Service Methods Added
```typescript
// Check if ticket can be reopened
canTicketBeReopened(ticketId: string): Promise<{
  canReopen: boolean;
  daysRemaining: number;
  reason?: string;
}>

// Reopen a Complete ticket
reopenTicket(ticketId: string, userId: string, reason?: string): Promise<void>

// Complete with grace period tracking
completeTicket(ticketId: string, userId: string, notes?: string): Promise<void>

// Get tickets eligible for auto-closure
getTicketsEligibleForAutoClosure(): Promise<Ticket[]>
```

### 3. Cloud Function
```typescript
// Scheduled function (runs daily at 2 AM UK time)
export const autoCloseCompletedTickets = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Europe/London')
  .onRun(async (context) => {
    // Find Complete tickets older than 7 days
    // Transition them to Closed status
    // Log all actions
  })
```

## Configuration

### Environment Settings
```typescript
// Production (default)
REOPENING_GRACE_PERIOD_DAYS: 7
AUTO_CLOSE_SCHEDULE_CRON: '0 2 * * *' // Daily at 2 AM

// Development (for testing)
REOPENING_GRACE_PERIOD_DAYS: 1
AUTO_CLOSE_SCHEDULE_CRON: '0 */6 * * *' // Every 6 hours

// Testing
REOPENING_GRACE_PERIOD_DAYS: 0
AUTO_CLOSE_ENABLED: false
```

### Permissions
```typescript
REOPEN_ALLOWED_ROLES: ['manager', 'admin']
MANUAL_CLOSE_ALLOWED_ROLES: ['manager', 'admin']
```

## Activity Log Examples

### Completion
```
🔄 Work Completed
   Work marked as completed: All repairs finished successfully
   by John Manager on 15 Dec 2024, 14:30
```

### Reopening
```
🔄 Ticket Reopened  
   Ticket reopened from Complete status: Found additional work needed
   by Sarah Admin on 18 Dec 2024, 09:15
```

### Auto-closure
```
🔄 Auto Closed
   Ticket automatically closed after 7 days (completed 8 days ago)
   by system on 23 Dec 2024, 02:00
```

## Migration Process

### For Existing Closed Tickets
1. **Analysis**: Find Closed tickets closed within last 7 days
2. **Migration**: Change status from Closed → Complete
3. **Documentation**: Add migration activity log entry
4. **Validation**: Confirm correct grace periods

### Migration Script Usage
```typescript
import { runMigrationWithConfirmation } from './utils/migrateTicketWorkflow'

// Run migration with dry-run first
await runMigrationWithConfirmation()
```

## Benefits

### 1. Improved Flexibility
- Fixes accidental closures
- Allows additional work discovery
- Reduces ticket recreation

### 2. Better Control
- Manager-only reopening prevents abuse
- Time-limited window maintains closure discipline
- Automatic closure ensures cleanup

### 3. Audit Trail
- All actions logged with reasons
- Grace period tracking
- Migration documentation

### 4. Backward Compatibility
- Existing Closed tickets remain unchanged (unless migrated)
- No breaking changes to existing workflows
- Gradual transition possible

## User Workflows

### Manager: Complete and Close Ticket
1. Mark work as complete → Status: "Complete"
2. See 7-day countdown in UI
3. Option 1: Let it auto-close after 7 days
4. Option 2: Manually close immediately
5. Option 3: Reopen if additional work needed

### Manager: Reopen Completed Ticket
1. Open Complete ticket (within 7 days)
2. See "Re-open Available" section
3. Click "Re-open Ticket"
4. Provide reason (optional)
5. Ticket returns to "Scheduled" status

### System: Auto-closure Process
1. Daily job runs at 2 AM UK time
2. Find Complete tickets > 7 days old
3. Batch update to Closed status
4. Add auto-closure activity log entries
5. Log summary statistics

## Monitoring and Maintenance

### Key Metrics to Track
- Number of tickets reopened (should be low)
- Average time in Complete status
- Auto-closure job success rate
- Migration success metrics

### Health Checks
- Scheduled function execution
- Batch processing performance
- Activity log consistency
- Grace period calculation accuracy

### Troubleshooting Common Issues

#### 1. Ticket Can't Be Reopened
- **Check**: User role (manager/admin only)
- **Check**: Grace period (within 7 days)
- **Check**: Completion activity log exists

#### 2. Auto-closure Not Working
- **Check**: Cloud function deployment
- **Check**: Schedule configuration
- **Check**: Firestore permissions
- **Check**: Batch size limits

#### 3. Incorrect Grace Period Calculations
- **Check**: Activity log completion entries
- **Check**: Timezone configurations
- **Check**: Date conversion logic

## Future Enhancements

### Planned Features
1. **Configurable Grace Periods**: Per-ticket-type or per-building
2. **Expiry Notifications**: Email alerts before auto-closure
3. **Bulk Reopening**: Manager dashboard for multiple tickets
4. **Analytics Dashboard**: Grace period utilization metrics
5. **Mobile App Support**: Reopening from mobile interface

### Possible Integrations
- Slack/Teams notifications for reopening
- Calendar integration for grace period tracking
- Reporting dashboards for workflow analytics
- API endpoints for external systems

## Testing Strategy

### Unit Tests
- Grace period calculations
- Reopening eligibility logic
- Activity log generation
- Configuration handling

### Integration Tests  
- Complete workflow end-to-end
- Auto-closure scheduled function
- Migration script validation
- Permission enforcement

### Manual Test Cases
1. Complete ticket → wait 3 days → reopen → complete again
2. Complete ticket → manually close immediately
3. Complete ticket → wait 8 days → verify auto-closed
4. Migration script on various ticket states
5. Permission testing (resident tries to reopen)

## Support and Contact

For questions about this workflow:
- **Technical Issues**: Development team
- **Business Logic**: Product/Management team
- **Configuration**: DevOps/Infrastructure team

## Version History

- **v1.0.0** (Dec 2024): Initial implementation with 7-day grace period
- **v0.9.0** (Dec 2024): Development and testing phase
- **v0.8.0** (Dec 2024): Design and planning phase
