import { BudgetCategoryItem, BudgetValidationResult } from '../types';

/**
 * Calculate percentage of total for a category amount
 */
export const calculatePercentage = (amount: number, total: number): number => {
  if (total === 0) return 0;
  return Number(((amount / total) * 100).toFixed(2));
};

/**
 * Calculate amount from percentage
 */
export const calculateAmountFromPercentage = (percentage: number, total: number): number => {
  return Number(((percentage / 100) * total).toFixed(2));
};

/**
 * Update category percentages based on amounts
 */
export const updateCategoryPercentages = (
  categories: BudgetCategoryItem[],
  totalBudget: number
): BudgetCategoryItem[] => {
  return categories.map(category => ({
    ...category,
    percentageOfTotal: calculatePercentage(category.budgetAmount, totalBudget)
  }));
};

/**
 * Update category amounts based on percentages
 */
export const updateCategoryAmounts = (
  categories: BudgetCategoryItem[],
  totalBudget: number
): BudgetCategoryItem[] => {
  return categories.map(category => ({
    ...category,
    budgetAmount: calculateAmountFromPercentage(category.percentageOfTotal, totalBudget)
  }));
};

/**
 * Validate budget categories and percentages with comprehensive checks
 */
export const validateBudget = (
  categories: BudgetCategoryItem[],
  totalBudget: number,
  previousYearBudget?: number,
  buildingType?: string
): BudgetValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Calculate total percentage
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
  const roundedTotal = Number(totalPercentage.toFixed(2));
  
  // Basic validation checks
  if (categories.length === 0) {
    errors.push('At least one category is required');
  }
  
  if (totalBudget <= 0) {
    errors.push('Total budget must be greater than zero');
  }
  
  // Category-specific validations
  categories.forEach(category => {
    // Negative values
    if (category.budgetAmount < 0) {
      errors.push(`Category "${category.name}" cannot have a negative amount`);
    }
    if (category.percentageOfTotal < 0) {
      errors.push(`Category "${category.name}" cannot have a negative percentage`);
    }
    
    // Empty names
    if (!category.name || category.name.trim() === '') {
      errors.push('All categories must have a name');
    }
    
    // Zero amounts with non-zero percentages (inconsistency)
    if (category.budgetAmount === 0 && category.percentageOfTotal > 0) {
      warnings.push(`Category "${category.name}" has 0 amount but ${category.percentageOfTotal}% allocation`);
    }
    
    // Very small amounts that might be data entry errors
    if (category.budgetAmount > 0 && category.budgetAmount < 10) {
      warnings.push(`Category "${category.name}" has a very small amount (£${category.budgetAmount})`);
    }
  });
  
  // Percentage validation
  if (roundedTotal !== 100) {
    if (Math.abs(100 - roundedTotal) < 0.01) {
      warnings.push(`Total percentage is ${roundedTotal}% (minor rounding difference)`);
    } else if (roundedTotal > 100) {
      errors.push(`Total percentage exceeds 100% (currently ${roundedTotal}%)`);
    } else {
      errors.push(`Total percentage is under 100% (currently ${roundedTotal}%)`);
    }
  }
  
  // Duplicate names
  const categoryNames = categories.map(cat => cat.name.toLowerCase().trim());
  const duplicates = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate category names found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  // Advanced warnings and suggestions
  categories.forEach(category => {
    // Very small percentages
    if (category.percentageOfTotal > 0 && category.percentageOfTotal < 0.5) {
      warnings.push(`Category "${category.name}" has a very small allocation (${category.percentageOfTotal}%)`);
    }
    
    // Dominant categories
    if (category.percentageOfTotal > 60) {
      warnings.push(`Category "${category.name}" dominates the budget at ${category.percentageOfTotal}%`);
      suggestions.push(`Consider breaking down "${category.name}" into sub-categories for better tracking`);
    }
    
    // Large round numbers (might indicate estimates rather than calculated amounts)
    if (category.budgetAmount > 0 && category.budgetAmount % 1000 === 0 && category.budgetAmount >= 10000) {
      suggestions.push(`Category "${category.name}" uses a round number (£${category.budgetAmount}) - consider more precise budgeting`);
    }
  });
  
  // Year-over-year comparison warnings
  if (previousYearBudget && previousYearBudget > 0) {
    const budgetChange = ((totalBudget - previousYearBudget) / previousYearBudget) * 100;
    
    if (Math.abs(budgetChange) > 20) {
      if (budgetChange > 0) {
        warnings.push(`Total budget increased by ${budgetChange.toFixed(1)}% from previous year`);
        suggestions.push('Significant budget increase - ensure adequate justification is documented');
      } else {
        warnings.push(`Total budget decreased by ${Math.abs(budgetChange).toFixed(1)}% from previous year`);
        suggestions.push('Significant budget decrease - verify all necessary expenses are included');
      }
    }
    
    if (Math.abs(budgetChange) > 50) {
      errors.push(`Budget change of ${budgetChange > 0 ? '+' : ''}${budgetChange.toFixed(1)}% is exceptionally large - please review`);
    }
  }
  
  // Building type specific suggestions
  if (buildingType === 'residential') {
    const maintenanceCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('maintenance') || 
      cat.name.toLowerCase().includes('repair')
    );
    const totalMaintenancePercent = maintenanceCategories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
    
    if (totalMaintenancePercent < 15) {
      suggestions.push('Consider allocating 15-25% of budget to maintenance and repairs for residential buildings');
    } else if (totalMaintenancePercent > 40) {
      warnings.push(`Maintenance allocation (${totalMaintenancePercent.toFixed(1)}%) seems very high - review necessity`);
    }
    
    // Insurance check
    const insuranceCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('insurance')
    );
    if (insuranceCategories.length === 0) {
      warnings.push('No insurance category found - ensure insurance costs are budgeted');
    }
    
    // Reserve fund check
    const reserveCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('reserve') || 
      cat.name.toLowerCase().includes('contingency')
    );
    const totalReservePercent = reserveCategories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
    
    if (totalReservePercent < 5) {
      suggestions.push('Consider allocating 5-10% to reserves/contingency for unexpected expenses');
    }
  }
  
  // Category count warnings
  if (categories.length > 20) {
    warnings.push(`Many categories (${categories.length}) - consider consolidating similar items for easier management`);
  } else if (categories.length < 5 && totalBudget > 50000) {
    suggestions.push('Consider more detailed categorization for better budget tracking and control');
  }
  
  // Check for common missing categories
  const categoryNamesLower = categoryNames.map(name => name.toLowerCase());
  const commonCategories = ['insurance', 'maintenance', 'utilities', 'management', 'cleaning'];
  const missingCommon = commonCategories.filter(common => 
    !categoryNamesLower.some(name => name.includes(common))
  );
  
  if (missingCommon.length > 0 && totalBudget > 20000) {
    suggestions.push(`Consider adding categories for: ${missingCommon.join(', ')}`);
  }
  
  return {
    wizardId: '', // Will be set by calling service
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    hasSuggestions: suggestions.length > 0,
    totalPercentage: roundedTotal,
    errors,
    warnings,
    suggestions,
    validatedAt: new Date()
  };
};

