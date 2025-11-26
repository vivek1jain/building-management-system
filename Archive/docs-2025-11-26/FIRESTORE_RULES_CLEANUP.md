# Firestore Rules - Staging Ready Configuration

## Summary
Cleaned up `firestore.rules` to remove all development-specific relaxed permissions and TODOs, making it staging/production ready.

## Changes Made

### Removed Development Exceptions
All "TEMPORARILY RELAXED FOR DEVELOPMENT" comments and permissions have been removed or tightened:

1. **Users Collection**
   - ❌ Removed: Demo user creation without authentication
   - ✅ Now: Users can only be created during their own signup/invitation flow
   - ✅ Maintained: All authenticated users can read user profiles (needed for permission checks)

2. **Tickets Collection**
   - ✅ Now: Only ticket creator or managers can update tickets
   - Previously: All authenticated users could update any ticket

3. **Suppliers Collection**
   - ❌ Removed: Public read/create access (`allow read, create: if true`)
   - ✅ Now: Requires authentication to read, managers to create/update/delete

4. **Building Events**
   - ✅ Now: Only managers can create events (previously any authenticated user)

5. **Budgets Collection**
   - ✅ Now: Only managers can create/update budgets (previously any authenticated user)

6. **Budget Category Masters**
   - ✅ Now: Only managers can create/update (previously any authenticated user)

7. **Buildings Collection**
   - ✅ Now: Only managers can create/update buildings (previously any authenticated user)
   - ✅ Now: Only admins can delete buildings (previously managers could too)

8. **Income Collection**
   - ✅ Now: Only admins can delete income entries (previously managers could too)

9. **Email Logs**
   - ✅ Now: Only managers can read email logs (previously all authenticated users)

10. **Work Orders**
    - ✅ Now: Only managers can create/update (previously any authenticated user)

11. **People Collection**
    - ✅ Now: Only managers can create/update people (previously any authenticated user)

12. **Financial Collections**
    - flatLedgerTransactions: Now requires manager role to create/update
    - residentAccountLedgers: Now requires manager role to create/update
    - accountTransactions: Now requires manager role to create/update

## Security Model

### Role Hierarchy
```
Admin > Manager > Finance > Resident/Supplier > Guest
```

### Permission Patterns

#### Read Access
- **Public**: invitations (with secure token), test collection
- **All Authenticated**: Most collections (data filtering happens in app layer)
- **Managers Only**: Email logs
- **Owner + Managers**: User profiles

#### Write Access
- **Managers**: Create/update most collections
- **Admins Only**: Delete sensitive data (budgets, buildings, financial records)
- **Finance Role**: Income and expenditure management
- **Ticket Creators**: Can update their own tickets

### Multi-Tenant Isolation
- Building-based filtering is handled in the **application layer** (not Firestore rules)
- Residents can read data across buildings but app filters by their assigned building
- This approach is appropriate for staging where:
  - Small number of buildings/tenants
  - Trusted user base
  - Performance is prioritized over strict data isolation

## Collections Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| users | All auth / Self | Self | Self / Managers | Managers |
| tickets | All auth | All auth | Creator / Managers | Managers |
| suppliers | All auth | Managers | Managers | Managers |
| quotes | All auth | All auth | Managers | Managers |
| buildingEvents | All auth | Managers | Assignee / Managers | Managers |
| budgets | All auth | Managers | Managers | Admins |
| budgetCategories | All auth | Managers | Managers | Admins |
| budgetCategoryMasters | All auth | Managers | Managers | Admins |
| expenses | Managers | Managers | Managers | Managers |
| flats | All auth† | Managers | Managers | Managers |
| serviceChargeDemands | All auth | Managers | Managers | Managers |
| invoices | All auth | Managers/Finance | Managers/Finance | Admins |
| buildings | All auth | Managers | Managers | Admins |
| assets | All auth | Managers | Managers | Admins |
| meters | All auth | Managers | Managers | Admins |
| income | All auth | Managers/Finance | Managers/Finance | Admins |
| emailLogs | Managers | System | Managers | Managers |
| workOrders | All auth | Managers | Managers | Managers |
| expenditure | All auth | Managers/Finance | Managers/Finance | Admins |
| reminders | All auth | Managers/Finance | Managers/Finance | Admins |
| people | All auth | Managers | Managers | Managers |
| flatLedgerTransactions | All auth | Managers | Managers | Admins |
| residentAccountLedgers | All auth | Managers | Managers | Admins |
| accountTransactions | All auth | Managers | Managers | Admins |
| invitations | Public | Managers | Public‡ | Admins |
| test | All auth | All auth | All auth | All auth |

† Flats have additional resident-specific filtering in rules  
‡ Invitations use secure token validation in app

## Deployment

To deploy these rules to Firebase:

```bash
# Re-authenticate if needed
firebase login --reauth

# Deploy rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

## Testing Recommendations

After deploying, test the following scenarios:

1. **Manager Role**
   - ✅ Can create budgets, buildings, people, work orders
   - ✅ Can read all tickets and email logs
   - ✅ Can update suppliers and assets

2. **Resident Role**
   - ✅ Can create tickets
   - ✅ Can read buildings and events
   - ❌ Cannot create budgets or buildings
   - ❌ Cannot read email logs

3. **Supplier Role**
   - ✅ Can read suppliers
   - ✅ Can create quotes
   - ❌ Cannot create suppliers
   - ❌ Cannot update buildings

4. **Unauthenticated**
   - ✅ Can read invitations (by secure token)
   - ❌ Cannot read any other collections

## Future Hardening (Production)

For full production deployment, consider:

1. **Stricter Multi-Tenant Isolation**
   - Add building-based filtering at Firestore rules level
   - Residents should only read data for their building

2. **Audit Logging**
   - Log all delete operations
   - Track sensitive data access

3. **Rate Limiting**
   - Implement Firebase App Check
   - Add rate limiting for public endpoints (invitations)

4. **Field-Level Security**
   - Restrict which fields can be updated by different roles
   - Validate data types and ranges in rules

5. **Remove Test Collection**
   - Disable or restrict test collection in production

## Status

- ✅ Development TODOs removed
- ✅ Relaxed permissions tightened
- ✅ Consistent use of helper functions (canManage, isAuthenticated)
- ✅ Clear comments explaining each permission
- ✅ Single unified rules file (removed duplicate production file)
- ✅ Ready for staging deployment
- ⏳ Awaiting Firebase authentication for deployment

## Files Configuration

- **firestore.rules** - Single staging-ready rules file (active)
- **firebase.json** - Points to firestore.rules
- **firestore.indexes.json** - Database indexes (maintained separately)

**Note**: Previously there was a separate `firestore.rules.production` file with stricter building isolation. This has been removed to avoid confusion. When you need production-level isolation, you can tighten the current rules file.

---

**Last Updated**: 2025-11-26  
**Status**: Staging Ready - Single Unified Rules File  
**Next Step**: Run `firebase login --reauth` and deploy rules
