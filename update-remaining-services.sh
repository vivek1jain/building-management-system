#!/bin/bash

# Script to update all remaining service files with new error handling

# List of files still needing updates (based on grep)
FILES=(
  "src/services/authService.ts"
  "src/services/budgetCategoryMasterService.ts"
  "src/services/budgetReviewService.ts"
  "src/services/budgetValidationService.ts"
  "src/services/budgetWizardService.ts"
  "src/services/budgetYearRangeService.ts"
  "src/services/budgetApprovalWorkflowService.ts"
  "src/services/budgetCompletionService.ts"
  "src/services/creditApplicationService.ts"
  "src/services/emailService.ts"
  "src/services/expenseService.ts"
  "src/services/financialIntegrationService.ts"
  "src/services/flatLedgerService.ts"
  "src/services/flatLedgerSyncService.ts"
  "src/services/invitationService.ts"
  "src/services/quoteRequestService.ts"
  "src/services/residentAccountService.ts"
  "src/services/serviceChargeService.ts"
  "src/services/serviceChargeRateIntegrationService.ts"
  "src/services/ticketService.ts"
  "src/services/workOrderService.ts"
  "src/services/dataAccessService.ts"
)

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting systematic update of remaining service files...${NC}\n"

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ File not found: $file${NC}"
    continue
  fi
  
  echo -e "${YELLOW}Processing: $file${NC}"
  
  # 1. Check if file imports the old error handling
  if grep -q "handleServiceError" "$file" 2>/dev/null; then
    echo "  - Replacing old handleServiceError import..."
    sed -i.bak "s/import { handleServiceError } from '..\/utils\/errorHandling'/import { handleFirebaseError } from '..\/utils\/errorHandler'/g" "$file"
    sed -i.bak "s/from '..\/utils\/errorHandling'/from '..\/utils\/errorHandler'/g" "$file"
  fi
  
  # 2. Add import if missing and has console.error
  if grep -q "console.error" "$file" 2>/dev/null; then
    if ! grep -q "handleFirebaseError" "$file" 2>/dev/null; then
      echo "  - Adding handleFirebaseError import..."
      # Find the last import line and add after it
      awk '
        /^import.*from/ { lastImport=NR }
        { lines[NR]=$0 }
        END {
          for (i=1; i<=NR; i++) {
            print lines[i]
            if (i==lastImport && lines[i] !~ /errorHandler/) {
              print "import { handleFirebaseError, createAppError } from \"../utils/errorHandler\""
            }
          }
        }
      ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
  fi
  
  # 3. Replace catch blocks with console.error
  # This is a conservative replacement that preserves structure
  perl -i -pe '
    # Replace catch (error) with catch (error: any)
    s/catch \(error\)/catch (error: any)/g;
    
    # Replace common console.error + throw pattern
    s/console\.error\(['"'"'"].*?['"'"'"],\s*error\)\s*\n\s*throw\s+error/throw handleFirebaseError(error, { action: \"REPLACE_ACTION\" })/g;
  ' "$file" 2>/dev/null || true
  
  # Remove backup files
  rm -f "$file.bak"
  
  echo -e "${GREEN}  ✓ Updated $file${NC}\n"
done

echo -e "${GREEN}✓ All files processed!${NC}"
echo -e "${YELLOW}Note: You may need to manually fix 'REPLACE_ACTION' placeholders in catch blocks.${NC}"
echo -e "${YELLOW}Run 'npm run build' to check for any compilation errors.${NC}"
