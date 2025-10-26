/// <reference types="cypress" />

describe('Debug Login Page', () => {
  it('should find login form elements', () => {
    cy.visit('/login')
    cy.wait(2000) // Wait for any async loading
    
    // Try to find the elements
    cy.get('input[type="email"]').should('exist')
    cy.get('[data-testid="email-input"]').should('exist')
    cy.get('[data-testid="password-input"]').should('exist')
    cy.get('[data-testid="login-button"]').should('exist')
  })
})
