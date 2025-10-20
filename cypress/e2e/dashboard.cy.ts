/// <reference types="cypress" />

describe('Dashboard', () => {
  beforeEach(() => {
    cy.loginAsDemoUser()
  })

  it('should display dashboard with all sections', () => {
    cy.get('[data-testid="dashboard-title"]').should('contain', 'Dashboard')
    cy.get('[data-testid="stats-cards"]').should('be.visible')
    cy.get('[data-testid="recent-tickets"]').should('be.visible')
    cy.get('[data-testid="quick-actions"]').should('be.visible')
  })

  it('should display ticket statistics', () => {
    cy.get('[data-testid="total-tickets"]').should('be.visible')
    cy.get('[data-testid="open-tickets"]').should('be.visible')
    cy.get('[data-testid="completed-tickets"]').should('be.visible')
    cy.get('[data-testid="pending-quotes"]').should('be.visible')
  })

  it('should navigate to create ticket from quick actions', () => {
    cy.get('[data-testid="create-ticket-quick"]').click()
    cy.url().should('include', '/create-ticket')
  })

  it('should navigate to tickets from quick actions', () => {
    cy.get('[data-testid="view-tickets-quick"]').click()
    cy.url().should('include', '/tickets')
  })

  it('should display recent tickets with correct information', () => {
    cy.get('[data-testid="recent-tickets-list"]').within(() => {
      cy.get('[data-testid="ticket-item"]').first().within(() => {
        cy.get('[data-testid="ticket-title"]').should('be.visible')
        cy.get('[data-testid="ticket-status"]').should('be.visible')
        cy.get('[data-testid="ticket-priority"]').should('be.visible')
        cy.get('[data-testid="ticket-date"]').should('be.visible')
      })
    })
  })

  it('should click on recent ticket to view details', () => {
    cy.get('[data-testid="recent-tickets-list"]')
      .find('[data-testid="ticket-item"]')
      .first()
      .click()
    cy.url().should('include', '/ticket/')
  })

  it('should display notifications', () => {
    cy.get('[data-testid="notification-bell"]').should('be.visible')
    cy.get('[data-testid="notification-bell"]').click()
    cy.get('[data-testid="notifications-dropdown"]').should('be.visible')
  })

  it('should test responsive design on mobile', () => {
    cy.viewport('iphone-x')
    cy.get('[data-testid="sidebar-toggle"]').should('be.visible')
    cy.get('[data-testid="sidebar-toggle"]').click()
    cy.get('[data-testid="sidebar"]').should('be.visible')
  })

  it('should test Firebase connectivity indicator', () => {
    cy.get('[data-testid="firebase-status"]').should('be.visible')
    cy.get('[data-testid="firebase-status"]').should('contain', 'Connected')
  })
}) 