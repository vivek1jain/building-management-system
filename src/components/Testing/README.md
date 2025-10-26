# Testing Components

⚠️ **DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION**

This directory contains testing and diagnostic utilities for development purposes only.

## Components

- `UITestSuite.tsx` - UI component testing
- `ComponentTestSuite.tsx` - Component testing utilities
- `DiagnosticTest.tsx` - Diagnostic tools
- `FinancialYearTest.tsx` - Financial year logic testing
- `TestingUtilities.tsx` - General testing utilities
- `DataCleanup.tsx` - Development data cleanup tools

## Production Build

These components should **NOT** be included in production builds. Ensure they are:
1. Not imported in main application code
2. Only accessible via development routes
3. Excluded from production bundle

## Usage

For development/testing only. Do not deploy to production.
