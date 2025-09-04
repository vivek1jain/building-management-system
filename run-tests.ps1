# Building Management System - Test Suite Runner
# Run with: .\run-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Management System - Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting test run..." -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

try {
    node test-runner.js
    
    Write-Host ""
    Write-Host "Test run completed!" -ForegroundColor Green
    Write-Host "Check test-results.json for detailed results" -ForegroundColor Gray
    Write-Host "Check TEST_CASES.md for updated test log" -ForegroundColor Gray
} catch {
    Write-Host "Test runner failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Press Enter to continue" 