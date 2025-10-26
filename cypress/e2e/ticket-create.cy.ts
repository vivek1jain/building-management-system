/// <reference types="cypress" />

describe('Ticket Creation Tests', () => {
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

  it('should create a new ticket', () => {
    // Navigate to tickets page first
    cy.get('[data-testid="nav-tickets"]').click()
    cy.url().should('include', '/tickets')
    
    // Look for create ticket button or link on the tickets page
    // We'll need to check what's available
    cy.visit('/tickets/new')
    
    // Wait for form to load
    cy.get('[data-testid="ticket-title"]', { timeout: 10000 }).should('be.visible')
    
    // Fill in the form
    cy.get('[data-testid="ticket-title"]').type('Test Maintenance Request')
    cy.get('[data-testid="ticket-description"]').type('This is a test maintenance request for Cypress')
    cy.get('[data-testid="ticket-location"]').type('Apartment 101')
    
    // Select urgency - it's radio buttons
    cy.get('[data-testid="ticket-urgency"]').first().check({ force: true })
    
    // Submit the ticket
    cy.get('[data-testid="submit-ticket"]').click()
    
    // Should redirect to tickets page (ticket was created successfully)
    cy.url().should('include', '/tickets', { timeout: 10000 })
    
    // Verify we're on the tickets page with the ticket list
    cy.get('[data-testid="ticket-list"]').should('be.visible')
  })
})
