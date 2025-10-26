/// <reference types="cypress" />

describe('People Management', () => {
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
    
    // Navigate to people page (via comprehensive/building data)
    cy.visit('/comprehensive')
    
    // Wait for page to load and click People tab if needed
    cy.contains('People', { timeout: 10000 }).should('be.visible')
  })

  describe('People List View', () => {
    it('should display the people list', () => {
      cy.get('[data-testid="people-list"]', { timeout: 10000 }).should('exist')
    })

    it('should show person items when people exist', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="person-item"]').length > 0) {
          cy.get('[data-testid="person-item"]').should('have.length.greaterThan', 0)
          cy.log('People data exists')
        } else {
          cy.log('No people data - fresh installation')
        }
      })
    })

    it('should display person information correctly', () => {
      cy.get('[data-testid="person-item"]').first().then(($item) => {
        if ($item.length > 0) {
          // Should contain name, email, or phone
          cy.wrap($item).should('be.visible')
        }
      })
    })
  })

  describe('Add Person', () => {
    it('should open add person form', () => {
      // Find and click the add person button (may be hidden, need to trigger)
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      // Modal should open with form fields
      cy.get('[data-testid="person-name"]', { timeout: 5000 }).should('be.visible')
    })

    it('should have all required form fields', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      cy.get('[data-testid="person-name"]').should('be.visible')
      cy.get('[data-testid="person-email"]').should('be.visible')
      cy.get('[data-testid="person-phone"]').should('be.visible')
      cy.get('[data-testid="person-status"]').should('be.visible')
      cy.get('[data-testid="save-person"]').should('be.visible')
    })

    it('should allow entering person details', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      const timestamp = Date.now()
      cy.get('[data-testid="person-name"]').type(`Test Person ${timestamp}`)
      cy.get('[data-testid="person-email"]').type(`test${timestamp}@example.com`)
      cy.get('[data-testid="person-phone"]').type('555-0123')
      cy.get('[data-testid="person-status"]').select('Resident')
      
      // Verify values are entered
      cy.get('[data-testid="person-name"]').should('have.value', `Test Person ${timestamp}`)
      cy.get('[data-testid="person-email"]').should('have.value', `test${timestamp}@example.com`)
      cy.get('[data-testid="person-phone"]').should('have.value', '555-0123')
    })

    it('should create a new person', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      const timestamp = Date.now()
      const testName = `Cypress Test ${timestamp}`
      
      cy.get('[data-testid="person-name"]').type(testName)
      cy.get('[data-testid="person-email"]').type(`cypress${timestamp}@test.com`)
      cy.get('[data-testid="person-phone"]').type('555-9999')
      cy.get('[data-testid="person-status"]').select('Resident')
      
      cy.get('[data-testid="save-person"]').click()
      
      // Wait for modal to close and list to update
      cy.get('[data-testid="person-name"]', { timeout: 5000 }).should('not.exist')
      
      // Verify person appears in list (may take a moment to refresh)
      cy.wait(1000)
      cy.contains(testName, { timeout: 10000 }).should('be.visible')
    })

    it('should validate required fields', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      // Try to save without filling required fields
      cy.get('[data-testid="save-person"]').click()
      
      // Form should still be visible (validation should prevent submission)
      cy.get('[data-testid="person-name"]').should('be.visible')
    })

    it('should close form on cancel', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      cy.contains('Cancel').click()
      
      // Form should close
      cy.get('[data-testid="person-name"]').should('not.exist')
    })
  })

  describe('Person Status Options', () => {
    it('should have status dropdown with options', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      cy.get('[data-testid="person-status"]').should('be.visible')
      
      // Check for common status options
      cy.get('[data-testid="person-status"]').find('option').should('have.length.greaterThan', 0)
    })

    it('should allow selecting different statuses', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      cy.get('[data-testid="person-status"]').select('Resident')
      cy.get('[data-testid="person-status"]').should('have.value', 'Resident')
      
      // Try another status if available
      cy.get('[data-testid="person-status"]').then(($select) => {
        const options = $select.find('option')
        if (options.length > 1) {
          cy.get('[data-testid="person-status"]').select(options.eq(1).val() as string)
        }
      })
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-6')
      
      // People list should adapt to mobile view
      cy.get('[data-testid="people-list"]').should('exist')
    })

    it('should display correctly on desktop viewport', () => {
      cy.viewport(1920, 1080)
      
      cy.get('[data-testid="people-list"]').should('exist')
    })
  })

  describe('Edit Person', () => {
    it('should allow editing an existing person', () => {
      cy.get('[data-testid="person-item"]').first().then(($item) => {
        if ($item.length > 0) {
          // Click on the person item or edit button
          cy.wrap($item).click()
          
          // Form should open with existing data
          cy.wait(500)
          
          // Check if edit form opened
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="person-name"]').length > 0) {
              cy.get('[data-testid="person-name"]').should('not.have.value', '')
              cy.log('Edit form opened successfully')
            }
          })
        }
      })
    })
  })

  describe('Data Validation', () => {
    it('should validate email format', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      cy.get('[data-testid="person-name"]').type('Test User')
      cy.get('[data-testid="person-email"]').type('invalid-email')
      cy.get('[data-testid="person-phone"]').type('555-0000')
      
      // HTML5 email validation should trigger
      cy.get('[data-testid="person-email"]').should('have.attr', 'type', 'email')
    })

    it('should validate phone format', () => {
      cy.get('[data-testid="add-person"]').click({ force: true })
      
      cy.get('[data-testid="person-phone"]').should('have.attr', 'type', 'tel')
    })
  })
})
