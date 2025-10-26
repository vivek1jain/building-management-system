# Test IDs Reference Guide

This document provides a comprehensive list of all `data-testid` attributes added to the Building Management System for E2E testing with Cypress.

## Authentication & Layout

### Login Page
- `email-input` - Email address input field
- `password-input` - Password input field
- `login-button` - Submit login button
- `error-message` - Error message display
- `success-message` - Success message display

### Navigation
- `sidebar` - Main sidebar navigation container
- `user-menu` - User menu dropdown trigger
- `logout-button` - Logout button in user menu
- `page-title` - Page title heading

### Navigation Links
- `nav-dashboard` - Dashboard navigation link
- `nav-tickets` - Tickets navigation link
- `nav-events` - Events navigation link
- `nav-budget` - Budget/Finances navigation link
- `nav-building` - Building navigation link
- `nav-reports` - Reports navigation link
- `nav-settings` - Settings navigation link
- `nav-admin` - Admin navigation link

## Dashboard

### Widgets
- `dashboard` - Main dashboard container
- `financial-overview` - Financial overview widget
- `ticket-statistics` - Ticket statistics widget
- `budget-overview` - Budget overview widget (on dashboard)
- `recent-activity` - Recent activity widget
- `upcoming-events` - Upcoming events widget
- `total-tickets` - Total tickets count display
- `total-budget` - Total budget amount display

## Tickets

### List View
- `ticket-list` - Tickets list container
- `ticket-item` - Individual ticket item (repeatable)
- `ticket-status` - Ticket status badge/label

### Ticket Detail
- `ticket-details` - Ticket detail modal/container
- `ticket-title` - Ticket title input/display
- `ticket-description` - Ticket description textarea
- `ticket-location` - Ticket location input
- `ticket-urgency` - Ticket urgency selector
- `submit-ticket` - Submit/create ticket button

### Filtering
- `status-filter` - Status filter dropdown

## Budget & Finances

### Budget Section
- `budget-overview` - Budget overview section container (on Finances page)
- `create-budget` - Create/Edit budget button
- `budget-year` - Year input field in budget form
- `budget-total` - Total budget amount display
- `budget-spent` - Actual spent amount (YTD) display
- `save-budget` - Save/submit budget button

### Service Charges / Invoices
- `invoice-list` - Service charge demands list container
- `generate-demands` - Generate service charge demands button

## People Management

### List View
- `people-list` - People list container
- `person-item` - Individual person item (repeatable)

### Person Form
- `add-person` - Add new person button
- `person-name` - Name input field
- `person-email` - Email input field
- `person-phone` - Phone number input field
- `person-status` - Status dropdown selector
- `save-person` - Save/update person button

## Events & Calendar

### Event Form
- `event-title` - Event title input field
- `event-description` - Event description textarea
- `event-location` - Event location input field
- `event-date` - Event date picker
- `event-time` - Event start time input
- `save-event` - Create/update event button

### Calendar View
- `events-calendar` - Events calendar container
- `event-item` - Individual event item (repeatable)

## Usage in Tests

### Example: Login Test
```typescript
cy.get('[data-testid="email-input"]').type('user@example.com')
cy.get('[data-testid="password-input"]').type('password123')
cy.get('[data-testid="login-button"]').click()
cy.get('[data-testid="user-menu"]').should('be.visible')
```

### Example: Budget Test
```typescript
cy.get('[data-testid="nav-budget"]').click()
cy.get('[data-testid="budget-overview"]').should('be.visible')
cy.get('[data-testid="create-budget"]').click()
cy.get('[data-testid="budget-year"]').type('2024')
cy.get('[data-testid="save-budget"]').click()
```

### Example: People Management Test
```typescript
cy.get('[data-testid="add-person"]').click()
cy.get('[data-testid="person-name"]').type('John Doe')
cy.get('[data-testid="person-email"]').type('john@example.com')
cy.get('[data-testid="person-phone"]').type('555-0123')
cy.get('[data-testid="person-status"]').select('Resident')
cy.get('[data-testid="save-person"]').click()
cy.get('[data-testid="people-list"]').should('contain', 'John Doe')
```

### Example: Events Test
```typescript
cy.get('[data-testid="event-title"]').type('Building Inspection')
cy.get('[data-testid="event-description"]').type('Annual inspection')
cy.get('[data-testid="event-location"]').type('Building A')
cy.get('[data-testid="event-date"]').type('2024-12-01')
cy.get('[data-testid="event-time"]').type('10:00')
cy.get('[data-testid="save-event"]').click()
```

## Test Files

### Current Test Suites
- `cypress/e2e/working-suite.cy.ts` - 8 passing tests (auth, dashboard, navigation, tickets)
- `cypress/e2e/budget.cy.ts` - 19 comprehensive budget management tests
- `cypress/e2e/people.cy.ts` - 17 comprehensive people management tests
- `cypress/e2e/events.cy.ts` - 17 comprehensive events management tests
- `cypress/e2e/budget-simple.cy.ts` - 3 simple budget verification tests
- `cypress/e2e/baseline-tests.cy.ts` - Comprehensive baseline test structure (reference only)

### Test Suite Summary
**Total: 64 E2E Tests**
- Authentication: 3 tests (login, logout, error handling)
- Dashboard: 1 test (widget display)
- Navigation: 2 tests (page navigation)
- Tickets: 2 tests (create, list)
- Budget Management: 19 tests (overview, creation, validation, responsive)
- People Management: 17 tests (list, add, edit, validation, responsive)
- Events Management: 17 tests (creation, date/time, location, validation)
- Budget Simple: 3 tests (navigation, overview, button visibility)

## Notes

- All test IDs use kebab-case naming convention
- Test IDs are stable and should not be changed without updating corresponding tests
- Repeatable elements (like list items) use the same test ID - use `.first()`, `.eq(index)`, or `.each()` in Cypress
- Form inputs and buttons are prioritized for test IDs to enable form testing
- Status badges, filters, and navigation elements have test IDs for verification

## Future Additions

Test IDs still needed for:
- Asset management components
- Reports page elements
- Settings page forms
- Admin panel elements
- Comprehensive dashboard page
- Work orders section
- Suppliers management

---

Last Updated: Phase 6.3 Complete
Build Status: ✅ All changes verified with successful build
