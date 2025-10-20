/// <reference types="cypress" />

describe('Ticket Management', () => {
  beforeEach(() => {
    cy.loginAsDemoUser()
  })

  describe('Create Ticket', () => {
    beforeEach(() => {
      cy.visit('/create-ticket')
    })

    it('should display create ticket form with all fields', () => {
      cy.get('[data-testid="create-ticket-form"]').should('be.visible')
      cy.get('[data-testid="ticket-title"]').should('be.visible')
      cy.get('[data-testid="ticket-description"]').should('be.visible')
      cy.get('[data-testid="ticket-priority"]').should('be.visible')
      cy.get('[data-testid="ticket-category"]').should('be.visible')
      cy.get('[data-testid="ticket-location"]').should('be.visible')
      cy.get('[data-testid="file-upload"]').should('be.visible')
      cy.get('[data-testid="submit-ticket"]').should('be.visible')
    })

    it('should create a ticket successfully', () => {
      const ticketTitle = `Test Ticket ${Date.now()}`
      cy.get('[data-testid="ticket-title"]').type(ticketTitle)
      cy.get('[data-testid="ticket-description"]').type('This is a test ticket description')
      cy.get('[data-testid="ticket-priority"]').select('High')
      cy.get('[data-testid="ticket-category"]').select('Electrical')
      cy.get('[data-testid="ticket-location"]').type('Building A - Floor 3')
      cy.get('[data-testid="submit-ticket"]').click()
      
      cy.url().should('include', '/tickets')
      cy.contains(ticketTitle).should('be.visible')
      cy.get('[data-testid="success-notification"]').should('be.visible')
    })

    it('should show validation errors for required fields', () => {
      cy.get('[data-testid="submit-ticket"]').click()
      cy.get('[data-testid="validation-error"]').should('be.visible')
    })

    it('should upload file successfully', () => {
      cy.get('[data-testid="ticket-title"]').type('Test Ticket with File')
      cy.get('[data-testid="ticket-description"]').type('Test description')
      cy.get('[data-testid="ticket-priority"]').select('Medium')
      cy.get('[data-testid="ticket-category"]').select('Plumbing')
      cy.get('[data-testid="ticket-location"]').type('Test Location')
      
      // Upload a test file
      cy.get('[data-testid="file-upload"]').attachFile('test-image.jpg')
      cy.get('[data-testid="file-preview"]').should('be.visible')
      
      cy.get('[data-testid="submit-ticket"]').click()
      cy.url().should('include', '/tickets')
    })
  })

  describe('Ticket List', () => {
    beforeEach(() => {
      cy.visit('/tickets')
    })

    it('should display tickets list with filters', () => {
      cy.get('[data-testid="tickets-list"]').should('be.visible')
      cy.get('[data-testid="status-filter"]').should('be.visible')
      cy.get('[data-testid="priority-filter"]').should('be.visible')
      cy.get('[data-testid="category-filter"]').should('be.visible')
      cy.get('[data-testid="search-input"]').should('be.visible')
    })

    it('should filter tickets by status', () => {
      cy.get('[data-testid="status-filter"]').select('Open')
      cy.get('[data-testid="tickets-list"]')
        .find('[data-testid="ticket-item"]')
        .each(($el) => {
          cy.wrap($el).find('[data-testid="ticket-status"]').should('contain', 'Open')
        })
    })

    it('should search tickets by title', () => {
      const searchTerm = 'Test'
      cy.get('[data-testid="search-input"]').type(searchTerm)
      cy.get('[data-testid="tickets-list"]')
        .find('[data-testid="ticket-item"]')
        .each(($el) => {
          cy.wrap($el).find('[data-testid="ticket-title"]').should('contain', searchTerm)
        })
    })

    it('should sort tickets by date', () => {
      cy.get('[data-testid="sort-by-date"]').click()
      cy.get('[data-testid="tickets-list"]')
        .find('[data-testid="ticket-item"]')
        .should('have.length.gt', 0)
    })

    it('should click on ticket to view details', () => {
      cy.get('[data-testid="tickets-list"]')
        .find('[data-testid="ticket-item"]')
        .first()
        .click()
      cy.url().should('include', '/ticket/')
    })
  })

  describe('Ticket Detail', () => {
    beforeEach(() => {
      cy.visit('/tickets')
      cy.get('[data-testid="tickets-list"]')
        .find('[data-testid="ticket-item"]')
        .first()
        .click()
    })

    it('should display ticket details correctly', () => {
      cy.get('[data-testid="ticket-detail-header"]').should('be.visible')
      cy.get('[data-testid="ticket-title"]').should('be.visible')
      cy.get('[data-testid="ticket-description"]').should('be.visible')
      cy.get('[data-testid="ticket-status"]').should('be.visible')
      cy.get('[data-testid="ticket-priority"]').should('be.visible')
      cy.get('[data-testid="ticket-category"]').should('be.visible')
      cy.get('[data-testid="ticket-location"]').should('be.visible')
      cy.get('[data-testid="ticket-created-date"]').should('be.visible')
    })

    it('should update ticket status', () => {
      cy.get('[data-testid="update-status-button"]').click()
      cy.get('[data-testid="status-select"]').select('In Progress')
      cy.get('[data-testid="status-comment"]').type('Work has started')
      cy.get('[data-testid="update-status-submit"]').click()
      cy.get('[data-testid="success-notification"]').should('be.visible')
      cy.get('[data-testid="ticket-status"]').should('contain', 'In Progress')
    })

    it('should request quotes from suppliers', () => {
      cy.get('[data-testid="request-quote-button"]').click()
      cy.get('[data-testid="supplier-modal"]').should('be.visible')
      cy.get('[data-testid="supplier-checkbox"]').first().check()
      cy.get('[data-testid="send-quote-request"]').click()
      cy.get('[data-testid="success-notification"]').should('be.visible')
    })

    it('should display ticket history', () => {
      cy.get('[data-testid="ticket-history"]').should('be.visible')
      cy.get('[data-testid="history-item"]').should('have.length.gt', 0)
    })

    it('should add comments to ticket', () => {
      const comment = 'This is a test comment'
      cy.get('[data-testid="comment-input"]').type(comment)
      cy.get('[data-testid="add-comment-button"]').click()
      cy.get('[data-testid="success-notification"]').should('be.visible')
      cy.contains(comment).should('be.visible')
    })
  })
}) 