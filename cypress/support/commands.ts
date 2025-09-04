/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Add custom commands to Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      loginAsDemoUser(): Chainable<void>
      createTestTicket(): Chainable<void>
      addSampleSuppliers(): Chainable<void>
      waitForFirebase(): Chainable<void>
      waitForNotification(expectedText: string): Chainable<void>
      clearTestData(): Chainable<void>
    }
  }
}

// Custom command to login as demo user
Cypress.Commands.add('loginAsDemoUser', () => {
  cy.visit('/')
  
  // Wait for page to load completely
  cy.get('[data-testid="demo-login-button"]', { timeout: 15000 }).should('be.visible')
  
  // First create demo users if they don't exist
  cy.get('[data-testid="demo-login-button"]').click()
  
  // Wait for notification with better error handling
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="notification-item"]').length > 0) {
      cy.get('[data-testid="notification-item"]', { timeout: 10000 }).should('contain', 'Demo Users Created!')
    } else {
      // If no notification appears, check if users already exist
      cy.log('No notification found, checking if demo users already exist')
    }
  })
  
  // Then login with demo credentials
  cy.get('[data-testid="email-input"]', { timeout: 10000 }).should('be.visible').type('manager@building.com')
  cy.get('[data-testid="password-input"]').should('be.visible').type('password123')
  cy.get('[data-testid="signin-button"]').click()
  
  // Wait for navigation to dashboard
  cy.url({ timeout: 15000 }).should('include', '/dashboard')
  cy.get('[data-testid="user-avatar"]', { timeout: 10000 }).should('be.visible')
})

// Custom command to create a test ticket
Cypress.Commands.add('createTestTicket', () => {
  cy.visit('/create-ticket')
  cy.get('[data-testid="ticket-title"]', { timeout: 10000 }).should('be.visible').type('Test Maintenance Request')
  cy.get('[data-testid="ticket-description"]').should('be.visible').type('This is a test maintenance request for automated testing')
  cy.get('[data-testid="ticket-priority"]').should('be.visible').select('Medium')
  cy.get('[data-testid="ticket-category"]').should('be.visible').select('Plumbing')
  cy.get('[data-testid="ticket-location"]').should('be.visible').type('Test Location')
  cy.get('[data-testid="submit-ticket"]').should('be.visible').click()
  cy.url({ timeout: 15000 }).should('include', '/tickets')
  cy.contains('Test Maintenance Request', { timeout: 10000 }).should('be.visible')
})

// Custom command to add sample suppliers
Cypress.Commands.add('addSampleSuppliers', () => {
  cy.visit('/suppliers')
  cy.get('[data-testid="add-sample-data"]', { timeout: 10000 }).should('be.visible').click()
  cy.wait(3000) // Wait for Firebase operation
  cy.contains('Sample Data Added', { timeout: 10000 }).should('be.visible')
})

// Custom command to wait for Firebase operations
Cypress.Commands.add('waitForFirebase', () => {
  cy.wait(3000) // Wait for Firebase operations to complete
})

// Custom command to wait for notifications
Cypress.Commands.add('waitForNotification', (expectedText: string) => {
  cy.get('[data-testid="notification-item"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-testid="notification-item"]').should('contain', expectedText)
})

// Custom command to clear all data (for testing)
Cypress.Commands.add('clearTestData', () => {
  // This would clear test data if needed
  cy.log('Clearing test data...')
})

export {} 