/**
 * Auto-adjust percentages to total exactly 100%
 */
export const autoAdjustPercentages = (
  categories: BudgetCategoryItem[]
): BudgetCategoryItem[] => {
  if (categories.length === 0) return categories;
  
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
  
  if (totalPercentage === 0) return categories;
  
  // Proportionally adjust all percentages to total 100%
  const adjustmentFactor = 100 / totalPercentage;
  
  let adjustedCategories = categories.map(category => ({
    ...category,
    percentageOfTotal: Number((category.percentageOfTotal * adjustmentFactor).toFixed(2))
  }));
  
  // Handle rounding errors by adjusting the largest category
  const adjustedTotal = adjustedCategories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
  const roundingDifference = Number((100 - adjustedTotal).toFixed(2));
  
  if (Math.abs(roundingDifference) > 0) {
    // Find the largest category to absorb the rounding difference
    const largestCategoryIndex = adjustedCategories.reduce((maxIndex, category, index) => 
      category.percentageOfTotal > adjustedCategories[maxIndex].percentageOfTotal ? index : maxIndex
    , 0);
    
    adjustedCategories[largestCategoryIndex].percentageOfTotal = Number(
      (adjustedCategories[largestCategoryIndex].percentageOfTotal + roundingDifference).toFixed(2)
    );
  }
  
  return adjustedCategories;
};

/**
 * Calculate rate per square foot
 */
