# 🧪 Test-Driven Development (TDD) Workflow Guide

## 📋 **Overview**

This guide outlines the Test-Driven Development workflow for the Building Management System, using the comprehensive test suite we've created.

---

## 🎯 **TDD Principles**

### **Red-Green-Refactor Cycle**
1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

### **Test-First Development**
- Write tests before implementing features
- Use tests as specifications
- Ensure all tests pass before moving to next feature

---

## 🚀 **Getting Started with TDD**

### **1. Setup Development Environment**

```bash
# Install dependencies
npm install

# Install Cypress (if not already installed)
npm install cypress --save-dev

# Install test reporters
npm install cypress-multi-reporters mochawesome mocha-junit-reporter --save-dev
```

### **2. Start the Application**

```bash
# Start the development server
npm run dev

# In another terminal, start Cypress
npx cypress open
```

### **3. Run Baseline Tests**

```bash
# Run all baseline tests
npx cypress run --spec "cypress/e2e/baseline-tests.cy.ts"

# Run regression tests
npx cypress run --spec "cypress/e2e/regression-pack.cy.ts"

# Run specific test suite
npx cypress run --spec "cypress/e2e/baseline-tests.cy.ts" --grep "Authentication"
```

---

## 📝 **TDD Workflow Steps**

### **Step 1: Write Test First**

```typescript
// Example: Adding a new feature - Resident Portal
describe('Resident Portal', () => {
  it('should allow residents to view their service charges', () => {
    // Arrange
    cy.get('[data-testid="resident-login"]').type('resident@building.com')
    cy.get('[data-testid="resident-password"]').type('resident123')
    cy.get('[data-testid="resident-login-button"]').click()
    
    // Act
    cy.get('[data-testid="nav-service-charges"]').click()
    
    // Assert
    cy.get('[data-testid="resident-charges"]').should('be.visible')
    cy.get('[data-testid="charge-amount"]').should('not.be.empty')
  })
})
```

### **Step 2: Run Test (Should Fail)**

```bash
npx cypress run --spec "cypress/e2e/resident-portal.cy.ts"
# Test will fail because feature doesn't exist yet
```

### **Step 3: Implement Minimal Code**

```typescript
// Implement the minimal code to make the test pass
const ResidentPortal = () => {
  return (
    <div data-testid="resident-charges">
      <div data-testid="charge-amount">$500</div>
    </div>
  )
}
```

### **Step 4: Run Test Again (Should Pass)**

```bash
npx cypress run --spec "cypress/e2e/resident-portal.cy.ts"
# Test should now pass
```

### **Step 5: Refactor**

```typescript
// Improve the code while keeping tests green
const ResidentPortal = () => {
  const [charges, setCharges] = useState([])
  
  useEffect(() => {
    // Fetch charges from API
    fetchCharges().then(setCharges)
  }, [])
  
  return (
    <div data-testid="resident-charges">
      {charges.map(charge => (
        <div key={charge.id} data-testid="charge-amount">
          ${charge.amount}
        </div>
      ))}
    </div>
  )
}
```

---

## 🧪 **Test Categories**

### **1. Baseline Tests (`baseline-tests.cy.ts`)**
- **Purpose**: Comprehensive feature testing
- **When to run**: Before major releases, after significant changes
- **Coverage**: All core functionality

```bash
# Run baseline tests
npx cypress run --spec "cypress/e2e/baseline-tests.cy.ts"
```

### **2. Regression Tests (`regression-pack.cy.ts`)**
- **Purpose**: Quick regression checking
- **When to run**: Before commits, during development
- **Coverage**: Critical paths only

```bash
# Run regression tests
npx cypress run --spec "cypress/e2e/regression-pack.cy.ts"
```

### **3. Feature-Specific Tests**
- **Purpose**: Test new features
- **When to run**: During feature development
- **Coverage**: Specific feature functionality

```bash
# Run specific feature tests
npx cypress run --spec "cypress/e2e/feature-name.cy.ts"
```

---

## 🔄 **Development Workflow**

### **Daily Development Cycle**

1. **Start with Tests**
   ```bash
   # Run regression tests to ensure clean state
   npx cypress run --spec "cypress/e2e/regression-pack.cy.ts"
   ```

2. **Write New Test**
   ```typescript
   // Add new test for feature you're working on
   it('should implement new feature', () => {
     // Test implementation
   })
   ```

3. **Implement Feature**
   ```typescript
   // Write minimal code to make test pass
   ```

4. **Run Tests**
   ```bash
   # Run specific test
   npx cypress run --spec "cypress/e2e/your-feature.cy.ts"
   ```

5. **Refactor**
   ```typescript
   // Improve code while keeping tests green
   ```

6. **Run Full Suite**
   ```bash
   # Run all tests to ensure no regressions
   npx cypress run
   ```

### **Before Committing**

```bash
# Run all tests
npx cypress run

# Run specific test suites
npx cypress run --spec "cypress/e2e/baseline-tests.cy.ts"
npx cypress run --spec "cypress/e2e/regression-pack.cy.ts"

# Check test coverage
npm run test:coverage
```

---

## 📊 **Test Data Management**

### **Test Data Setup**

