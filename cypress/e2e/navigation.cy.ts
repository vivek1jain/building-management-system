/// <reference types="cypress" />

describe('Navigation Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    // Login before each test
    cy.get('[data-testid="email-input"]').type('manager@building.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()
  })

  describe('Desktop Navigation', () => {
    it('should display sidebar navigation on desktop', () => {
      cy.viewport(1920, 1080)
      cy.get('[data-testid="sidebar"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
    })

    it('should navigate through all sidebar items', () => {
      cy.viewport(1920, 1080)
      const sidebarItems = [
        { name: 'Dashboard', href: '/' },
        { name: 'Ticketing', href: '/tickets' },
        { name: 'Events', href: '/events' },
        { name: 'Finances', href: '/finances' },
        { name: 'Building Data', href: '/building-data' },
        { name: 'Reports', href: '/reports' },
        { name: 'Settings', href: '/settings' },
        { name: 'Admin', href: '/admin' }
      ]

      sidebarItems.forEach(item => {
        cy.contains(item.name).click()
        cy.url().should('include', item.href)
      })
    })
  })

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-x')
    })

    it('should display mobile bottom navigation on mobile', () => {
      cy.get('[data-testid="sidebar"]').should('not.be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
    })

    it('should navigate through mobile bottom nav items', () => {
      const mobileNavItems = [
        { name: 'Home', href: '/' },
        { name: 'Tickets', href: '/tickets' },
        { name: 'Finances', href: '/finances' },
        { name: 'Building', href: '/building-data' },
        { name: 'More', href: '/more' }
      ]

      mobileNavItems.forEach(item => {
        cy.get('[data-testid="mobile-bottom-nav"]').contains(item.name).click()
        cy.url().should('include', item.href)
      })
    })

    it('should display More menu with all additional items', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').contains('More').click()
      cy.url().should('include', '/more')
      
      // Verify all More menu items are visible
      const moreItems = ['Events', 'Reports', 'Settings', 'Admin']
      moreItems.forEach(item => {
        cy.contains(item).should('be.visible')
      })
    })

    it('should navigate to each More menu item', () => {
      cy.get('[data-testid="mobile-bottom-nav"]').contains('More').click()
      
      const moreItems = [
        { name: 'Events', href: '/events' },
        { name: 'Reports', href: '/reports' },
        { name: 'Settings', href: '/settings' },
        { name: 'Admin', href: '/admin' }
      ]

      moreItems.forEach(item => {
        cy.visit('/more') // Go back to More menu
        cy.contains(item.name).click()
        cy.url().should('include', item.href)
      })
    })

    it('should maintain active tab state for More items', () => {
      // Navigate to Events through More menu
      cy.get('[data-testid="mobile-bottom-nav"]').contains('More').click()
      cy.contains('Events').click()
      
      // Verify More tab is still active in bottom nav
      cy.get('[data-testid="mobile-bottom-nav"]')
        .find('[href="/more"]')
        .should('have.class', 'text-primary-600')
    })
  })

  describe('Responsive Navigation', () => {
    it('should switch between desktop and mobile navigation', () => {
      // Start with desktop
      cy.viewport(1920, 1080)
      cy.get('[data-testid="sidebar"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
      
      // Switch to mobile
      cy.viewport('iphone-x')
      cy.get('[data-testid="sidebar"]').should('not.be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
      
      // Switch back to desktop
      cy.viewport(1920, 1080)
      cy.get('[data-testid="sidebar"]').should('be.visible')
      cy.get('[data-testid="mobile-bottom-nav"]').should('not.be.visible')
    })

    it('should maintain navigation state across viewport changes', () => {
      // Start on desktop, navigate to tickets
      cy.viewport(1920, 1080)
      cy.contains('Ticketing').click()
      cy.url().should('include', '/tickets')
      
      // Switch to mobile, should still be on tickets
      cy.viewport('iphone-x')
      cy.url().should('include', '/tickets')
      cy.get('[data-testid="mobile-bottom-nav"]')
        .find('[href="/tickets"]')
        .should('have.class', 'text-primary-600')
    })
  })
})
