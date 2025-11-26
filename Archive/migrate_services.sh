#!/bin/bash

# Services to migrate (top priority)
SERVICES=(
  "src/services/buildingService.ts"
  "src/services/workOrderService.ts"
  "src/services/residentAccountService.ts"
  "src/services/flatLedgerSyncService.ts"
  "src/services/flatLedgerService.ts"
  "src/services/budgetApprovalWorkflowService.ts"
  "src/services/budgetCompletionService.ts"
)

echo "🚀 Starting service migration..."
echo "================================"

for service in "${SERVICES[@]}"; do
  if [ ! -f "$service" ]; then
    echo "⚠️  Skipping $service (file not found)"
    continue
  fi
  
  echo "📝 Processing: $service"
  
  # Check if already migrated
  if grep -q "import.*fromFirestoreTimestamp" "$service"; then
    echo "   ✅ Already migrated, skipping"
    continue
  fi
  
  # Create backup
  cp "$service" "${service}.backup"
  
  # Count patterns before migration
  timestamp_count=$(grep -c "toDate()" "$service" 2>/dev/null || echo "0")
  error_count=$(grep -c "console.error" "$service" 2>/dev/null || echo "0")
  
  echo "   📊 Found: $timestamp_count timestamps, $error_count error handlers"
  echo "   ⏳ Migration will be done manually - backup created at ${service}.backup"
done

echo ""
echo "✨ Analysis complete!"
echo "================================"
echo "Next steps:"
echo "1. Review the backup files created"
echo "2. Apply migrations manually or use find-replace patterns"
echo "3. Test the changes"
echo ""
