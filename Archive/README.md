# Archive Directory

This directory contains files that are no longer actively used in the building management system but are preserved for reference or potential future use.

**Archive Date:** November 26, 2025

## Contents

### Demo & Mock Data Scripts
These scripts were used to create demo users and clean up mock data during development:

- `cleanup-mock-data.js` - Script to remove mock/sample data from Firebase (service charge demands, ledger transactions, etc.)
- `create-demo-user.js` - Browser console script to create demo users
- `create-demo-users.cjs` - Node script with instructions to create demo users (manager, supplier, requester)

### Debug Scripts
Development debugging utilities:

- `debug-expenses.js` - Test script for expense service methods
- `debug-ticket.js` - Script to check ticket activity logs and completion detection

### Diagnostic Tools
HTML-based diagnostic and testing tools:

- `diagnose-firebase.html` - Comprehensive Firebase diagnostic tool with authentication, database operations, and building data tests
- `test-firebase.html` - Simple Firebase connection test tool

### Test Scripts & Runners
Automated testing utilities (replaced by Cypress):

- `test-runner.js` - Node-based test runner for connectivity, file structure, dependencies, and TypeScript compilation
- `run-tests.bat` - Windows batch file to run test-runner.js
- `run-tests.ps1` - PowerShell script to run test-runner.js
- `run-ui-tests.ps1` - PowerShell script for comprehensive test suite including Cypress UI tests

### Test Results
Old test result files:

- `test-results.json` - Stored test results from test-runner.js
- `cypress-baseline-results.json` - Baseline Cypress test results

### Migration Scripts
Service migration utilities:

- `migrate_services.sh` - Bash script to migrate services and create backups during timestamp/error handling refactoring

### Service Backups
Located in `service-backups/` directory - backups created during service migration:

- `budgetApprovalWorkflowService.ts.backup`
- `budgetCompletionService.ts.backup`
- `buildingService.ts.backup`
- `flatLedgerService.ts.backup`
- `flatLedgerSyncService.ts.backup`
- `residentAccountService.ts.backup`
- `workOrderService.ts.backup`

### Documentation
Historical troubleshooting and fix documentation:

- `USER_LOADING_FIX.md` - Documentation of user loading issue resolution
- `USER_MANAGEMENT_DIAGNOSTICS.md` - Diagnostics documentation for user management issues

### Miscellaneous
- `home_user_BMS3_.idx_package.textClipping` - Text clipping file (likely accidental creation)

## Reason for Archiving

These files were archived because:

1. **Demo/Mock Data**: The application has moved away from using mock data fallbacks (per user preference rule)
2. **Debug Scripts**: Development has matured beyond needing standalone debug scripts
3. **Diagnostic Tools**: Firebase is now stable and integrated; standalone diagnostic HTML tools no longer needed
4. **Test Scripts**: Replaced by proper Cypress test suite and CI/CD integration
5. **Migration Scripts**: One-time migration completed
6. **Service Backups**: Migration verified and stable; backups no longer needed but preserved for safety
7. **Documentation**: Issues resolved; documentation kept for reference

## Should These Be Deleted?

Not immediately. Keep this archive for:

- Historical reference
- Understanding past issues and solutions
- Potential reuse of diagnostic patterns
- Service backup safety net

Consider removing after:
- 3-6 months of stable operation
- Verification that no patterns/code need to be referenced
- Confirmation that service migrations are completely stable

## Restoration

If any file needs to be restored:

```bash
# Copy file back to original location
cp Archive/[filename] [original-location]
```

Refer to git history to identify original locations if needed.
