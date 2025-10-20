// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for building management system
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with demo user
       * @example cy.loginAsDemoUser()
       */
      loginAsDemoUser(): Chainable<void>
      
      /**
       * Custom command to create a test ticket
       * @example cy.createTestTicket()
       */
      createTestTicket(): Chainable<void>
      
      /**
       * Custom command to add sample suppliers
       * @example cy.addSampleSuppliers()
       */
      addSampleSuppliers(): Chainable<void>
      
      /**
       * Custom command to wait for Firebase operations
       * @example cy.waitForFirebase()
       */
      waitForFirebase(): Chainable<void>
    }
  }
} 