#!/bin/bash

# Console Log Cleanup Script
# Helps identify and clean console.log statements

echo "🧹 Console Statement Cleanup Analysis"
echo "======================================"
echo ""

# Count by type
echo "📊 Current Console Statement Count:"
echo "-----------------------------------"
echo -n "console.log (TO REMOVE):   "
grep -r "console\.log" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "test.ts" | grep -v "/Testing/" | wc -l
echo -n "console.error (KEEP):      "
grep -r "console\.error" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "test.ts" | wc -l
echo -n "console.warn (KEEP):       "
grep -r "console\.warn" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "test.ts" | wc -l
echo ""

# Top offenders
echo "🎯 Top 10 Files with Most console.log:"
echo "--------------------------------------"
grep -r "console\.log" src --include="*.ts" --include="*.tsx" | \
  grep -v "node_modules" | grep -v "test.ts" | grep -v "/Testing/" | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -10
echo ""

# Migration files (can probably skip)
echo "⚠️  Migration Files (can skip cleanup):"
echo "--------------------------------------"
find src/migrations -name "*.ts" 2>/dev/null | wc -l | xargs echo "Found migration files:"
echo ""

# Recommendations
echo "💡 Cleanup Strategy:"
echo "-------------------"
echo "1. Skip migration files (one-time scripts)"
echo "2. Focus on services layer first (44+ logs in ticketService)"
echo "3. Clean component files"
echo "4. Keep console.error and console.warn"
echo ""

echo "✅ Ready to proceed with cleanup!"
