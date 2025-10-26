/// <reference types="cypress" />

describe('Budget Management - Simple Tests', () => {
  beforeEach(() => {
    // Clear all cookies, local storage, and IndexedDB to ensure clean state
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Clear IndexedDB (where Firebase auth stores session data)
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Visit the application and wait for redirect to login page
    cy.visit('/')
    cy.url().should('include', '/login', { timeout: 10000 })
    
    // Login
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for dashboard to load
    cy.url().should('include', '/', { timeout: 10000 })
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })

  it('should navigate to finances budget tab', () => {
    // Navigate to Finances page via navigation
    cy.get('[data-testid="nav-budget"]').click()
    
    // Verify we're on the finances page
    cy.url().should('include', '/budget')
    cy.get('[data-testid="page-title"]').should('contain', 'Finances')
  })

  it('should display budget overview section', () => {
    // Navigate to budget
    cy.get('[data-testid="nav-budget"]').click()
    
    // Verify budget overview is visible
    cy.get('[data-testid="budget-overview"]').should('be.visible')
  })

  it('should show create budget button', () => {
    // Navigate to budget
    cy.get('[data-testid="nav-budget"]').click()
    
    // Verify create budget button exists
    cy.get('[data-testid="create-budget"]').should('be.visible')
  })
})
