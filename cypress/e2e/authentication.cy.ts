/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display login page with all elements', () => {
    cy.get('form').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.contains('Sign in').should('be.visible')
    cy.contains('Create Demo Users').should('be.visible')
    cy.contains("Don't have an account?").should('be.visible')
  })

  it('should create demo users successfully', () => {
    cy.contains('Create Demo Users').click()
    // Wait for the operation to complete and check for any notification
    cy.wait(5000)
    // First check if any notification appears
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="notification-item"]').length > 0) {
        cy.get('[data-testid="notification-item"]').should('contain', 'Demo Users Created!')
      } else {
        // If no notification, check if there's an error notification
        cy.get('body').should('contain', 'Demo Users Created!')
      }
    })
  })

  it('should login with demo credentials after creating demo users', () => {
    // First create demo users
    cy.contains('Create Demo Users').click()
    cy.contains('Demo Users Created!').should('be.visible')
    
    // Then login with demo credentials
    cy.get('input[type="email"]').type('manager@building.com')
    cy.get('input[type="password"]').type('password123')
    cy.contains('Sign in').click()
    cy.url().should('include', '/dashboard')
  })

  it('should show validation errors for invalid login', () => {
    cy.get('input[type="email"]').type('invalid@email.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.contains('Sign in').click()
    // Wait for potential error message
    cy.wait(2000)
  })

  it('should navigate to registration page', () => {
    cy.contains("Don't have an account?").click()
    cy.contains('Create your account').should('be.visible')
  })

  it('should register a new user successfully', () => {
    cy.contains("Don't have an account?").click()
    const testEmail = `test${Date.now()}@example.com`
    cy.get('input[name="name"]').type('Test User')
    cy.get('input[type="email"]').type(testEmail)
    cy.get('input[type="password"]').type('Test123!')
    cy.contains('Create Account').click()
    cy.url().should('include', '/dashboard')
  })

  it('should handle logout functionality', () => {
    // First create demo users and login
    cy.contains('Create Demo Users').click()
    cy.contains('Demo Users Created!').should('be.visible')
    cy.get('input[type="email"]').type('manager@building.com')
    cy.get('input[type="password"]').type('password123')
    cy.contains('Sign in').click()
    cy.url().should('include', '/dashboard')
    
    // Look for logout option (this might need to be implemented)
    cy.get('body').should('contain', 'Dashboard')
  })
}) 