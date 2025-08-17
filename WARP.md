# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is a comprehensive Building Management System built with React, TypeScript, Vite, Tailwind CSS, and Firebase. The system manages building operations, ticketing workflows, financial management, and user coordination with role-based access control.

## Common Commands

### Development
```bash
# Start development server (runs on port 3003)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests
npm run test

# Open Cypress UI for interactive testing
npm run test:open

# Quick regression tests (fastest feedback)
npm run test:regression

# Complete baseline tests (comprehensive coverage)
npm run test:baseline

# Run specific test suites
npm run test:auth          # Authentication tests
npm run test:tickets       # Ticket management tests
npm run test:budget        # Budget management tests
npm run test:people        # People management tests
npm run test:assets        # Asset management tests

# Cross-browser testing
npm run test:chrome
npm run test:firefox
npm run test:edge

# Mobile/responsive testing
npm run test:mobile
npm run test:tablet
npm run test:desktop

# TDD workflow (regression + baseline)
npm run test:tdd
```

### Firebase
```bash
# Deploy Firebase rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy complete Firebase project
firebase deploy

# Create demo users for testing
node create-demo-user.js
```

## Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (dev server on port 3003)
- **Routing**: React Router v6 with protected routes
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **UI Components**: Custom components with Headless UI
- **Animations**: Framer Motion
- **Forms**: React Hook Form

### Backend & Data
- **Authentication**: Firebase Auth (email/password, anonymous for testing)
- **Database**: Firebase Firestore with real-time subscriptions
- **Storage**: Firebase Storage for file uploads
- **Security**: Firestore security rules with role-based access
- **Functions**: Firebase Cloud Functions (in `functions/` folder)

### State Management
- **Auth Context**: `src/contexts/AuthContext.tsx` - user authentication state
- **Notification Context**: `src/contexts/NotificationContext.tsx` - app-wide notifications
- **Service Layer Pattern**: Business logic separated into service files

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Auth/            # Authentication components
│   ├── BuildingData/    # Building data tables and forms
│   ├── Layout/          # Header, sidebar, main layout
│   ├── Notifications/   # Toast and notification components
│   └── Settings/        # Settings and configuration UI
├── contexts/            # React Context providers
├── firebase/            # Firebase configuration
├── pages/               # Route components
├── services/            # Business logic and API calls
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities

