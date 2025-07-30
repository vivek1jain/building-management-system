/// <reference types="cypress" />

describe('Building Management System - Regression Test Pack', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3005')
  })

  describe('Critical Path Regression Tests', () => {
    it('should complete full user journey without errors', () => {
      // Login
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Verify dashboard loads
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
      
      // Navigate to tickets
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-list"]').should('be.visible')
      
      // Create a ticket
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Regression Test Ticket')
      cy.get('[data-testid="ticket-description"]').type('Test description')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Verify ticket created
      cy.get('[data-testid="success-message"]').should('contain', 'Ticket created successfully')
      
      // Navigate to budget
      cy.get('[data-testid="nav-budget"]').click()
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      
      // Navigate to invoices
      cy.get('[data-testid="nav-invoices"]').click()
      cy.get('[data-testid="invoice-list"]').should('be.visible')
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      cy.url().should('include', '/login')
    })

    it('should maintain data integrity across sessions', () => {
      // Login and create data
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Create a ticket
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Data Integrity Test')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Refresh page
      cy.reload()
      
      // Verify data persists
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-list"]').should('contain', 'Data Integrity Test')
    })

    it('should handle concurrent user actions', () => {
      // Login
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Perform multiple actions quickly
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="nav-budget"]').click()
      cy.get('[data-testid="nav-invoices"]').click()
      cy.get('[data-testid="nav-dashboard"]').click()
      
      // Verify no errors occurred
      cy.get('[data-testid="error-message"]').should('not.exist')
      cy.get('[data-testid="dashboard"]').should('be.visible')
    })
  })

  describe('Authentication Regression Tests', () => {
    it('should prevent access to protected routes without authentication', () => {
      // Try to access dashboard directly
      cy.visit('http://localhost:3005/dashboard')
      cy.url().should('include', '/login')
      
      // Try to access tickets directly
      cy.visit('http://localhost:3005/tickets')
      cy.url().should('include', '/login')
    })

    it('should maintain session after page refresh', () => {
      // Login
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-menu"]').should('be.visible')
    })

    it('should clear session on logout', () => {
      // Login
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Try to access protected route
      cy.visit('http://localhost:3005/dashboard')
      cy.url().should('include', '/login')
    })
  })

  describe('Navigation Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should navigate to all major pages without errors', () => {
      const pages = [
        { name: 'Dashboard', selector: '[data-testid="nav-dashboard"]' },
        { name: 'Tickets', selector: '[data-testid="nav-tickets"]' },
        { name: 'Create Ticket', selector: '[data-testid="nav-create-ticket"]' },
        { name: 'Budget', selector: '[data-testid="nav-budget"]' },
        { name: 'Invoices', selector: '[data-testid="nav-invoices"]' },
        { name: 'Service Charges', selector: '[data-testid="nav-service-charges"]' },
        { name: 'People', selector: '[data-testid="nav-people"]' },
        { name: 'Events', selector: '[data-testid="nav-events"]' }
      ]

      pages.forEach(page => {
        cy.get(page.selector).click()
        cy.get('[data-testid="page-title"]').should('be.visible')
        cy.get('[data-testid="error-message"]').should('not.exist')
      })
    })

    it('should maintain navigation state', () => {
      // Navigate to tickets
      cy.get('[data-testid="nav-tickets"]').click()
      cy.url().should('include', '/tickets')
      
      // Refresh page
      cy.reload()
      
      // Should still be on tickets page
      cy.url().should('include', '/tickets')
      cy.get('[data-testid="ticket-list"]').should('be.visible')
    })
  })

  describe('Form Submission Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should handle form submissions without errors', () => {
      // Test ticket creation
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Regression Test Ticket')
      cy.get('[data-testid="ticket-description"]').type('Test description')
      cy.get('[data-testid="submit-ticket"]').click()
      
      cy.get('[data-testid="success-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('not.exist')
    })

    it('should validate required fields', () => {
      cy.get('[data-testid="nav-create-ticket"]').click()
      
      // Try to submit without required fields
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Should show validation errors
      cy.get('[data-testid="validation-error"]').should('be.visible')
    })

    it('should handle form cancellation', () => {
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Test Ticket')
      
      // Cancel form
      cy.get('[data-testid="cancel-button"]').click()
      
      // Should return to previous page
      cy.url().should('not.include', '/tickets/new')
    })
  })

  describe('Data Display Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should display dashboard data correctly', () => {
      cy.get('[data-testid="financial-overview"]').should('be.visible')
      cy.get('[data-testid="ticket-statistics"]').should('be.visible')
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      
      // Verify data is present
      cy.get('[data-testid="total-budget"]').should('not.be.empty')
      cy.get('[data-testid="total-tickets"]').should('not.be.empty')
    })

    it('should display lists correctly', () => {
      // Test tickets list
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-list"]').should('be.visible')
      
      // Test invoices list
      cy.get('[data-testid="nav-invoices"]').click()
      cy.get('[data-testid="invoice-list"]').should('be.visible')
      
      // Test people list
      cy.get('[data-testid="nav-people"]').click()
      cy.get('[data-testid="people-list"]').should('be.visible')
    })

    it('should handle empty states', () => {
      // Navigate to a page that might be empty
      cy.get('[data-testid="nav-people"]').click()
      
      // Should show appropriate empty state
      cy.get('[data-testid="empty-state"]').should('be.visible')
    })
  })

  describe('Performance Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should load pages within acceptable time', () => {
      const pages = [
        { name: 'Dashboard', selector: '[data-testid="nav-dashboard"]' },
        { name: 'Tickets', selector: '[data-testid="nav-tickets"]' },
        { name: 'Budget', selector: '[data-testid="nav-budget"]' },
        { name: 'Invoices', selector: '[data-testid="nav-invoices"]' }
      ]

      pages.forEach(page => {
        const startTime = Date.now()
        cy.get(page.selector).click()
        cy.get('[data-testid="page-title"]').should('be.visible')
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000)
      })
    })

    it('should handle rapid navigation', () => {
      // Navigate quickly between pages
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="nav-tickets"]').click()
        cy.get('[data-testid="nav-budget"]').click()
        cy.get('[data-testid="nav-invoices"]').click()
        cy.get('[data-testid="nav-dashboard"]').click()
      }
      
      // Should not crash or show errors
      cy.get('[data-testid="error-message"]').should('not.exist')
    })
  })

  describe('Error Handling Regression Tests', () => {
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

    it('should handle server errors', () => {
      // Simulate server error
      cy.intercept('POST', '/api/tickets', { statusCode: 500 })
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Test Ticket')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should handle invalid data gracefully', () => {
      // Try to submit invalid data
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Should show validation error
      cy.get('[data-testid="validation-error"]').should('be.visible')
    })
  })

  describe('UI/UX Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should maintain responsive design', () => {
      // Test mobile viewport
      cy.viewport('iphone-6')
      cy.get('[data-testid="sidebar-toggle"]').should('be.visible')
      cy.get('[data-testid="sidebar"]').should('not.be.visible')
      
      // Test tablet viewport
      cy.viewport('ipad-2')
      cy.get('[data-testid="sidebar"]').should('be.visible')
      
      // Test desktop viewport
      cy.viewport(1920, 1080)
      cy.get('[data-testid="sidebar"]').should('be.visible')
    })

    it('should maintain accessibility features', () => {
      // Check for ARIA labels
      cy.get('[data-testid="nav-tickets"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="nav-budget"]').should('have.attr', 'aria-label')
      
      // Check for proper heading structure
      cy.get('h1').should('exist')
      cy.get('h2').should('exist')
    })

    it('should maintain consistent styling', () => {
      // Check that primary buttons have consistent styling
      cy.get('[data-testid="submit-ticket"]').should('have.class', 'bg-blue-600')
      cy.get('[data-testid="login-button"]').should('have.class', 'bg-blue-600')
    })
  })

  describe('Cross-Browser Compatibility Tests', () => {
    it('should work in Chrome', () => {
      // This test assumes Chrome is the default browser
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="dashboard"]').should('be.visible')
    })

    // Note: Cross-browser tests would require running in different browsers
    // This is typically handled in CI/CD pipeline
  })

  describe('Security Regression Tests', () => {
    it('should prevent XSS attacks', () => {
      // Try to inject script in login form
      cy.get('[data-testid="email-input"]').type('<script>alert("xss")</script>')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Should not execute script
      cy.on('window:alert', () => {
        throw new Error('XSS alert should not appear')
      })
    })

    it('should prevent SQL injection', () => {
      // Try SQL injection in login form
      cy.get('[data-testid="email-input"]').type("'; DROP TABLE users; --")
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Should show error message, not crash
      cy.get('[data-testid="error-message"]').should('be.visible')
    })
  })

  describe('Data Persistence Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should persist data across browser sessions', () => {
      // Create test data
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Persistence Test Ticket')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Clear browser data and reload
      cy.clearLocalStorage()
      cy.reload()
      
      // Login again
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      // Verify data still exists
      cy.get('[data-testid="nav-tickets"]').click()
      cy.get('[data-testid="ticket-list"]').should('contain', 'Persistence Test Ticket')
    })

    it('should handle data conflicts gracefully', () => {
      // Create data in one session
      cy.get('[data-testid="nav-create-ticket"]').click()
      cy.get('[data-testid="ticket-title"]').type('Conflict Test Ticket')
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Simulate concurrent modification
      cy.get('[data-testid="ticket-item"]').first().click()
      cy.get('[data-testid="update-status"]').click()
      cy.get('[data-testid="status-select"]').select('In Progress')
      cy.get('[data-testid="save-status"]').click()
      
      // Should handle conflict without crashing
      cy.get('[data-testid="success-message"]').should('be.visible')
    })
  })

  describe('API Integration Regression Tests', () => {
    beforeEach(() => {
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
    })

    it('should handle API timeouts', () => {
      // Simulate API timeout
      cy.intercept('GET', '/api/tickets', { delay: 10000 })
      cy.get('[data-testid="nav-tickets"]').click()
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      
      // Should handle timeout gracefully
      cy.get('[data-testid="timeout-error"]').should('be.visible')
    })

    it('should handle API rate limiting', () => {
      // Simulate rate limiting
      cy.intercept('GET', '/api/tickets', { statusCode: 429 })
      cy.get('[data-testid="nav-tickets"]').click()
      
      // Should show appropriate error message
      cy.get('[data-testid="error-message"]').should('contain', 'Too many requests')
    })

    it('should handle API version changes', () => {
      // Simulate API version mismatch
      cy.intercept('GET', '/api/tickets', { statusCode: 400, body: { error: 'API version not supported' } })
      cy.get('[data-testid="nav-tickets"]').click()
      
      // Should handle gracefully
      cy.get('[data-testid="error-message"]').should('be.visible')
    })
  })
}) 