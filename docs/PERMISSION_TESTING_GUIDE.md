# Ticket Comment Permission Testing Guide

## What We Fixed

The permission system for ticket commenting had several issues:

1. **Hardcoded building IDs** - The `TicketDetailModal` was using hardcoded building associations instead of proper user-building mappings
2. **Bypassed permission logic** - The comment service was allowing all authenticated users to comment (development mode)
3. **Missing user-building associations** - Firebase auth users weren't properly mapped to their building contexts

## Changes Made

### 1. Created `UserBuildingService`
- Maps users to their building associations based on email/name
- Provides proper building access checks
- Handles both managers and residents

### 2. Updated `TicketDetailModal`
- Uses `UserBuildingService` to get proper building associations
- Passes correct user and building information to permission checks
- Added detailed logging for debugging

### 3. Enhanced `TicketCommentService`
- **FIXED**: Now works with both Firebase tickets and mock tickets
- Added `findTicket()` helper method to search both data sources
- Made `canUserComment()` async to support Firebase lookups
- Removed development bypass to use proper permission logic
- Added detailed logging for permission decisions
- Fixed role handling to include 'requester' role

## How to Test

### 1. Start the development server
```bash
npm run dev
```

### 2. Open browser console and run test
```javascript
// In browser console at http://localhost:3005
testPermissions()
```

### 3. Login with different users and test manually

#### Test Users (from `authService.createDemoUsers()`):
- **Manager**: `manager@building.com` / `password123`
- **Supplier**: `supplier@building.com` / `password123` 
- **Requester**: `requester@building.com` / `password123`

#### Test Steps:
1. Login as a manager
2. Go to Tickets page
3. Click on different tickets to open details
4. Check if you can see the comment form
5. Check browser console for permission logs
6. Repeat with different user types

### 4. Expected Behavior

#### Managers
- ✅ Can comment on tickets in buildings they manage
- ❌ Cannot comment on tickets in other buildings (if properly restricted)
- 🔍 Check console logs to see building access verification

#### Residents/Requesters  
- ✅ Can comment on tickets they created (`requestedBy` matches their resident ID)
- ❌ Cannot comment on other residents' tickets
- 🔍 Check console logs to see ownership verification

## Debug Information

The system now logs detailed information in the browser console:

```
🔍 Checking comment permissions: {
  userId: "user-id",
  userName: "User Name", 
  userEmail: "user@email.com",
  userRole: "manager",
  ticketId: "ticket-1",
  ticketBuildingId: "building-1", 
  ticketRequestedBy: "resident-1",
  userBuildingIds: ["building-1"],
  userResidentId: null
}

🎯 Permission check details: {
  ticketId: "ticket-1",
  ticketBuildingId: "building-1",
  ticketRequestedBy: "resident-1", 
  userId: "user-id",
  userRole: "manager",
  userBuildingIds: ["building-1"]
}

👔 Manager permission: GRANTED - Building access check
✅ Comment permission result: true
```

## Troubleshooting

### If permissions seem wrong:

1. **Check user-building mappings** in `UserBuildingService.getUserBuildingIds()`
2. **Verify ticket data** - ensure tickets have correct `buildingId` and `requestedBy` fields
3. **Check role mapping** - ensure user roles are correctly identified
4. **Review console logs** - the detailed logging should show exactly why permission was granted/denied

### Common Issues:

- **Manager can't comment**: Check if their email/name is properly mapped to building IDs
- **Resident can't comment on own ticket**: Check if their user ID matches the ticket's `requestedBy` field
- **Everyone can comment**: Check if development bypass was re-enabled

## Next Steps for Production

1. **Replace hardcoded mappings** with proper database relationships
2. **Add user-building association management** in admin interface  
3. **Implement proper role-based access control** with building-specific permissions
4. **Remove debug logging** or make it conditional based on environment
