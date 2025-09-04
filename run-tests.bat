@echo off
echo ========================================
echo Building Management System - Test Suite
echo ========================================
echo.

echo Starting test run...
echo Timestamp: %date% %time%
echo.

node test-runner.js

echo.
echo Test run completed!
echo Check test-results.json for detailed results
echo Check TEST_CASES.md for updated test log
echo.

pause 