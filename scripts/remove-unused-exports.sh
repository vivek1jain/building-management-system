#!/bin/bash

# Remove unused exports from buildingService.ts
UNUSED_BUILDING_EXPORTS=(
  "getBuildingsByManager"
  "getBuildingById"
  "getAssetById"
  "getMeterById"
  "createMeter"
  "updateMeter"
  "deleteMeter"
  "searchBuildings"
)

echo "This script identifies which exports to remove."
echo "Review the list carefully before proceeding."
echo ""
echo "Files with most unused exports:"
echo "  - src/components/UI/index.ts (59)"
echo "  - src/types/index.ts (41)"  
echo "  - src/services/budgetWorkflow/index.ts (13)"
echo "  - src/services/invoiceService.ts (12)"
echo "  - src/services/peopleService.ts (11)"
echo ""
echo "WARNING: Automated removal is risky. Consider manual review."
