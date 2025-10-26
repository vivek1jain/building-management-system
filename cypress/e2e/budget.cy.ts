/// <reference types="cypress" />

describe('Budget Management', () => {
  beforeEach(() => {
    // Clear all cookies, local storage, and IndexedDB to ensure clean state
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Clear IndexedDB (where Firebase auth stores session data)
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Visit the application and login
    cy.visit('/')
    cy.url().should('include', '/login', { timeout: 10000 })
    
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for dashboard to load
    cy.url().should('include', '/', { timeout: 10000 })
    cy.get('[data-testid="user-menu"]').should('be.visible')
    
    // Navigate to budget page
    cy.get('[data-testid="nav-budget"]').click()
    cy.url().should('include', '/finances')
    cy.get('[data-testid="page-title"]').should('contain', 'Finances')
    
    // Click the Budget tab
    cy.contains('Budget').click()
    cy.wait(500) // Wait for tab content to load
  })

  describe('Budget Overview', () => {
    it('should display the budget overview section', () => {
      cy.get('[data-testid="budget-overview"]').should('be.visible')
    })

    it('should show the create budget button', () => {
      cy.get('[data-testid="create-budget"]').should('be.visible')
      cy.get('[data-testid="create-budget"]').should('not.be.disabled')
    })

    it('should display budget totals when budget exists', () => {
      // Check if budget data is displayed (may not exist in fresh install)
      cy.get('[data-testid="budget-overview"]').then(($overview) => {
        if ($overview.find('[data-testid="budget-total"]').length > 0) {
          cy.get('[data-testid="budget-total"]').should('be.visible')
          cy.get('[data-testid="budget-spent"]').should('be.visible')
          
          // Verify format (should contain currency symbol)
          cy.get('[data-testid="budget-total"]').should('contain', '£')
          cy.get('[data-testid="budget-spent"]').should('contain', '£')
        }
      })
    })
  })

  describe('Budget Creation', () => {
    it('should open budget creation modal', () => {
      cy.get('[data-testid="create-budget"]').click()
      
      // Verify modal opens - could be "Create New Budget" or "Edit Budget" depending on if budget exists
      cy.get('[data-testid="budget-year"]').should('be.visible')
      // Check that modal title contains either "Budget" text
      cy.contains(/Create New Budget|Edit Budget/).should('be.visible')
    })

    it('should have default year populated', () => {
      cy.get('[data-testid="create-budget"]').click()
      
      const currentYear = new Date().getFullYear()
      cy.get('[data-testid="budget-year"]').should('have.value', currentYear.toString())
    })

    it('should allow changing the budget year', () => {
      cy.get('[data-testid="create-budget"]').click()
      
      cy.get('[data-testid="budget-year"]').clear().type('2025')
      cy.get('[data-testid="budget-year"]').should('have.value', '2025')
    })

    it('should close modal on cancel', () => {
      cy.get('[data-testid="create-budget"]').click()
      cy.wait(200) // Wait for modal animation
      cy.contains('Cancel').click()
      
      // Modal should close - verify budget-year input no longer visible
      cy.get('[data-testid="budget-year"]').should('not.exist')
    })

    // Note: Full budget creation test would require adding categories
    // which depends on the budget category management system
    it('should show save budget button', () => {
      cy.get('[data-testid="create-budget"]').click()
      cy.get('[data-testid="save-budget"]').should('be.visible')
    })
  })

  describe('Budget Display', () => {
    it('should show budget summary when budget exists', () => {
      // Check if budget overview section is visible
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      
      // Check for budget summary elements (may or may not exist depending on if budget created)
      cy.get('body').then(($body) => {
        const hasBudgetSummary = $body.find('[data-testid="budget-total"]').length > 0
        if (hasBudgetSummary) {
          cy.log('Budget data exists')
          cy.get('[data-testid="budget-total"]').should('be.visible')
        } else {
          cy.log('No budget data - fresh installation')
        }
      })
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-6')
      
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      cy.get('[data-testid="create-budget"]').should('be.visible')
    })

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2')
      
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      cy.get('[data-testid="create-budget"]').should('be.visible')
    })

    it('should display correctly on desktop viewport', () => {
      cy.viewport(1920, 1080)
      
      cy.get('[data-testid="budget-overview"]').should('be.visible')
      cy.get('[data-testid="create-budget"]').should('be.visible')
    })
  })

  describe('Budget Validation', () => {
    it('should require budget year', () => {
      cy.get('[data-testid="create-budget"]').click()
      cy.wait(200) // Wait for modal
      
      // Clear year field
      cy.get('[data-testid="budget-year"]').clear()
      
      // Verify HTML5 validation prevents submission (input has 'required' attribute)
      cy.get('[data-testid="budget-year"]').then($input => {
        expect($input[0].validity.valid).to.be.false
        expect($input[0].validationMessage).to.exist
      })
    })

    it('should accept valid year format', () => {
      cy.get('[data-testid="create-budget"]').click()
      
      cy.get('[data-testid="budget-year"]').clear().type('2024')
      cy.get('[data-testid="budget-year"]').should('have.value', '2024')
    })
  })
})
