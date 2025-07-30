import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3003',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    watchForFileChanges: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        table(message) {
          console.table(message)
          return null
        }
      })
    },
    specPattern: [
      'cypress/e2e/baseline-tests.cy.ts',
      'cypress/e2e/regression-pack.cy.ts',
      'cypress/e2e/**/*.cy.ts'
    ],
    excludeSpecPattern: [
      'cypress/e2e/examples/**/*',
      'cypress/e2e/legacy/**/*'
    ],
    env: {
      // Test environment variables
      TEST_USER_EMAIL: 'manager@building.com',
      TEST_USER_PASSWORD: 'password123',
      ADMIN_USER_EMAIL: 'admin@building.com',
      ADMIN_USER_PASSWORD: 'admin123',
      FINANCE_USER_EMAIL: 'finance@building.com',
      FINANCE_USER_PASSWORD: 'finance123',
      
      // API endpoints
      API_BASE_URL: 'http://localhost:3003/api',
      
      // Test data
      TEST_BUILDING_NAME: 'Test Building',
      TEST_TICKET_TITLE: 'Test Maintenance Request',
      TEST_BUDGET_AMOUNT: '100000',
      
      // Performance thresholds
      PAGE_LOAD_TIMEOUT: 3000,
      API_RESPONSE_TIMEOUT: 5000,
      
      // Feature flags
      ENABLE_ADVANCED_FEATURES: 'true',
      ENABLE_BETA_FEATURES: 'false'
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720
  },

  // Screenshot and video settings
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  
  // Reporter configuration
  reporter: 'spec',

  // Note: Performance and accessibility testing can be implemented
  // through custom commands or plugins if needed
}) 