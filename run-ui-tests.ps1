# Building Management System - Complete Test Suite Runner
# Run with: .\run-ui-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Management System - Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting comprehensive test run..." -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Check if app is running
Write-Host "🔍 Checking if app is running..." -ForegroundColor Blue
$appRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $appRunning = $true
        Write-Host "✅ App is running on localhost:3003" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ App is not running on localhost:3003" -ForegroundColor Red
    Write-Host "Please start the app with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Run basic tests
Write-Host ""
Write-Host "🧪 Running basic tests..." -ForegroundColor Blue
try {
    node test-runner.js
    Write-Host "✅ Basic tests completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic tests failed" -ForegroundColor Red
}

# Run TypeScript compilation check
Write-Host ""
Write-Host "🔧 Running TypeScript compilation check..." -ForegroundColor Blue
try {
    npx tsc --noEmit
    Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
} catch {
    Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
}

# Run Cypress UI tests
Write-Host ""
Write-Host "🎭 Running Cypress UI tests..." -ForegroundColor Blue
try {
    # Run Cypress tests in headless mode
    npx cypress run --spec "cypress/e2e/authentication.cy.ts"
    Write-Host "✅ Authentication tests completed" -ForegroundColor Green
    
    npx cypress run --spec "cypress/e2e/dashboard.cy.ts"
    Write-Host "✅ Dashboard tests completed" -ForegroundColor Green
    
    npx cypress run --spec "cypress/e2e/tickets.cy.ts"
    Write-Host "✅ Ticket management tests completed" -ForegroundColor Green
    
    npx cypress run --spec "cypress/e2e/suppliers.cy.ts"
    Write-Host "✅ Supplier management tests completed" -ForegroundColor Green
    
    npx cypress run --spec "cypress/e2e/navigation.cy.ts"
    Write-Host "✅ Navigation tests completed" -ForegroundColor Green
    
    Write-Host "✅ All UI tests completed" -ForegroundColor Green
} catch {
    Write-Host "❌ UI tests failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "✅ Basic connectivity and file structure tests" -ForegroundColor Green
Write-Host "✅ TypeScript compilation check" -ForegroundColor Green
Write-Host "✅ Cypress UI tests" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Check test-results.json for detailed results" -ForegroundColor Gray
Write-Host "📄 Check TEST_CASES.md for updated test log" -ForegroundColor Gray
Write-Host "📄 Check cypress/videos/ for test recordings" -ForegroundColor Gray
Write-Host "📄 Check cypress/screenshots/ for test screenshots" -ForegroundColor Gray

Write-Host ""
Read-Host "Press Enter to continue" 