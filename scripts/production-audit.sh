#!/bin/bash

# Production Readiness Audit Script
# Run this to identify all issues before deploying to production

echo "🔍 Starting Production Readiness Audit..."
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript Errors
echo -e "${YELLOW}1. Checking TypeScript compilation...${NC}"
npx tsc --noEmit > /tmp/tsc-errors.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
else
    echo -e "${RED}✗ TypeScript errors found:${NC}"
    cat /tmp/tsc-errors.txt | head -20
    echo ""
    echo "See full output in /tmp/tsc-errors.txt"
fi
echo ""

# 2. Unused imports
echo -e "${YELLOW}2. Checking for unused code...${NC}"
echo "Searching for potentially unused imports..."
npx eslint src --ext .ts,.tsx --no-error-on-unmatched-pattern --quiet 2>/dev/null | grep -i "unused" | wc -l | xargs echo "Found unused warnings:"
echo ""

# 3. Console statements
echo -e "${YELLOW}3. Checking for console statements...${NC}"
echo "Console.log statements (should be removed):"
grep -r "console.log" src --include="*.ts" --include="*.tsx" | wc -l
echo ""
echo "Console.error statements (OK to keep):"
grep -r "console.error" src --include="*.ts" --include="*.tsx" | wc -l
echo ""

# 4. TODO comments
echo -e "${YELLOW}4. Checking for TODO comments...${NC}"
grep -r "TODO" src --include="*.ts" --include="*.tsx" | wc -l | xargs echo "TODO comments found:"
echo ""

# 5. Mock data
echo -e "${YELLOW}5. Checking for mock data...${NC}"
grep -r "mock\|Mock\|MOCK\|sample\|Sample" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l | xargs echo "Potential mock data references:"
echo ""

# 6. Environment variables
echo -e "${YELLOW}6. Checking environment configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${RED}✗ .env file exists (should not be committed)${NC}"
else
    echo -e "${GREEN}✓ No .env file in repository${NC}"
fi

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example exists${NC}"
else
    echo -e "${YELLOW}! .env.example not found (should exist)${NC}"
fi
echo ""

# 7. Hardcoded credentials
echo -e "${YELLOW}7. Checking for hardcoded credentials...${NC}"
grep -r "apiKey\|api_key\|password\|secret" src --include="*.ts" --include="*.tsx" | grep -v "// " | grep -v "type\|interface\|import" | wc -l | xargs echo "Potential hardcoded credentials:"
echo ""

# 8. Firestore security rules
echo -e "${YELLOW}8. Checking Firestore rules...${NC}"
if [ -f "firestore.rules" ]; then
    echo -e "${GREEN}✓ firestore.rules exists${NC}"
    echo "Rules allowing delete operations:"
    grep -c "allow delete" firestore.rules
    echo "Rules with 'true' (overly permissive):"
    grep -c "if true" firestore.rules
else
    echo -e "${RED}✗ firestore.rules not found${NC}"
fi
echo ""

# 9. Package vulnerabilities
echo -e "${YELLOW}9. Checking for package vulnerabilities...${NC}"
npm audit --audit-level=high 2>&1 | grep -E "vulnerabilities|found" | head -5
echo ""

# 10. Build test
echo -e "${YELLOW}10. Testing production build...${NC}"
npm run build > /tmp/build-output.txt 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    tail -20 /tmp/build-output.txt
fi
echo ""

echo "=========================================="
echo -e "${GREEN}Audit complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review /tmp/tsc-errors.txt for TypeScript errors"
echo "2. Review /tmp/build-output.txt for build issues"
echo "3. Check PRODUCTION_READINESS.md for detailed action items"
echo "4. Run 'npm audit fix' to fix package vulnerabilities"
echo ""
