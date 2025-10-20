/// <reference types="cypress" />

describe('Simple Test', () => {
  it('should visit the app', () => {
    cy.visit('/')
    cy.get('body').should('contain', 'Building Management System')
  })

  it('should have login form', () => {
    cy.visit('/')
    cy.get('form').should('exist')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
  })

  it('should have demo login button', () => {
    cy.visit('/')
    cy.contains('Demo').should('exist')
  })
}) 