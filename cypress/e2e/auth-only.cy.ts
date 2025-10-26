/// <reference types="cypress" />

describe('Authentication Tests', () => {
  beforeEach(() => {
    // Clear all cookies, local storage, and IndexedDB to ensure clean state
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Clear IndexedDB (where Firebase auth stores session data)
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Visit the application and wait for redirect to login page
    cy.visit('/')
    cy.url().should('include', '/login', { timeout: 10000 })
  })

  it('should allow user login with valid credentials', () => {
    // Test login functionality
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    
    // Verify successful login - dashboard is at root path
    cy.url().should('eq', 'http://localhost:3003/', { timeout: 15000 })
    cy.get('[data-testid="user-menu"]').should('be.visible')
    cy.get('[data-testid="dashboard"]').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('invalid@email.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="login-button"]').click()
    
    // Verify error message
    cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Login failed')
  })

  it('should allow user logout', () => {
    // Login first
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for dashboard
    cy.url().should('eq', 'http://localhost:3003/', { timeout: 15000 })
    cy.get('[data-testid="dashboard"]').should('be.visible')
    
    // Logout
    cy.get('[data-testid="user-menu"]').click()
    cy.get('[data-testid="logout-button"]').click()
    
    // Verify logout
    cy.url().should('include', '/login', { timeout: 10000 })
  })
})
