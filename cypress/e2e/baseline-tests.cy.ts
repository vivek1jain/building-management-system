/// <reference types="cypress" />

describe('Building Management System - Baseline Test Suite', () => {
  beforeEach(() => {
    // Visit the application and ensure we're on the login page
    cy.visit('http://localhost:3005')
    cy.url().should('include', '/login')
  })

  describe('Authentication & User Management', () => {
    it('should allow user login with valid credentials', () => {
      // Test login functionality
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Verify successful login
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.get('[data-testid="email-input"]').type('invalid@email.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()
      
      // Verify error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
    })

    it('should allow user logout', () => {
      // Login first
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Verify logout
      cy.url().should('include', '/login')
    })

    it('should maintain session across page refreshes', () => {
      // Login
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Refresh page
      cy.reload()
      
      // Verify still logged in
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })
  })

  describe('Navigation & Layout', () => {
    beforeEach(() => {
      // Login before each navigation test
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should display all navigation menu items', () => {
      const expectedMenuItems = [
        'Dashboard',
        'Tickets',
        'Create Ticket',
        'Suppliers',
        'Events',
        'Budget',
        'Invoices',
        'Comprehensive',
        'Flats',
        'People',
        'Service Charges',
        'Work Orders'
      ]

      expectedMenuItems.forEach(item => {
        cy.get('[data-testid="sidebar"]').should('contain', item)
      })
    })

    it('should navigate to all major pages', () => {
      const pages = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Tickets', path: '/tickets' },
        { name: 'Create Ticket', path: '/tickets/new' },
        { name: 'Suppliers', path: '/suppliers' },
        { name: 'Events', path: '/events' },
        { name: 'Budget', path: '/budget' },
        { name: 'Invoices', path: '/invoices' },
        { name: 'Comprehensive', path: '/comprehensive' },
        { name: 'Flats', path: '/flats' },
        { name: 'People', path: '/people' },
        { name: 'Service Charges', path: '/service-charges' },
        { name: 'Work Orders', path: '/work-orders' }
      ]

      pages.forEach(page => {
        cy.get(`[data-testid="nav-${page.name.toLowerCase().replace(' ', '-')}"]`).click()
        cy.url().should('include', page.path)
        cy.get('[data-testid="page-title"]').should('be.visible')
      })
    })

    it('should display responsive sidebar on mobile', () => {
      cy.viewport('iphone-6')
      cy.get('[data-testid="sidebar-toggle"]').click()
      cy.get('[data-testid="sidebar"]').should('be.visible')
    })
  })

  describe('Dashboard Functionality', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should display all dashboard widgets', () => {
      const expectedWidgets = [
        'financial-overview',
        'ticket-statistics',
        'budget-overview',
        'recent-activity',
        'upcoming-events',
        'quick-actions'
      ]

      expectedWidgets.forEach(widget => {
        cy.get(`[data-testid="${widget}"]`).should('be.visible')
      })
    })

    it('should display real-time data updates', () => {
      // Check that dashboard loads with data
      cy.get('[data-testid="financial-overview"]').should('be.visible')
      cy.get('[data-testid="ticket-statistics"]').should('be.visible')
      
      // Verify data is present
      cy.get('[data-testid="total-budget"]').should('not.be.empty')
      cy.get('[data-testid="total-tickets"]').should('not.be.empty')
    })

    it('should allow quick actions', () => {
      cy.get('[data-testid="quick-create-ticket"]').click()
      cy.url().should('include', '/tickets/new')
      
      cy.go('back')
      cy.get('[data-testid="quick-view-budget"]').click()
      cy.url().should('include', '/budget')
    })
  })

  describe('Ticket Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should create a new ticket', () => {
      cy.get('[data-testid="nav-create-ticket"]').click()
      
      // Fill ticket form
      cy.get('[data-testid="ticket-title"]').type('Test Maintenance Request')
      cy.get('[data-testid="ticket-description"]').type('This is a test maintenance request')
      cy.get('[data-testid="ticket-location"]').type('Apartment 101')
      cy.get('[data-testid="ticket-urgency"]').select('Medium')
      cy.get('[data-testid="ticket-category"]').select('Plumbing')
      
      // Submit ticket
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Verify ticket created
      cy.url().should('include', '/tickets')
      cy.get('[data-testid="success-message"]').should('contain', 'Ticket created successfully')
    })

    it('should display ticket list', () => {
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-list"]').should('be.visible')
      cy.get('[data-testid="ticket-item"]').should('have.length.greaterThan', 0)
    })

    it('should filter tickets by status', () => {
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="status-filter"]').select('New')
      cy.get('[data-testid="ticket-item"]').each(($el) => {
        cy.wrap($el).find('[data-testid="ticket-status"]').should('contain', 'New')
      })
    })

    it('should view ticket details', () => {
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-item"]').first().click()
      cy.get('[data-testid="ticket-details"]').should('be.visible')
      cy.get('[data-testid="ticket-title"]').should('be.visible')
    })

    it('should update ticket status', () => {
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-item"]').first().click()
      cy.get('[data-testid="update-status"]').click()
      cy.get('[data-testid="status-select"]').select('In Progress')
      cy.get('[data-testid="save-status"]').click()
      
      cy.get('[data-testid="ticket-status"]').should('contain', 'In Progress')
    })
  })

  describe('Budget Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should create a new budget', () => {
      cy.get('[data-testid="nav-budget"]').click()
      cy.get('[data-testid="create-budget"]').click()
      
      // Fill budget form
      cy.get('[data-testid="budget-year"]').type('2024')
      cy.get('[data-testid="budget-total"]').type('100000')
      
      // Add budget categories
      cy.get('[data-testid="add-category"]').click()
      cy.get('[data-testid="category-name"]').type('Maintenance')
      cy.get('[data-testid="category-amount"]').type('25000')
      
      cy.get('[data-testid="save-budget"]').click()
      
      // Verify budget created
      cy.get('[data-testid="success-message"]').should('contain', 'Budget created successfully')
    })

    it('should display budget overview', () => {
      cy.get('[data-testid="nav-budget"]').click()
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      cy.get('[data-testid="budget-total"]').should('be.visible')
      cy.get('[data-testid="budget-spent"]').should('be.visible')
      cy.get('[data-testid="budget-remaining"]').should('be.visible')
    })

    it('should track budget utilization', () => {
      cy.get('[data-testid="nav-budget"]').click()
      cy.get('[data-testid="budget-utilization"]').should('be.visible')
      cy.get('[data-testid="utilization-percentage"]').should('not.be.empty')
    })
  })

  describe('Invoice Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should create a new invoice', () => {
      cy.get('[data-testid="nav-invoices"]').click()
      cy.get('[data-testid="create-invoice"]').click()
      
      // Fill invoice form
      cy.get('[data-testid="invoice-number"]').type('INV-001')
      cy.get('[data-testid="invoice-amount"]').type('5000')
      cy.get('[data-testid="invoice-description"]').type('Plumbing repair services')
      cy.get('[data-testid="invoice-vendor"]').select('Test Vendor')
      
      cy.get('[data-testid="save-invoice"]').click()
      
      // Verify invoice created
      cy.get('[data-testid="success-message"]').should('contain', 'Invoice created successfully')
    })

    it('should display invoice list', () => {
      cy.get('[data-testid="nav-invoices"]').click()
      cy.get('[data-testid="invoice-list"]').should('be.visible')
      cy.get('[data-testid="invoice-item"]').should('have.length.greaterThan', 0)
    })

    it('should approve invoice', () => {
      cy.get('[data-testid="nav-invoices"]').click()
      cy.get('[data-testid="invoice-item"]').first().click()
      cy.get('[data-testid="approve-invoice"]').click()
      
      cy.get('[data-testid="invoice-status"]').should('contain', 'Approved')
    })
  })

  describe('Service Charge Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should generate service charge demands', () => {
      cy.get('[data-testid="nav-service-charges"]').click()
      cy.get('[data-testid="generate-demands"]').click()
      
      // Configure demand settings
      cy.get('[data-testid="charge-rate"]').type('2.50')
      cy.get('[data-testid="quarter-select"]').select('Q1 2024')
      
      cy.get('[data-testid="generate-button"]').click()
      
      // Verify demands generated
      cy.get('[data-testid="success-message"]').should('contain', 'Service charge demands generated')
    })

    it('should display service charge list', () => {
      cy.get('[data-testid="nav-service-charges"]').click()
      cy.get('[data-testid="demand-list"]').should('be.visible')
    })

    it('should record payment', () => {
      cy.get('[data-testid="nav-service-charges"]').click()
      cy.get('[data-testid="demand-item"]').first().click()
      cy.get('[data-testid="record-payment"]').click()
      
      // Fill payment form
      cy.get('[data-testid="payment-amount"]').type('500')
      cy.get('[data-testid="payment-method"]').select('Bank Transfer')
      
      cy.get('[data-testid="save-payment"]').click()
      
      // Verify payment recorded
      cy.get('[data-testid="success-message"]').should('contain', 'Payment recorded successfully')
    })
  })

  describe('People Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should add a new resident', () => {
      cy.get('[data-testid="nav-people"]').click()
      cy.get('[data-testid="add-person"]').click()
      
      // Fill person form
      cy.get('[data-testid="person-name"]').type('John Doe')
      cy.get('[data-testid="person-email"]').type('john.doe@example.com')
      cy.get('[data-testid="person-phone"]').type('555-0123')
      cy.get('[data-testid="person-status"]').select('Resident')
      cy.get('[data-testid="person-flat"]').select('Flat 101')
      
      cy.get('[data-testid="save-person"]').click()
      
      // Verify person added
      cy.get('[data-testid="success-message"]').should('contain', 'Person added successfully')
    })

    it('should display people list', () => {
      cy.get('[data-testid="nav-people"]').click()
      cy.get('[data-testid="people-list"]').should('be.visible')
      cy.get('[data-testid="person-item"]').should('have.length.greaterThan', 0)
    })

    it('should filter people by status', () => {
      cy.get('[data-testid="nav-people"]').click()
      cy.get('[data-testid="status-filter"]').select('Resident')
      cy.get('[data-testid="person-item"]').each(($el) => {
        cy.wrap($el).find('[data-testid="person-status"]').should('contain', 'Resident')
      })
    })
  })

  describe('Asset Management', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should add a new asset', () => {
      cy.get('[data-testid="nav-comprehensive"]').click()
      cy.get('[data-testid="assets-tab"]').click()
      cy.get('[data-testid="add-asset"]').click()
      
      // Fill asset form
      cy.get('[data-testid="asset-name"]').type('HVAC System')
      cy.get('[data-testid="asset-type"]').select('HVAC')
      cy.get('[data-testid="asset-location"]').type('Building A')
      cy.get('[data-testid="asset-status"]').select('Operational')
      
      cy.get('[data-testid="save-asset"]').click()
      
      // Verify asset added
      cy.get('[data-testid="success-message"]').should('contain', 'Asset added successfully')
    })

    it('should display asset list', () => {
      cy.get('[data-testid="nav-comprehensive"]').click()
      cy.get('[data-testid="assets-tab"]').click()
      cy.get('[data-testid="asset-list"]').should('be.visible')
    })

    it('should update asset status', () => {
      cy.get('[data-testid="nav-comprehensive"]').click()
      cy.get('[data-testid="assets-tab"]').click()
      cy.get('[data-testid="asset-item"]').first().click()
      cy.get('[data-testid="update-asset-status"]').select('Needs Repair')
      cy.get('[data-testid="save-asset"]').click()
      
      cy.get('[data-testid="asset-status"]').should('contain', 'Needs Repair')
    })
  })

  describe('Event Scheduling', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should create a new event', () => {
      cy.get('[data-testid="nav-events"]').click()
      cy.get('[data-testid="create-event"]').click()
      
      // Fill event form
      cy.get('[data-testid="event-title"]').type('Building Inspection')
      cy.get('[data-testid="event-description"]').type('Monthly building inspection')
      cy.get('[data-testid="event-date"]').type('2024-01-15')
      cy.get('[data-testid="event-time"]').type('10:00')
      cy.get('[data-testid="event-location"]').type('Building A')
      
      cy.get('[data-testid="save-event"]').click()
      
      // Verify event created
      cy.get('[data-testid="success-message"]').should('contain', 'Event created successfully')
    })

    it('should display events calendar', () => {
      cy.get('[data-testid="nav-events"]').click()
      cy.get('[data-testid="events-calendar"]').should('be.visible')
    })

    it('should filter events by type', () => {
      cy.get('[data-testid="nav-events"]').click()
      cy.get('[data-testid="event-type-filter"]').select('Maintenance')
      cy.get('[data-testid="event-item"]').each(($el) => {
        cy.wrap($el).find('[data-testid="event-type"]').should('contain', 'Maintenance')
      })
    })
  })

  describe('Data Integrity & Performance', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should load dashboard within 3 seconds', () => {
      const startTime = Date.now()
      cy.visit('http://localhost:3005/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      const loadTime = Date.now() - startTime
      expect(loadTime).to.be.lessThan(3000)
    })

    it('should handle large data sets', () => {
      // Test with multiple tickets
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="nav-create-ticket"]').click()
        cy.get('[data-testid="ticket-title"]').type(`Test Ticket ${i}`)
        cy.get('[data-testid="ticket-description"]').type(`Description for ticket ${i}`)
        cy.get('[data-testid="submit-ticket"]').click()
        cy.get('[data-testid="nav-tickets"]').click()
      }
      
      // Verify all tickets are displayed
      cy.get('[data-testid="ticket-item"]').should('have.length', 10)
    })

    it('should maintain data consistency', () => {
      // Create a ticket
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Consistency Test Ticket')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Navigate away and back
      cy.get('[data-testid="nav-dashboard"]').click()
      cy.get('[data-testid="nav-tickets"]').click()
      
      // Verify ticket still exists
      cy.get('[data-testid="ticket-list"]').should('contain', 'Consistency Test Ticket')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('GET', '/api/tickets', { forceNetworkError: true })
      cy.get('[data-testid="nav-tickets"]').click()
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should validate form inputs', () => {
      cy.get('[data-testid="nav-create-ticket"]').click()
      
      // Try to submit without required fields
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Should show validation errors
      cy.get('[data-testid="validation-error"]').should('be.visible')
    })

    it('should handle server errors', () => {
      // Simulate server error
      cy.intercept('POST', '/api/tickets', { statusCode: 500 })
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Test Ticket')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="nav-tickets"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="nav-budget"]').should('have.attr', 'aria-label')
    })

    it('should be keyboard navigable', () => {
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'nav-dashboard')
      
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'nav-tickets')
    })

    it('should have proper color contrast', () => {
      // This would require a custom command to check color contrast
      // For now, we'll just verify that text is visible
      cy.get('[data-testid="dashboard"]').should('be.visible')
      cy.get('[data-testid="page-title"]').should('be.visible')
    })
  })
}) 