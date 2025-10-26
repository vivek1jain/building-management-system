/// <reference types="cypress" />

describe('Dashboard & Navigation Tests', () => {
  beforeEach(() => {
    // Clear state
    cy.clearCookies()
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Login before each test
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('eq', 'http://localhost:3003/', { timeout: 15000 })
  })

  it('should display dashboard with all widgets', () => {
    // Check that dashboard loads
    cy.get('[data-testid="dashboard"]').should('be.visible')
    cy.get('[data-testid="page-title"]').should('be.visible')
    
    // Check main widgets exist (scroll into view as needed)
    cy.get('[data-testid="financial-overview"]').should('exist').scrollIntoView().should('be.visible')
    cy.get('[data-testid="ticket-statistics"]').should('exist').scrollIntoView().should('be.visible')
    cy.get('[data-testid="budget-overview"]').should('exist').scrollIntoView().should('be.visible')
    cy.get('[data-testid="recent-activity"]').should('exist').scrollIntoView().should('be.visible')
    cy.get('[data-testid="upcoming-events"]').should('exist').scrollIntoView().should('be.visible')
  })

  it('should navigate to tickets page', () => {
    cy.get('[data-testid="nav-tickets"]').click()
    cy.url().should('include', '/tickets')
    cy.get('[data-testid="page-title"]').should('be.visible')
    cy.get('[data-testid="ticket-list"]').should('be.visible')
  })

  it('should navigate to finances page', () => {
    cy.get('[data-testid="nav-budget"]').click()
    cy.url().should('include', '/finances')
    cy.get('[data-testid="page-title"]').should('be.visible')
  })
})
