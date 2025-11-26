# Firestore Security Rules - Production Audit

## Current Status: DEVELOPMENT RULES ⚠️

The current `firestore.rules` file contains **TEMPORARILY RELAXED** rules that are **NOT SAFE FOR PRODUCTION**.

## Critical Security Issues in Current Rules

### 1. Open User Registration (Line 34)
```javascript
allow create: if true;  // ❌ CRITICAL: Anyone can create user accounts
```
**Risk**: Attackers can create unlimited accounts  
**Fix**: Use invitation-only system

### 2. Unrestricted Supplier Access (Line 73)
```javascript
allow read, create: if true;  // ❌ CRITICAL: No authentication required
```
**Risk**: Public can read and create suppliers  
**Fix**: Require authentication for read, managers for create

### 3. Financial Data Deletion Allowed (Line 266, 349, 371)
```javascript
allow delete: if isManager();  // ❌ HIGH RISK: Financial audit trail can be erased
```
**Risk**: Managers can delete financial records  
**Fix**: Disable delete for financial collections (income, expenses, ledgers)

### 4. No Multi-Tenant Isolation
```javascript
allow read: if isAuthenticated();  // ❌ HIGH RISK: Users can access all buildings
```
**Risk**: Users from Building A can see data from Building B  
**Fix**: Implement `hasAccessToBuilding()` checks

### 5. Overly Permissive Ticket Access (Line 55)
```javascript
allow read: if isAuthenticated();  // ❌ MEDIUM RISK: All users see all tickets
```
**Risk**: Privacy violations, data leakage  
**Fix**: Users should only see their own tickets or tickets for their building

### 6. Budget Creation Too Open (Line 115)
```javascript
allow create, update: if isAuthenticated();  // ❌ MEDIUM RISK: Anyone can modify budgets
```
**Risk**: Unauthorized budget manipulation  
**Fix**: Restrict to finance, manager, admin roles

### 7. People Collection Open (Line 337)
```javascript
allow create, update: if isAuthenticated();  // ❌ MEDIUM RISK: Anyone can modify resident data
```
**Risk**: Unauthorized access to personal information  
**Fix**: Restrict to managers only

## Production Rules Comparison

| Collection | Current (Dev) | Production | Impact |
|------------|---------------|------------|--------|
| users | Open registration | Invitation-only | 🔴 Critical |
| suppliers | Public read/create | Auth req'd | 🔴 Critical |
| tickets | All users see all | Building-scoped | 🟡 High |
| budgets | Anyone can edit | Finance-only | 🟡 High |
| income/expenses | Deletable | No delete | 🟡 High |
| people | Anyone can edit | Managers-only | 🟡 High |
| flats | Basic auth | Building-scoped | 🟡 High |

## Migration Plan

### Step 1: Backup Current Data
```bash
# Export all collections
firebase firestore:export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
```

### Step 2: Test Production Rules in Staging

1. Create a staging Firebase project
2. Copy production rules to staging
3. Run full test suite
4. Verify multi-tenant isolation
5. Test all user roles

### Step 3: Deploy Production Rules

```bash
# Copy production rules
cp firestore.rules.production firestore.rules

# Test locally (if using emulator)
firebase emulators:start

# Deploy to production
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules get
```

### Step 4: Verify Production Rules

Run these tests after deployment:

```bash
# Test 1: Verify user can't create accounts without invitation
# Expected: Permission denied

# Test 2: Verify user can't access other building's data
# Expected: Empty result set

# Test 3: Verify financial records can't be deleted
# Expected: Permission denied

# Test 4: Verify managers can't see other buildings
# Expected: Only their building's data
```

## Required Code Changes

### 1. Update User Model

Ensure all users have `accessibleBuildingIds` field:

```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
  accessibleBuildingIds: string[];  // Required for multi-tenant isolation
  // ... other fields
}
```

### 2. Update User Creation Flow

```typescript
// When creating users, always set accessibleBuildingIds
const newUser = {
  ...userData,
  accessibleBuildingIds: [buildingId],  // Must be set
  role: 'resident',  // Default role
};
```

### 3. Query Scoping

Update all Firestore queries to filter by building:

```typescript
// ❌ Before (gets all tickets)
const tickets = await getDocs(collection(db, 'tickets'));

// ✅ After (gets only user's building tickets)
const tickets = await getDocs(
  query(
    collection(db, 'tickets'),
    where('buildingId', 'in', user.accessibleBuildingIds)
  )
);
```

### 4. Disable User Registration UI

```typescript
// In Login.tsx, comment out registration option
// Only allow login with existing accounts
// Use invitation system for new users
```

## Multi-Tenant Isolation Strategy

### Building Access Model

```typescript
// Each user has accessibleBuildingIds
user = {
  id: 'user123',
  accessibleBuildingIds: ['building1', 'building2'],
  role: 'manager'
}

// Security rule checks
function hasAccessToBuilding(buildingId) {
  return getUserData().role in ['admin', 'manager'] ||
         buildingId in getUserData().accessibleBuildingIds;
}
```

### Admin vs Manager vs Resident

- **Admin**: Access to ALL buildings (no building filter)
- **Manager**: Access to assigned buildings only
- **Resident**: Access to their single building

## Testing Production Rules

### Manual Testing Checklist

- [ ] Create test users for each role
- [ ] Verify admin can access all buildings
- [ ] Verify manager can only access assigned buildings
- [ ] Verify resident can only access their building
- [ ] Verify resident can't see other residents' data
- [ ] Verify financial records can't be deleted
- [ ] Verify suppliers require authentication
- [ ] Verify user registration is disabled

### Automated Testing

Use Firebase Emulator Suite:

```bash
# Install emulator
npm install -g firebase-tools

# Start with production rules
firebase emulators:start --import=./test-data

# Run security rules tests
npm run test:security-rules
```

## Rollback Procedure

If issues occur after deploying production rules:

```bash
# 1. Immediately revert to development rules
cp firestore.rules.dev firestore.rules
firebase deploy --only firestore:rules

# 2. Investigate issues
# 3. Fix production rules
# 4. Test in staging
# 5. Redeploy
```

## Ongoing Security Maintenance

### Monthly Security Review

1. Review Firebase Console → Authentication → Users
2. Check for suspicious account creation patterns
3. Review Firestore usage metrics for anomalies
4. Audit admin/manager role assignments
5. Review and rotate API keys if needed

### Quarterly Security Audit

1. Full penetration testing
2. Review all security rules for new collections
3. Update documentation
4. Train team on security best practices

## Additional Security Hardening

### 1. Enable Firebase App Check

See `FIREBASE_APP_CHECK.md` for setup instructions.

### 2. Rate Limiting

Implement Cloud Functions with rate limiting:

```typescript
// Example: Limit ticket creation to 10/hour per user
exports.createTicketRateLimit = functions.https.onCall(async (data, context) => {
  const userId = context.auth.uid;
  const recentTickets = await getRecentTicketCount(userId, '1h');
  
  if (recentTickets >= 10) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many tickets created. Please try again later.'
    );
  }
  
  // Create ticket...
});
```

### 3. Sensitive Data Encryption

For highly sensitive data (SSNs, payment info):

```typescript
// Encrypt before storing
const encrypted = encrypt(sensitiveData, encryptionKey);
await setDoc(doc(db, 'sensitive', id), { data: encrypted });

// Decrypt after reading
const doc = await getDoc(docRef);
const decrypted = decrypt(doc.data().data, encryptionKey);
```

### 4. Audit Logging

Log all financial operations:

```typescript
// Create audit log entry
await addDoc(collection(db, 'auditLogs'), {
  userId: currentUser.id,
  action: 'DELETE_INCOME',
  targetId: incomeId,
  timestamp: serverTimestamp(),
  metadata: { reason, approvedBy },
});
```

## Support

- **Firebase Security Rules Docs**: https://firebase.google.com/docs/firestore/security/get-started
- **Multi-tenancy Guide**: https://firebase.google.com/docs/firestore/solutions/multi-tenancy
- **Best Practices**: https://firebase.google.com/docs/firestore/security/rules-conditions

## Next Steps

1. ✅ Review this audit
2. ⏳ Test production rules in staging environment
3. ⏳ Update user model with `accessibleBuildingIds`
4. ⏳ Update all queries to filter by building
5. ⏳ Deploy production rules
6. ⏳ Verify with test suite
7. ⏳ Enable Firebase App Check
8. ⏳ Set up monitoring and alerts