export const calculateRatePerSqFt = (totalBudget: number, totalSqFt: number): number => {
  if (totalSqFt === 0) return 0;
  return Number((totalBudget / totalSqFt).toFixed(2));
};

/**
 * Calculate percentage change between two rates
 */
export const calculateRateChange = (newRate: number, previousRate: number): number => {
  if (previousRate === 0) return 0;
  return Number((((newRate - previousRate) / previousRate) * 100).toFixed(2));
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

/**
 * Validate service charge rate changes
 */
export const validateRateChange = (
  newRate: number,
  previousRate: number,
  buildingType: string = 'residential'
): { isValid: boolean; warnings: string[]; suggestions: string[] } => {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (previousRate <= 0) {
    suggestions.push('No previous rate data available for comparison');
    return { isValid: true, warnings, suggestions };
  }
  
  const changePercent = calculateRateChange(newRate, previousRate);
  const changeAmount = newRate - previousRate;
  
  // Significant rate increases
  if (changePercent > 10) {
    warnings.push(`Service charge rate increased by ${changePercent}% (£${changeAmount.toFixed(2)}/sq ft)`);
    if (changePercent > 25) {
      warnings.push('Large rate increase may require resident consultation');
      suggestions.push('Prepare detailed justification for significant rate increase');
    }
  }
  
  // Significant rate decreases
  if (changePercent < -10) {
    warnings.push(`Service charge rate decreased by ${Math.abs(changePercent)}% (£${Math.abs(changeAmount).toFixed(2)}/sq ft)`);
    suggestions.push('Verify that all necessary expenses are included in the budget');
  }
  
  // Rate benchmarking suggestions
  const typicalRanges = {
    residential: { min: 2.00, max: 8.00 },
    commercial: { min: 3.00, max: 12.00 },
    mixed: { min: 2.50, max: 10.00 }
  };
  
  const range = typicalRanges[buildingType as keyof typeof typicalRanges] || typicalRanges.residential;
  
  if (newRate < range.min) {
    warnings.push(`Rate (£${newRate.toFixed(2)}/sq ft) is below typical range for ${buildingType} buildings`);
    suggestions.push('Consider if all necessary services and reserves are adequately budgeted');
  } else if (newRate > range.max) {
    warnings.push(`Rate (£${newRate.toFixed(2)}/sq ft) is above typical range for ${buildingType} buildings`);
    suggestions.push('Review budget for potential cost optimizations or justify premium services');
  }
  
  return { isValid: true, warnings, suggestions };
};

/**
 * Analyze budget health and financial sustainability
 */
export const analyzeBudgetHealth = (
  categories: BudgetCategoryItem[],
  totalBudget: number,
  buildingAge?: number,
  unitCount?: number
): { health: 'excellent' | 'good' | 'fair' | 'poor'; warnings: string[]; suggestions: string[] } => {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let healthScore = 100;
  
  // Calculate category percentages
  const categoryMap = new Map<string, number>();
  categories.forEach(cat => {
    const key = cat.name.toLowerCase();
    categoryMap.set(key, cat.percentageOfTotal);
  });
  
  // Check reserve fund allocation
  const reservePercent = categories
    .filter(cat => cat.name.toLowerCase().includes('reserve') || cat.name.toLowerCase().includes('contingency'))
    .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
  
  if (reservePercent < 5) {
    healthScore -= 15;
    warnings.push('Insufficient reserve fund allocation (recommended: 5-15%)');
    suggestions.push('Increase contingency reserves for unexpected expenses');
  } else if (reservePercent > 25) {
    healthScore -= 5;
    warnings.push('Very high reserve allocation - consider if funds could be better utilized');
  }
  
  // Check maintenance allocation
  const maintenancePercent = categories
    .filter(cat => 
      cat.name.toLowerCase().includes('maintenance') ||
      cat.name.toLowerCase().includes('repair') ||
      cat.name.toLowerCase().includes('upkeep')
    )
    .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
  
  const expectedMaintenancePercent = buildingAge ? Math.min(30, 15 + (buildingAge - 10) * 0.5) : 20;
  
  if (maintenancePercent < expectedMaintenancePercent * 0.7) {
    healthScore -= 10;
    warnings.push(`Low maintenance allocation (${maintenancePercent.toFixed(1)}%) for building age`);
    suggestions.push(`Consider ${expectedMaintenancePercent.toFixed(1)}% allocation for maintenance`);
  }
  
  // Check insurance allocation
  const insurancePercent = categories
    .filter(cat => cat.name.toLowerCase().includes('insurance'))
    .reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
  
  if (insurancePercent === 0) {
    healthScore -= 20;
    warnings.push('No insurance allocation found');
    suggestions.push('Ensure adequate insurance coverage is budgeted');
  } else if (insurancePercent < 2) {
    healthScore -= 5;
    warnings.push('Low insurance allocation - verify coverage adequacy');
  }
  
  // Check for over-concentration in any single category
  const maxCategoryPercent = Math.max(...categories.map(cat => cat.percentageOfTotal));
  if (maxCategoryPercent > 70) {
    healthScore -= 10;
    warnings.push('Budget heavily concentrated in one category');
    suggestions.push('Consider breaking down large categories for better control');
  }
  
  // Per-unit budget analysis
  if (unitCount && unitCount > 0) {
    const budgetPerUnit = totalBudget / unitCount;
    
    if (budgetPerUnit < 1000) {
      warnings.push(`Low per-unit budget (£${budgetPerUnit.toFixed(0)}) - verify adequacy`);
    } else if (budgetPerUnit > 5000) {
      warnings.push(`High per-unit budget (£${budgetPerUnit.toFixed(0)}) - review cost efficiency`);
    }
  }
  
  // Determine health rating
  let health: 'excellent' | 'good' | 'fair' | 'poor';
  if (healthScore >= 90) health = 'excellent';
  else if (healthScore >= 75) health = 'good';
  else if (healthScore >= 60) health = 'fair';
  else health = 'poor';
  
  return { health, warnings, suggestions };
};

/**
 * Validate category distribution and suggest optimizations
 */
export const validateCategoryDistribution = (
  categories: BudgetCategoryItem[],
  buildingType: string = 'residential'
): { warnings: string[]; suggestions: string[] } => {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Define expected ranges for different building types
  const expectedRanges = {
    residential: {
      maintenance: { min: 15, max: 35 },
      insurance: { min: 2, max: 8 },
      utilities: { min: 5, max: 20 },
      management: { min: 5, max: 15 },
      reserves: { min: 5, max: 15 }
    },
    commercial: {
      maintenance: { min: 20, max: 40 },
      insurance: { min: 3, max: 10 },
      utilities: { min: 10, max: 30 },
      management: { min: 8, max: 20 },
      reserves: { min: 5, max: 12 }
    }
  };
  
  const ranges = expectedRanges[buildingType as keyof typeof expectedRanges] || expectedRanges.residential;
  
  // Check each category type
  Object.entries(ranges).forEach(([categoryType, range]) => {
    const matchingCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes(categoryType) ||
      (categoryType === 'reserves' && (cat.name.toLowerCase().includes('reserve') || cat.name.toLowerCase().includes('contingency')))
    );
    
    const totalPercent = matchingCategories.reduce((sum, cat) => sum + cat.percentageOfTotal, 0);
    
    if (totalPercent < range.min) {
      warnings.push(`${categoryType} allocation (${totalPercent.toFixed(1)}%) below recommended range (${range.min}-${range.max}%)`);
    } else if (totalPercent > range.max) {
      warnings.push(`${categoryType} allocation (${totalPercent.toFixed(1)}%) above typical range (${range.min}-${range.max}%)`);
    }
  });
  
  // Check for missing essential categories
  const essentialCategories = ['maintenance', 'insurance', 'management'];
  essentialCategories.forEach(essential => {
    const hasCategory = categories.some(cat => 
      cat.name.toLowerCase().includes(essential)
    );
    
    if (!hasCategory) {
      warnings.push(`No ${essential} category found`);
      suggestions.push(`Add ${essential} category to ensure comprehensive budgeting`);
    }
  });
  
  return { warnings, suggestions };
};

export default {
  calculatePercentage,
  calculateAmountFromPercentage,
  updateCategoryPercentages,
  updateCategoryAmounts,
  validateBudget,
  validateRateChange,
  analyzeBudgetHealth,
  validateCategoryDistribution,
  autoAdjustPercentages,
  calculateRatePerSqFt,
  calculateRateChange,
  formatCurrency,
  formatPercentage
};