```typescript
// Create test data fixtures
const testData = {
  buildings: [
    {
      name: 'Test Building',
      address: '123 Test Street',
      floors: 5,
      units: 20
    }
  ],
  users: [
    {
      email: 'manager@building.com',
      password: 'password123',
      role: 'Manager'
    }
  ],
  tickets: [
    {
      title: 'Test Maintenance Request',
      description: 'Test description',
      status: 'New'
    }
  ]
}
```

### **Database Seeding**

```bash
# Seed test database
npm run seed:test

# Reset test data
npm run reset:test
```

---

## 🚨 **Error Handling in Tests**

### **Network Error Testing**

```typescript
it('should handle network errors gracefully', () => {
  // Simulate network error
  cy.intercept('GET', '/api/tickets', { forceNetworkError: true })
  
  cy.get('[data-testid="nav-tickets"]').click()
  
  // Should show error message
  cy.get('[data-testid="error-message"]').should('be.visible')
  cy.get('[data-testid="retry-button"]').should('be.visible')
})
```

### **Server Error Testing**

```typescript
it('should handle server errors', () => {
  // Simulate server error
  cy.intercept('POST', '/api/tickets', { statusCode: 500 })
  
  cy.get('[data-testid="submit-ticket"]').click()
  
  // Should show error message
  cy.get('[data-testid="error-message"]').should('be.visible')
})
```

---

## 📈 **Performance Testing**

### **Load Time Testing**

```typescript
it('should load dashboard within 3 seconds', () => {
  const startTime = Date.now()
  
  cy.visit('/dashboard')
  cy.get('[data-testid="dashboard"]').should('be.visible')
  
  const loadTime = Date.now() - startTime
  expect(loadTime).to.be.lessThan(3000)
})
```

### **Memory Leak Testing**

```typescript
it('should not have memory leaks', () => {
  // Navigate multiple times
  for (let i = 0; i < 10; i++) {
    cy.get('[data-testid="nav-tickets"]').click()
    cy.get('[data-testid="nav-dashboard"]').click()
  }
  
  // Should not crash
  cy.get('[data-testid="error-message"]').should('not.exist')
})
```

---

## 🔍 **Debugging Tests**

### **Cypress Debug Commands**

```typescript
// Pause execution
cy.pause()

// Debug specific element
cy.get('[data-testid="element"]').debug()

// Log information
cy.log('Debug information')

// Take screenshot
cy.screenshot('debug-screenshot')
```

### **Test Isolation**

```typescript
// Clean up after each test
afterEach(() => {
  // Clear test data
  cy.clearLocalStorage()
  cy.clearCookies()
})
```

---

## 📋 **Test Reporting**

### **Generate Reports**

```bash
# Generate HTML report
npx cypress run --reporter mochawesome

# Generate JUnit report
npx cypress run --reporter mocha-junit-reporter

# Generate combined report
npx cypress run --reporter cypress-multi-reporters
```

### **View Reports**

```bash
# Open HTML report
open cypress/reports/mochawesome.html

# View test results
cat cypress/reports/results.xml
```

---

## 🎯 **Best Practices**

### **1. Test Organization**
- Group related tests together
- Use descriptive test names
- Keep tests independent
- Clean up test data

### **2. Test Data**
- Use fixtures for test data
- Avoid hardcoded values
- Reset data between tests
- Use realistic test scenarios

### **3. Test Maintenance**
- Update tests when features change
- Remove obsolete tests
- Keep tests simple and focused
- Document complex test scenarios

### **4. Performance**
- Run tests in parallel when possible
- Use efficient selectors
- Minimize test execution time
- Monitor test performance

---

## 🚀 **CI/CD Integration**

### **GitHub Actions Example**

```yaml
name: TDD Workflow
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm run start:ci &
      - run: npx cypress run --spec "cypress/e2e/regression-pack.cy.ts"
      - run: npx cypress run --spec "cypress/e2e/baseline-tests.cy.ts"
      
      - uses: actions/upload-artifact@v2
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

### **Pre-commit Hooks**

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx cypress run --spec 'cypress/e2e/regression-pack.cy.ts'"
    }
  }
}
```

---

## 📚 **Resources**

### **Documentation**
- [Cypress Documentation](https://docs.cypress.io/)
- [TDD Best Practices](https://www.agilealliance.org/glossary/tdd/)
- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

### **Tools**
- [Cypress Dashboard](https://dashboard.cypress.io/)
- [Mochawesome Reports](https://github.com/adamgruber/mochawesome)
- [Cypress Multi Reporters](https://github.com/you54f/cypress-multi-reporters)

---

## 🎉 **Success Metrics**

### **Test Coverage Goals**
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 90%+ coverage
- **E2E Tests**: Critical paths covered
- **Performance Tests**: All performance requirements met

### **Quality Metrics**
- **Test Reliability**: 95%+ pass rate
- **Test Execution Time**: < 10 minutes for full suite
- **Bug Detection**: 90%+ of bugs caught by tests
- **Regression Prevention**: 100% of regressions prevented

---

**Remember**: The goal of TDD is not just to write tests, but to write better code through the test-first approach. Let the tests guide your development and ensure quality at every step. 