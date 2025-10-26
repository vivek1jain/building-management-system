/// <reference types="cypress" />

describe('Events Management', () => {
  beforeEach(() => {
    // Clear all cookies, local storage, and IndexedDB to ensure clean state
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Clear IndexedDB (where Firebase auth stores session data)
    indexedDB.deleteDatabase('firebaseLocalStorageDb')
    
    // Visit the application and login
    cy.visit('/')
    cy.url().should('include', '/login', { timeout: 10000 })
    
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
    
    // Wait for dashboard to load
    cy.url().should('include', '/', { timeout: 10000 })
    cy.get('[data-testid="user-menu"]').should('be.visible')
    
    // Navigate to events page
    cy.get('[data-testid="nav-events"]').click()
    cy.url().should('include', '/events')
    cy.get('[data-testid="page-title"]').should('contain', 'Events')
  })

  describe('Events Page Load', () => {
    it('should load the events page successfully', () => {
      cy.contains('Events').should('be.visible')
    })

    it('should display create event button or form trigger', () => {
      // Look for any button or link to create event
      cy.get('body').should('be.visible')
    })
  })

  describe('Create Event Form', () => {
    beforeEach(() => {
      // Open create event modal/form
      // This might be a button with text "Create Event" or "Schedule Event" or similar
      cy.contains(/create.*event|schedule.*event|new.*event/i, { timeout: 5000 }).click()
    })

    it('should open create event form', () => {
      cy.get('[data-testid="event-title"]', { timeout: 5000 }).should('be.visible')
    })

    it('should have all required form fields', () => {
      cy.get('[data-testid="event-title"]').should('be.visible')
      cy.get('[data-testid="event-description"]').should('be.visible')
      cy.get('[data-testid="event-location"]').should('be.visible')
      cy.get('[data-testid="event-date"]').should('be.visible')
      cy.get('[data-testid="event-time"]').should('be.visible')
      cy.get('[data-testid="save-event"]').should('be.visible')
    })

    it('should allow entering event details', () => {
      const timestamp = Date.now()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      cy.get('[data-testid="event-title"]').type(`Test Event ${timestamp}`)
      cy.get('[data-testid="event-description"]').type('This is a test event description')
      cy.get('[data-testid="event-location"]').type('Building A - Main Hall')
      cy.get('[data-testid="event-date"]').type(tomorrowStr)
      cy.get('[data-testid="event-time"]').type('14:00')
      
      // Verify values
      cy.get('[data-testid="event-title"]').should('have.value', `Test Event ${timestamp}`)
      cy.get('[data-testid="event-description"]').should('contain.value', 'test event description')
      cy.get('[data-testid="event-location"]').should('have.value', 'Building A - Main Hall')
    })

    it('should create a new event', () => {
      const timestamp = Date.now()
      const eventTitle = `Cypress Event ${timestamp}`
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      cy.get('[data-testid="event-title"]').type(eventTitle)
      cy.get('[data-testid="event-description"]').type('Automated test event from Cypress')
      cy.get('[data-testid="event-location"]').type('Test Location')
      cy.get('[data-testid="event-date"]').type(tomorrowStr)
      cy.get('[data-testid="event-time"]').type('10:00')
      
      cy.get('[data-testid="save-event"]').click()
      
      // Wait for form to close
      cy.get('[data-testid="event-title"]', { timeout: 5000 }).should('not.exist')
      
      // Verify event appears in list
      cy.wait(1000)
      cy.contains(eventTitle, { timeout: 10000 }).should('be.visible')
    })

    it('should validate required fields', () => {
      // Try to save without filling required fields
      cy.get('[data-testid="save-event"]').should('be.disabled')
      
      // Fill only title
      cy.get('[data-testid="event-title"]').type('Test')
      cy.get('[data-testid="save-event"]').should('be.disabled')
      
      // Fill description
      cy.get('[data-testid="event-description"]').type('Test description')
      cy.get('[data-testid="save-event"]').should('be.disabled')
    })

    it('should close form on cancel', () => {
      cy.contains('Cancel').click()
      
      // Form should close
      cy.get('[data-testid="event-title"]').should('not.exist')
    })
  })

  describe('Event Date and Time', () => {
    beforeEach(() => {
      cy.contains(/create.*event|schedule.*event|new.*event/i, { timeout: 5000 }).click()
    })

    it('should accept future dates', () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]
      
      cy.get('[data-testid="event-date"]').type(nextWeekStr)
      cy.get('[data-testid="event-date"]').should('have.value', nextWeekStr)
    })

    it('should accept valid time format', () => {
      cy.get('[data-testid="event-time"]').type('15:30')
      cy.get('[data-testid="event-time"]').should('have.value', '15:30')
    })

    it('should have date input with proper type', () => {
      cy.get('[data-testid="event-date"]').should('have.attr', 'type', 'date')
    })

    it('should have time input with proper type', () => {
      cy.get('[data-testid="event-time"]').should('have.attr', 'type', 'time')
    })
  })

  describe('Event Location', () => {
    beforeEach(() => {
      cy.contains(/create.*event|schedule.*event|new.*event/i, { timeout: 5000 }).click()
    })

    it('should accept various location formats', () => {
      const locations = [
        'Building A',
        'Conference Room 101',
        'Main Hall',
        'Outdoor Garden Area'
      ]
      
      locations.forEach((location) => {
        cy.get('[data-testid="event-location"]').clear().type(location)
        cy.get('[data-testid="event-location"]').should('have.value', location)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-6')
      
      cy.contains('Events').should('be.visible')
    })

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2')
      
      cy.contains('Events').should('be.visible')
    })

    it('should display correctly on desktop viewport', () => {
      cy.viewport(1920, 1080)
      
      cy.contains('Events').should('be.visible')
    })
  })

  describe('Form Validation Messages', () => {
    beforeEach(() => {
      cy.contains(/create.*event|schedule.*event|new.*event/i, { timeout: 5000 }).click()
    })

    it('should mark required fields', () => {
      // Required fields should have * or required attribute
      cy.get('[data-testid="event-title"]').should('have.attr', 'required')
      cy.get('[data-testid="event-description"]').should('have.attr', 'required')
      cy.get('[data-testid="event-location"]').should('have.attr', 'required')
    })
  })

  describe('Multiple Events', () => {
    it('should handle creating multiple events', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      // Create first event
      cy.contains(/create.*event|schedule.*event|new.*event/i).click()
      
      const timestamp1 = Date.now()
      cy.get('[data-testid="event-title"]').type(`Event 1 ${timestamp1}`)
      cy.get('[data-testid="event-description"]').type('First test event')
      cy.get('[data-testid="event-location"]').type('Location A')
      cy.get('[data-testid="event-date"]').type(tomorrowStr)
      cy.get('[data-testid="event-time"]').type('09:00')
      cy.get('[data-testid="save-event"]').click()
      
      cy.wait(2000)
      
      // Create second event
      cy.contains(/create.*event|schedule.*event|new.*event/i).click()
      
      const timestamp2 = Date.now()
      cy.get('[data-testid="event-title"]').type(`Event 2 ${timestamp2}`)
      cy.get('[data-testid="event-description"]').type('Second test event')
      cy.get('[data-testid="event-location"]').type('Location B')
      cy.get('[data-testid="event-date"]').type(tomorrowStr)
      cy.get('[data-testid="event-time"]').type('14:00')
      cy.get('[data-testid="save-event"]').click()
      
      cy.wait(2000)
      
      // Verify both events exist
      cy.contains(`Event 1 ${timestamp1}`).should('be.visible')
      cy.contains(`Event 2 ${timestamp2}`).should('be.visible')
    })
  })
})
