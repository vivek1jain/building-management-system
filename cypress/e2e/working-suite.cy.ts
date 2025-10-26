/// <reference types="cypress" />

/**
 * Working Test Suite - Consolidated passing tests
 * These tests have all required test IDs in place and pass successfully
 */

describe('Building Management System - Working Test Suite', () => {
  beforeEach(() => {
    // Clear all state for clean test environment
    cy.clearCookies()
    cy.clearLocalStorage()
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Visit root and wait for login redirect
    cy.visit('/')
    cy.url().should('include', '/login', { timeout: 10000 })
  })

  describe('Authentication & User Management', () => {
    it('should allow user login with valid credentials', () => {
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

  describe('Dashboard Functionality', () => {
    beforeEach(() => {
      // Login for dashboard tests
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
  })

  describe('Navigation & Layout', () => {
    beforeEach(() => {
      // Login for navigation tests
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      cy.url().should('eq', 'http://localhost:3003/', { timeout: 15000 })
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

  describe('Ticket Management', () => {
    beforeEach(() => {
      // Login for ticket tests
      cy.get('[data-testid="email-input"]').type('manager@building.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      cy.url().should('eq', 'http://localhost:3003/', { timeout: 15000 })
    })

    it('should create a new ticket', () => {
      // Navigate directly to create ticket page
      cy.visit('/tickets/new')
      
      // Wait for form to load
      cy.get('[data-testid="ticket-title"]', { timeout: 10000 }).should('be.visible')
      
      // Fill in the form
      cy.get('[data-testid="ticket-title"]').type('Test Maintenance Request')
      cy.get('[data-testid="ticket-description"]').type('This is a test maintenance request for Cypress')
      cy.get('[data-testid="ticket-location"]').type('Apartment 101')
      
      // Select urgency - it's radio buttons
      cy.get('[data-testid="ticket-urgency"]').first().check({ force: true })
      
      // Submit the ticket
      cy.get('[data-testid="submit-ticket"]').click()
      
      // Should redirect to tickets page (ticket was created successfully)
      cy.url().should('include', '/tickets', { timeout: 10000 })
      
      // Verify we're on the tickets page with the ticket list
      cy.get('[data-testid="ticket-list"]').should('be.visible')
    })

    it('should display ticket list', () => {
      cy.get('[data-testid="nav-tickets"]').click()
      cy.url().should('include', '/tickets')
      
      // Verify ticket list is visible
      cy.get('[data-testid="ticket-list"]').should('be.visible')
    })
  })
})
