import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  BudgetSetupWizard,
  BudgetSetupStep,
  BudgetYearRange,
  BudgetCategoryTemplate,
  BudgetYearAllocation,
  BudgetCategoryAllocation,
  BudgetSetupProgress
} from '../types'
import { budgetService } from './budgetService'
import { budgetWizardService } from './budgetWizardService'

// ===== MULTI-YEAR BUDGET OPERATIONS =====

/**
 * Calculate suggested budget allocation based on previous year
 */
export const calculateSuggestedAllocation = async (
  buildingId: string,
  targetYear: number,
  categoryTemplates: BudgetCategoryTemplate[]
): Promise<BudgetYearAllocation> => {
  try {
    const previousYear = targetYear - 1
    const previousBudget = await budgetService.getCurrentYearBudget(buildingId, previousYear)
    
    let adjustmentPercentage = 5 // Default 5% increase
    
    const categories: BudgetCategoryAllocation[] = categoryTemplates.map(template => {
      let allocatedAmount = template.defaultAmount || 5000 // Default amount
      
      // Use previous year data if available
      if (previousBudget) {
        const previousCategory = previousBudget.categories.find(cat => 
          cat.name.toLowerCase() === template.name.toLowerCase()
        )
        
        if (previousCategory) {
          allocatedAmount = previousCategory.budgetAmount * (1 + adjustmentPercentage / 100)
        }
      }
      
      // Apply year-specific amounts if configured
      if (template.yearSpecificAmounts && template.yearSpecificAmounts[targetYear]) {
        allocatedAmount = template.yearSpecificAmounts[targetYear]
      }
      
      return {
        categoryTemplateId: template.id,
        name: template.name,
        type: template.type,
        allocatedAmount: Math.round(allocatedAmount * 100) / 100,
        notes: template.description
      }
    })
    
    const totalBudgetAmount = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
    
    return {
      year: targetYear,
      totalBudgetAmount,
      categories,
      isLocked: false,
      basedOnPreviousYear: previousBudget ? previousYear : undefined,
      adjustmentPercentage: previousBudget ? adjustmentPercentage : undefined
    }
  } catch (error) {
    console.error('Error calculating suggested allocation:', error)
    throw error
  }
}

/**
 * Copy budget allocation from one year to another within wizard
 */
export const copyAllocationBetweenYears = async (
  wizardId: string,
  fromYear: number,
  toYear: number,
  adjustmentPercentage: number = 0
): Promise<void> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const sourceAllocation = wizard.yearlyAllocations[fromYear]
    if (!sourceAllocation) {
      throw new Error(`No allocation found for year ${fromYear}`)
    }

    // Create new allocation with adjustments
    const adjustedCategories = sourceAllocation.categories.map(cat => ({
      ...cat,
      allocatedAmount: Math.round(cat.allocatedAmount * (1 + adjustmentPercentage / 100) * 100) / 100
    }))

    const adjustedAllocation: BudgetYearAllocation = {
      year: toYear,
      totalBudgetAmount: Math.round(adjustedCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0) * 100) / 100,
      categories: adjustedCategories,
      notes: `Copied from ${fromYear} with ${adjustmentPercentage}% adjustment`,
      isLocked: false,
      basedOnPreviousYear: fromYear,
      adjustmentPercentage
    }

    const updatedAllocations = {
      ...wizard.yearlyAllocations,
      [toYear]: adjustedAllocation
    }

    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      yearlyAllocations: updatedAllocations
    })
  } catch (error) {
    console.error('Error copying allocation between years:', error)
    throw error
  }
}

/**
 * Bulk apply category changes across all years
 */
export const bulkApplyCategoryChanges = async (
  wizardId: string,
  categoryTemplateId: string,
  changes: Partial<BudgetCategoryAllocation>
): Promise<void> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const updatedAllocations = { ...wizard.yearlyAllocations }
    
    // Apply changes to all years
    for (const year of wizard.yearRange.years) {
      const allocation = updatedAllocations[year]
      if (allocation) {
        const categoryIndex = allocation.categories.findIndex(
          cat => cat.categoryTemplateId === categoryTemplateId
        )
        
        if (categoryIndex >= 0) {
          allocation.categories[categoryIndex] = {
            ...allocation.categories[categoryIndex],
            ...changes
          }
          
          // Recalculate total
          allocation.totalBudgetAmount = allocation.categories.reduce(
            (sum, cat) => sum + cat.allocatedAmount, 0
          )
        }
      }
    }

    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      yearlyAllocations: updatedAllocations
    })
  } catch (error) {
    console.error('Error bulk applying category changes:', error)
    throw error
  }
}

/**
 * Generate allocations for all years in wizard
 */
export const generateAllocationsForAllYears = async (
  wizardId: string
): Promise<Record<number, BudgetYearAllocation>> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const allocations: Record<number, BudgetYearAllocation> = {}
    
    for (const year of wizard.yearRange.years) {
      const allocation = await calculateSuggestedAllocation(
        wizard.buildingId,
        year,
        wizard.categoryTemplate
      )
      allocations[year] = allocation
    }

    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      yearlyAllocations: allocations,
      currentStep: BudgetSetupStep.REVIEW_AND_APPROVAL,
      lastStepCompletedAt: new Date()
    })

    return allocations
  } catch (error) {
    console.error('Error generating allocations for all years:', error)
    throw error
  }
}

/**
 * Get wizard progress information
 */
export const getWizardProgress = (wizard: BudgetSetupWizard): BudgetSetupProgress => {
  const stepOrder = [
    BudgetSetupStep.YEAR_RANGE_SELECTION,
    BudgetSetupStep.CATEGORY_CONFIGURATION,
    BudgetSetupStep.BUDGET_ALLOCATION,
    BudgetSetupStep.REVIEW_AND_APPROVAL,
    BudgetSetupStep.SETUP_COMPLETION
  ]
  
  const currentStepIndex = stepOrder.indexOf(wizard.currentStep)
  const stepsCompleted = stepOrder.slice(0, currentStepIndex)
  
  const progressPercentage = Math.round((currentStepIndex / stepOrder.length) * 100)
  const canProceedToNext = currentStepIndex < stepOrder.length - 1
  const canGoBack = currentStepIndex > 0
  
  const remainingSteps = stepOrder.length - currentStepIndex
  const estimatedTimeRemaining = remainingSteps > 0 
    ? `${remainingSteps * 5} minutes`
    : undefined
  
  return {
    wizardId: wizard.id,
    currentStep: wizard.currentStep,
    stepsCompleted,
    totalSteps: stepOrder.length,
    progressPercentage,
    canProceedToNext,
    canGoBack,
    estimatedTimeRemaining
  }
}

// Export service object
export const budgetYearRangeService = {
  calculateSuggestedAllocation,
  copyAllocationBetweenYears,
  bulkApplyCategoryChanges,
  generateAllocationsForAllYears,
  getWizardProgress
}
