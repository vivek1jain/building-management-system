# Building Management System - Developer Guide

**Version**: 1.0  
**Last Updated**: November 2025

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Core Features](#core-features)
5. [Permissions & Access Control](#permissions--access-control)
6. [Data Management](#data-management)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Technical Debt & Improvements](#technical-debt--improvements)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose
A comprehensive building management platform for UK property management, handling residents, flats, tickets, finances, events, and suppliers.

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **State Management**: React Context API
- **UI Components**: Custom component library + Lucide icons
- **Deployment**: Firebase Hosting

### Key Differentiators
- UK market-focused (ground rent, service charges, quarterly payments)
- Multi-building support with cross-building admin access
- Role-based access control (Admin, Manager, Resident, Supplier)
- Mobile-first responsive design

---

## Architecture

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Navigation, sidebar, headers
│   ├── Settings/       # Settings page components
│   └── UI/             # Base UI components (buttons, cards, etc.)
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── BuildingContext.tsx
│   ├── NotificationContext.tsx
│   └── ThemeContext.tsx
├── hooks/              # Custom React hooks
│   └── useRoleAccess.ts
├── pages/              # Top-level page components
├── services/           # Firebase service layer
│   ├── authService.ts
│   ├── ticketService.ts
│   ├── buildingService.ts
│   └── ...
├── types/              # TypeScript type definitions
├── config/             # App configuration
│   └── permissions.ts  # Role-based permissions config
└── utils/              # Utility functions
```

### State Management
- **AuthContext**: Current user, authentication state
- **BuildingContext**: Building selection, multi-building access
- **NotificationContext**: Toast notifications
- **ThemeContext**: Theme preferences (light/dark)

### Data Flow
1. User authenticates → AuthContext updates
2. BuildingContext loads accessible buildings based on user role
3. Pages query Firestore using service layer
4. Data scoped by role via dataAccessService
5. UI updates based on permissions config

---

## Setup & Configuration

### Initial Setup
1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd building-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create Firebase project at console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy config to `src/firebase/config.ts`

4. **Environment Variables**
   Create `.env`:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```

### Development
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
```

### Firebase Emulator (Optional)
```bash
firebase emulators:start
```

---

## Core Features

### 1. User Management & Invitations
**Location**: `src/pages/Settings.tsx` → User Management tab

**Flow**:
1. Admin/Manager invites user via email
2. Invitation creates secure token, stored in `invitations` collection
3. Email sent with invitation link
4. User accepts → Creates auth account + person record
5. Person record links user to building(s) and flat

**Key Files**:
- `src/services/invitationService.ts`
- `src/services/emailService.ts`
- `src/components/Settings/InviteUserModal.tsx`

**Role-Specific Data Capture**:
- **Residents**: Flat number, PersonStatus (Owner/Tenant)
- **Suppliers**: Company name
- **All**: Phone number, building assignments

### 2. Multi-Building Access
**Implementation**: One person record per building assignment

**Access Rules**:
- **Admins**: See all buildings
- **Managers**: See assigned buildings only
- **Residents**: See assigned building(s)

**Key Service**: `src/services/buildingService.ts`

### 3. Ticketing System
**Workflow**: Triage → Open → Quoted → Approved → Scheduled → In Progress → Complete

**Key Features**:
- Priority levels (Low, Medium, High, Critical)
- Supplier assignment with quoting
- Status-driven workflow
- Mobile-optimized cards

**Resident View**:
- See only own tickets
- Hide pricing/quote details
- Show schedule and status only

**Key Files**:
- `src/pages/Tickets.tsx`
- `src/services/ticketService.ts`

### 4. Financial Management
**Collections**:
- **Budgets**: Annual building budgets
- **Expenses**: Building expenses by category
- **Income**: Revenue tracking
- **ServiceChargeDemands**: Quarterly service charge demands
- **Invoices**: Vendor invoices
- **ResidentAccountLedgers**: Per-flat payment tracking

**UK Market Features**:
- Ground rent (annual, per sq ft)
- Service charges (quarterly, per sq ft)
- VAT handling
- Credit management

**Resident View**:
- **Admins/Managers**: Full finances page
- **Residents**: My Payments page (own balance only)

**Key Files**:
- `src/pages/Finances.tsx`
- `src/pages/ResidentPayments.tsx`
- `src/services/flatLedgerService.ts`
- `src/services/residentAccountService.ts`

### 5. Events Management
**Features**:
- Building-wide events
- RSVP tracking
- Visibility settings (Public/Residents Only)

**Permissions**:
- **All roles**: View events
- **Admin/Manager**: Create/edit/delete events

**Key File**: `src/services/eventService.ts`

### 6. Building & Flat Management
**Features**:
- Multiple buildings per system
- Flats with detailed info (bedrooms, bathrooms, sq ft, charges)
- Occupancy tracking
- Person-to-flat associations

**Resident View**:
- **Admins/Managers**: Full Building Data page
- **Residents**: My Profile page (own flat only)

**Key Files**:
- `src/pages/BuildingDataManagement.tsx`
- `src/pages/ResidentProfile.tsx`
- `src/services/flatService.ts`
- `src/services/peopleService.ts`

---

## Permissions & Access Control

### Permission System Architecture

**Three-Layer Approach**:
1. **Route Protection**: `RoleProtectedRoute` component blocks unauthorized page access
2. **UI Filtering**: Conditional rendering based on `useRoleAccess()` hook
3. **Backend Security**: Firestore security rules enforce data boundaries

### Configuration Files
- **Permissions Config**: `src/config/permissions.ts`
- **Permissions Matrix**: `docs/PERMISSIONS.md`
- **Implementation Guide**: `docs/PERMISSIONS_GUIDE.md`

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Super user | Full system access, all buildings |
| **Manager** | Building manager | Assigned buildings, operational features |
| **Resident** | Building occupant | Own data only (tickets, payments, profile) |
| **Supplier** | External contractor | Assigned tickets |

### Key Permissions

**Page Access**:
```typescript
// src/config/permissions.ts
export const PAGE_PERMISSIONS = {
  finances: ['admin', 'manager'],
  myPayments: ['resident'],
  buildingData: ['admin', 'manager'],
  myProfile: ['resident'],
  admin: ['admin'],
  settings: ['admin', 'manager'],
}
```

**Feature Permissions**:
```typescript
export const FEATURE_PERMISSIONS = {
  canViewTicketPricing: ['admin', 'manager'],
  canViewOwnTickets: ['admin', 'manager', 'resident', 'supplier'],
  canDeleteUsers: ['admin'],
  // ... etc
}
```

### Data Scoping Service
**File**: `src/services/dataAccessService.ts`

Automatically scopes Firestore queries based on user role:
```typescript
// Residents only see their own tickets
const tickets = await scopeQuery('tickets', {
  userId: currentUser.id,
  userRole: currentUser.role,
  buildingId: selectedBuilding.id
})
```

### Firestore Security Rules
**File**: `firestore.rules`

Enforces backend security:
```javascript
// Tickets - residents see only own
match /tickets/{ticketId} {
  allow read: if isAuthenticated() && (
    canManage() || 
    resource.data.createdBy == request.auth.uid
  );
}
```

**Deploy Rules**:
```bash
firebase deploy --only firestore:rules
```

### Adding New Permissions

**Step 1**: Update `src/config/permissions.ts`
```typescript
canExportReports: ['admin', 'manager']
```

**Step 2**: Use in component
```typescript
import { hasPermission } from '../config/permissions'

{hasPermission(currentUser.role, 'canExportReports') && (
  <button>Export</button>
)}
```

**Step 3**: Update `docs/PERMISSIONS.md` documentation

**Step 4**: Update Firestore rules if backend validation needed

---

## Data Management

### Collections Overview

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **users** | User accounts | email, role, name, phone |
| **people** | Person-building associations | uid, buildingId, flatId, status |
| **buildings** | Building records | name, address, flats, units |
| **flats** | Flat/unit records | flatNumber, charges, area |
| **tickets** | Maintenance requests | status, priority, assignedTo |
| **budgets** | Annual budgets | year, categories, allocated |
| **expenses** | Building expenses | amount, category, buildingId |
| **serviceChargeDemands** | Quarterly charges | flatId, amount, period |
| **residentAccountLedgers** | Resident balances | currentBalance, credits |
| **invitations** | Pending invitations | token, buildingIds, role |
| **suppliers** | Supplier records | companyName, specialties |

### Data Relationships

```
Building
  └── Flats (1:many)
       └── People (1:many)
            └── User (1:1 via uid)
       └── ServiceChargeDemands (1:many)
       └── ResidentAccountLedger (1:1)
       └── Assets (1:many)
  └── Tickets (1:many)
  └── Expenses (1:many)
  └── Events (1:many)
```

### Service Layer Pattern

All Firebase operations go through service files:

```typescript
// src/services/ticketService.ts
export const ticketService = {
  async getTickets(): Promise<Ticket[]> {
    const snapshot = await getDocs(collection(db, 'tickets'))
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  },
  
  async createTicket(ticket: Omit<Ticket, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'tickets'), {
      ...ticket,
      createdAt: serverTimestamp()
    })
    return docRef.id
  }
}
```

### Data Cleanup
**Location**: Admin → Data & Testing tab

**Features**:
- Delete all records by collection
- Bulk cleanup operations
- Stats refresh
- Session data utilities

**Collections Supported**:
- Tickets, Expenses, Events, Income
- People, Flats, Assets, Suppliers

**Key File**: `src/components/Settings/TestingSettings.tsx`

---

## Testing

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests (future)
```

### Running Tests
```bash
npm run test                 # Run all tests
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests
npm run test:watch           # Watch mode
```

### Test Coverage Areas
- Authentication flows
- Permission checks
- Data scoping
- Form validation
- Service layer methods

### Test IDs
Components use `data-testid` attributes:
```typescript
<button data-testid="submit-ticket">Submit</button>
```

**Reference**: `docs/TEST_IDS_REFERENCE.md`

### Permission Testing
**File**: `src/utils/testPermissions.ts`

Window-accessible functions for manual testing:
```javascript
// In browser console
window.testPermissions()
window.testBuildingAccess()
```

---

## Deployment

### Firebase Hosting

**Deploy Everything**:
```bash
npm run build
firebase deploy
```

**Deploy Specific**:
```bash
firebase deploy --only hosting      # Frontend only
firebase deploy --only firestore:rules  # Rules only
firebase deploy --only functions    # Cloud Functions
```

### Build Optimization
- Vite code splitting
- Tree shaking
- Asset optimization
- Lazy loading for secondary pages

### Environment-Specific Builds
```bash
# Production
npm run build

# Staging (if configured)
npm run build:staging
```

### Post-Deployment Checklist
- [ ] Verify authentication works
- [ ] Test role-based access
- [ ] Check Firestore rules deployed
- [ ] Verify email invitations send
- [ ] Test on mobile devices
- [ ] Check console for errors

---

## Technical Debt & Improvements

### Known Issues

**1. Service Migration**
- `residentAccountService.ts` marked deprecated
- Should migrate to `flatLedgerService.ts`
- See: `docs/SERVICE_MIGRATION_GUIDE.md`

**2. Mock Data Fallbacks**
- Some components have hardcoded fallback data
- Should be removed per user preference
- Causes confusion during testing

**3. TypeScript Strictness**
- Some `any` types remain
- Need stricter type enforcement
- See: `docs/TECHNICAL-DEBT.md`

**4. Test Coverage**
- Unit test coverage incomplete
- Need more integration tests
- E2E tests not yet implemented

### Suggested Improvements

**Performance**:
- Implement pagination for large lists
- Add query result caching
- Optimize re-renders with React.memo

**UX**:
- Add loading skeletons consistently
- Improve error messages
- Add keyboard shortcuts

**Features**:
- Document upload/storage
- Automated service charge generation
- Bulk operations (emails, charges)
- Reporting dashboard expansion

**Security**:
- Implement rate limiting
- Add audit logs
- Session timeout warnings
- Two-factor authentication

### Migration Paths

**From residentAccountService to flatLedgerService**:
1. Review dependencies in `CONSOLIDATION_OPPORTUNITIES.md`
2. Update components one at a time
3. Test balance calculations thoroughly
4. Remove deprecated service after migration complete

---

## Troubleshooting

### Common Issues

**Build Failures**:
- Clear `node_modules` and reinstall
- Check Node version (18+ required)
- Verify all imports resolve correctly

**Authentication Issues**:
- Check Firebase config in `src/firebase/config.ts`
- Verify email/password auth enabled in Firebase Console
- Clear browser storage and retry

**Permission Errors**:
- Check Firestore rules deployed: `firebase deploy --only firestore:rules`
- Verify user role in Firestore users collection
- Check `canManage()` helper functions

**Data Not Loading**:
- Check browser console for errors
- Verify building selected in BuildingContext
- Check Firestore indexes (see console error messages)
- Ensure user has person record for selected building

**Invitation Emails Not Sending**:
- Check email service configuration
- Verify SMTP settings or SendGrid API key
- Check Cloud Functions logs if using Firebase Functions

### Debug Tools

**Browser Console Commands**:
```javascript
// Check current user
localStorage.getItem('firebase:authUser')

// Test permissions
window.testPermissions()

// Check building context
// (Add debug logging in BuildingContext)
```

**Firebase Console**:
- Firestore: View/edit data directly
- Authentication: Manage users
- Hosting: Check deployment history
- Functions: View logs

### Getting Help

**Documentation**:
- This guide
- `docs/PERMISSIONS_GUIDE.md`
- `docs/USER_GUIDE.md`
- Inline code comments

**External Resources**:
- Firebase Docs: firebase.google.com/docs
- React Docs: react.dev
- TypeScript Docs: typescriptlang.org

---

## Appendix

### File References
- Main App: `src/App.tsx`
- Route Protection: `src/components/Auth/RoleProtectedRoute.tsx`
- Permissions Config: `src/config/permissions.ts`
- Data Access: `src/services/dataAccessService.ts`
- Firestore Rules: `firestore.rules`

### Quick Commands
```bash
# Development
npm run dev

# Build & Deploy
npm run build && firebase deploy

# Rules only
firebase deploy --only firestore:rules

# Test
npm run test

# Clean install
rm -rf node_modules && npm install
```

### Version History
- **v1.0** (Nov 2025): Initial production release with role-based access control