cypress/
├── e2e/                # End-to-end test files
├── fixtures/           # Test data
└── support/            # Test utilities and commands
```

### Key Files
- `src/App.tsx` - Main app component with routing
- `src/types/index.ts` - Comprehensive type definitions (800+ lines)
- `src/firebase/config.ts` - Firebase configuration with fallback for dev
- `firestore.rules` - Database security rules (role-based access)
- `vite.config.ts` - Build configuration with code splitting

## Service Layer Pattern

The application uses a service layer pattern where each domain has its own service file:

- `ticketService.ts` - Ticket/work order management
- `supplierService.ts` - Supplier management
- `budgetService.ts` - Budget and financial operations
- `buildingService.ts` - Building and asset management
- `peopleService.ts` - User and resident management
- `emailService.ts` - Email notifications
- `eventService.ts` - Calendar and scheduling

Each service provides CRUD operations with Firebase integration and mock data fallback for offline development.

## Firebase Integration

### Collections Structure
- `users` - User accounts with roles
- `tickets`/`workOrders` - Maintenance requests and work orders
- `suppliers` - Vendor management
- `budgets` - Financial budgeting
- `buildings` - Building information and assets
- `flats` - Individual unit management
- `people` - Residents, owners, tenants
- `serviceChargeDemands` - Financial charges and payments
- `events` - Calendar scheduling
- `reminders` - Notification system

### Security Model
Role-based access with Firebase Security Rules:
- **Admin**: Full system access
- **Manager**: Building management, work orders, financials
- **Finance**: Budget and payment management
- **Supplier**: View assigned work, provide quotes
- **Requester/Resident**: Create tickets, view own data

### Development vs Production
- Development: Relaxed security rules for testing
- Fallback to mock data when Firebase is unavailable
- Environment variables for production deployment

## User Roles & Permissions

The system supports multiple user roles with distinct permissions:

```typescript
type UserRole = 'admin' | 'manager' | 'finance' | 'supplier' | 'requester' | 'client' | 'vendor' | 'resident' | 'tenant';
```

- **Manager**: Can manage all tickets, users, buildings, and approve budgets
- **Finance**: Can handle budgets, invoices, and service charges
- **Supplier**: Can view assigned tickets and provide quotes
- **Resident/Requester**: Can create tickets and view their own data

## Testing Strategy

### Test-Driven Development (TDD)
The project follows TDD principles with comprehensive test coverage:

1. **Regression Tests** (`regression-pack.cy.ts`) - Critical path testing for quick feedback
2. **Baseline Tests** (`baseline-tests.cy.ts`) - Complete feature testing
3. **Feature-specific tests** - Individual component testing

### Test Data
- Demo users created via `create-demo-user.js`
- Test fixtures in `cypress/fixtures/`
- Mock data fallback for offline development

### CI/CD Pipeline
GitHub Actions workflow with:
- Quick regression tests (10 min)
- Baseline tests (30 min)
- Cross-browser testing
- Performance and accessibility testing
- Automatic deployment on successful tests

## Key Features

### Work Order Management
- Complete ticket lifecycle (New → Quote Requested → Scheduled → Complete)
- Quote management with supplier coordination
- File attachments via Firebase Storage
- Real-time status updates
- Activity logging

### Financial Management
- Budget management with category tracking
- Service charge calculations (UK market focused)
- Invoice processing and approval workflows
- Payment tracking with multiple methods
- Quarterly financial reporting

### Building Operations
- Multi-building support
- Asset management with maintenance scheduling
- Flat/unit management with area calculations
- People management (residents, owners, tenants)
- Calendar scheduling for maintenance events

### Real-time Features
- Live notifications via Firebase subscriptions
- Real-time dashboard updates
- Instant messaging between users
- Live status changes on tickets

## Development Guidelines

### Adding New Features
1. Start with types in `src/types/index.ts`
2. Create service layer in `src/services/`
3. Build UI components
4. Add to routing in `App.tsx`
5. Write Cypress tests
6. Update security rules if needed

### Working with Firebase
- Use service layer pattern for all Firebase operations
- Handle offline scenarios with mock data fallback
- Follow security rules for role-based access
- Test with demo users before production

### Component Development
- Use TypeScript interfaces from `types/index.ts`
- Follow existing patterns for form handling
- Implement loading and error states
- Make components responsive with Tailwind

### State Management
- Use React Context for global state
- Keep component state local when possible
- Use Firebase subscriptions for real-time data
- Handle loading and error states consistently

## Troubleshooting

### Common Issues
- **Firebase Permission Denied**: Check security rules and user authentication
- **Port 3003 in use**: Kill existing processes or change port in `vite.config.ts`
- **Test failures**: Ensure development server is running on correct port
- **Build errors**: Check TypeScript errors and dependency issues

### Development Setup
1. Install dependencies: `npm install`
2. Set up Firebase project and update `src/firebase/config.ts`
3. Deploy security rules: `firebase deploy --only firestore:rules`
4. Create demo users: `node create-demo-user.js`
5. Start development: `npm run dev`

### Environment Variables
For production deployment, set these in `.env`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Migration Notes

The project includes a comparison with a Next.js reference implementation (`studio-master/`) that has additional features like:
- Enhanced flat management system
- Advanced people management with bulk operations
- Service charge demand generation
- Comprehensive reminder system
- Advanced UI components (Shadcn/ui)

Refer to `STUDIO_MASTER_COMPARISON.md` for detailed feature gaps and implementation roadmap.
