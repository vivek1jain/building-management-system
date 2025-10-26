/// <reference types="cypress" />

describe('Ticket List Tests', () => {
  beforeEach(() => {
    // Clear state and login
    cy.clearCookies()
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('eq', 'http://localhost:3003/', { timeout: 15000 })
  })

  it('should display ticket list', () => {
    cy.get('[data-testid="nav-tickets"]').click()
    cy.url().should('include', '/tickets')
    
    // Verify ticket list is visible
    cy.get('[data-testid="ticket-list"]').should('be.visible')
    
    // Check if there are ticket items (if any exist)
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="ticket-item"]').length > 0) {
        cy.get('[data-testid="ticket-item"]').should('have.length.greaterThan', 0)
      }
    })
  })
})
