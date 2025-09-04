/// <reference types="cypress" />

describe('Supplier Management', () => {
  beforeEach(() => {
    cy.loginAsDemoUser()
  })

  describe('Supplier List', () => {
    beforeEach(() => {
      cy.visit('/suppliers')
    })

    it('should display suppliers page with all elements', () => {
      cy.get('[data-testid="suppliers-header"]').should('be.visible')
      cy.get('[data-testid="add-sample-data"]').should('be.visible')
      cy.get('[data-testid="suppliers-list"]').should('be.visible')
      cy.get('[data-testid="search-suppliers"]').should('be.visible')
      cy.get('[data-testid="filter-specialty"]').should('be.visible')
    })

    it('should add sample suppliers successfully', () => {
      cy.get('[data-testid="add-sample-data"]').click()
      cy.waitForFirebase()
      cy.get('[data-testid="success-notification"]').should('be.visible')
      cy.get('[data-testid="suppliers-list"]')
        .find('[data-testid="supplier-item"]')
        .should('have.length.gt', 0)
    })

    it('should search suppliers by name', () => {
      cy.get('[data-testid="add-sample-data"]').click()
      cy.waitForFirebase()
      
      const searchTerm = 'Plumbing'
      cy.get('[data-testid="search-suppliers"]').type(searchTerm)
      cy.get('[data-testid="suppliers-list"]')
        .find('[data-testid="supplier-item"]')
        .each(($el) => {
          cy.wrap($el).should('contain', searchTerm)
        })
    })

    it('should filter suppliers by specialty', () => {
      cy.get('[data-testid="add-sample-data"]').click()
      cy.waitForFirebase()
      
      cy.get('[data-testid="filter-specialty"]').select('Electrical')
      cy.get('[data-testid="suppliers-list"]')
        .find('[data-testid="supplier-item"]')
        .each(($el) => {
          cy.wrap($el).should('contain', 'Electrical')
        })
    })

    it('should display supplier details correctly', () => {
      cy.get('[data-testid="add-sample-data"]').click()
      cy.waitForFirebase()
      
      cy.get('[data-testid="suppliers-list"]')
        .find('[data-testid="supplier-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="supplier-name"]').should('be.visible')
          cy.get('[data-testid="supplier-company"]').should('be.visible')
          cy.get('[data-testid="supplier-rating"]').should('be.visible')
          cy.get('[data-testid="supplier-specialties"]').should('be.visible')
          cy.get('[data-testid="supplier-contact"]').should('be.visible')
        })
    })

    it('should select suppliers for quote requests', () => {
      cy.get('[data-testid="add-sample-data"]').click()
      cy.waitForFirebase()
      
      cy.get('[data-testid="supplier-checkbox"]').first().check()
      cy.get('[data-testid="supplier-checkbox"]').eq(1).check()
      cy.get('[data-testid="request-quotes-button"]').click()
      cy.get('[data-testid="success-notification"]').should('be.visible')
    })
  })

  describe('Quote Submission (Supplier View)', () => {
    beforeEach(() => {
      // Mock supplier user role
      cy.intercept('GET', '**/users/**', { fixture: 'supplier-user.json' }).as('getSupplierUser')
      cy.visit('/suppliers')
    })

    it('should display quote submission form for suppliers', () => {
      cy.get('[data-testid="submit-quote-button"]').should('be.visible')
      cy.get('[data-testid="submit-quote-button"]').click()
      cy.get('[data-testid="quote-form"]').should('be.visible')
    })

    it('should submit quote successfully', () => {
      cy.get('[data-testid="submit-quote-button"]').click()
      
      cy.get('[data-testid="quote-amount"]').type('500')
      cy.get('[data-testid="quote-currency"]').select('USD')
      cy.get('[data-testid="quote-description"]').type('Complete repair service including parts and labor')
      cy.get('[data-testid="quote-terms"]').type('Payment due within 30 days')
      cy.get('[data-testid="quote-valid-until"]').type('2024-12-31')
      
      cy.get('[data-testid="submit-quote-form"]').click()
      cy.get('[data-testid="success-notification"]').should('be.visible')
    })

    it('should show validation errors for required fields', () => {
      cy.get('[data-testid="submit-quote-button"]').click()
      cy.get('[data-testid="submit-quote-form"]').click()
      cy.get('[data-testid="validation-error"]').should('be.visible')
    })

    it('should upload attachments to quote', () => {
      cy.get('[data-testid="submit-quote-button"]').click()
      
      cy.get('[data-testid="quote-amount"]').type('750')
      cy.get('[data-testid="quote-description"]').type('Service with documentation')
      cy.get('[data-testid="quote-terms"]').type('Standard terms')
      cy.get('[data-testid="quote-valid-until"]').type('2024-12-31')
      
      // Upload attachment
      cy.get('[data-testid="quote-attachments"]').attachFile('quote-document.pdf')
      cy.get('[data-testid="attachment-preview"]').should('be.visible')
      
      cy.get('[data-testid="submit-quote-form"]').click()
      cy.get('[data-testid="success-notification"]').should('be.visible')
    })
  })

  describe('Quote Management', () => {
    beforeEach(() => {
      cy.visit('/suppliers')
      cy.get('[data-testid="add-sample-data"]').click()
      cy.waitForFirebase()
    })

    it('should display quote requests for suppliers', () => {
      cy.get('[data-testid="quote-requests"]').should('be.visible')
      cy.get('[data-testid="quote-request-item"]').should('have.length.gt', 0)
    })

    it('should respond to quote requests', () => {
      cy.get('[data-testid="quote-request-item"]').first().within(() => {
        cy.get('[data-testid="respond-to-quote"]').click()
      })
      
      cy.get('[data-testid="quote-response-form"]').should('be.visible')
      cy.get('[data-testid="quote-amount"]').type('600')
      cy.get('[data-testid="quote-description"]').type('Professional service response')
      cy.get('[data-testid="submit-quote-response"]').click()
      
      cy.get('[data-testid="success-notification"]').should('be.visible')
    })

    it('should view quote history', () => {
      cy.get('[data-testid="quote-history"]').should('be.visible')
      cy.get('[data-testid="quote-history-item"]').should('have.length.gt', 0)
    })
  })
}) 