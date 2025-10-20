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
  BudgetSetupStatus,
  BudgetReviewSummary,
  BudgetValidationResult,
  BudgetYearAllocation
} from '../types'
import { budgetWizardService } from './budgetWizardService'

// ===== BUDGET REVIEW AND APPROVAL =====

/**
 * Generate comprehensive review summary for wizard
 */
export const generateReviewSummary = async (
  wizardId: string
): Promise<BudgetReviewSummary> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const yearSummaries = wizard.yearRange.years.map(year => {
      const allocation = wizard.yearlyAllocations[year]
      if (!allocation) {
        return {
          year,
          totalBudget: 0,
          incomeTotal: 0,
          expenditureTotal: 0,
          categoryCount: 0,
          isComplete: false
        }
      }

      const incomeCategories = allocation.categories.filter(cat => cat.type === 'income')
      const expenditureCategories = allocation.categories.filter(cat => cat.type === 'expenditure')
      
      const incomeTotal = incomeCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      const expenditureTotal = expenditureCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)

      return {
        year,
        totalBudget: allocation.totalBudgetAmount,
        incomeTotal,
        expenditureTotal,
        categoryCount: allocation.categories.length,
        isComplete: allocation.categories.length > 0
      }
    })

    const totalBudgetAcrossYears = yearSummaries.reduce((sum, year) => sum + year.totalBudget, 0)
    const totalIncomeAcrossYears = yearSummaries.reduce((sum, year) => sum + year.incomeTotal, 0)
    const totalExpenditureAcrossYears = yearSummaries.reduce((sum, year) => sum + year.expenditureTotal, 0)
    
    const averageYearlyBudget = totalBudgetAcrossYears / wizard.yearRange.years.length
    const netPositionAcrossYears = totalIncomeAcrossYears - totalExpenditureAcrossYears

    return {
      wizardId,
      yearRange: wizard.yearRange,
      yearSummaries,
      totalBudgetAcrossYears,
      totalIncomeAcrossYears,
      totalExpenditureAcrossYears,
      averageYearlyBudget,
      netPositionAcrossYears,
      categoryTemplateCount: wizard.categoryTemplate.length,
      isReadyForApproval: yearSummaries.every(year => year.isComplete),
      generatedAt: new Date()
    }
  } catch (error) {
    console.error('Error generating review summary:', error)
    throw error
  }
}

/**
 * Validate budget allocations across all years
 */
export const validateBudgetAllocations = async (
  wizardId: string
): Promise<BudgetValidationResult> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validate each year's allocation
    for (const year of wizard.yearRange.years) {
      const allocation = wizard.yearlyAllocations[year]
      
      if (!allocation) {
        errors.push(`Missing budget allocation for year ${year}`)
        continue
      }

      // Check for empty categories
      if (allocation.categories.length === 0) {
        errors.push(`No budget categories defined for year ${year}`)
      }

      // Check for zero amounts
      const zeroAmountCategories = allocation.categories.filter(cat => cat.allocatedAmount <= 0)
      if (zeroAmountCategories.length > 0) {
        warnings.push(`Year ${year} has ${zeroAmountCategories.length} categories with zero or negative amounts`)
      }

      // Check income vs expenditure balance
      const incomeTotal = allocation.categories
        .filter(cat => cat.type === 'income')
        .reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      
      const expenditureTotal = allocation.categories
        .filter(cat => cat.type === 'expenditure')
        .reduce((sum, cat) => sum + cat.allocatedAmount, 0)

      if (incomeTotal < expenditureTotal) {
        warnings.push(`Year ${year}: Expenditure (£${expenditureTotal.toLocaleString()}) exceeds income (£${incomeTotal.toLocaleString()})`)
      }

      // Check for very large year-over-year changes
      if (year > wizard.yearRange.startYear) {
        const previousAllocation = wizard.yearlyAllocations[year - 1]
        if (previousAllocation) {
          const changePercentage = ((allocation.totalBudgetAmount - previousAllocation.totalBudgetAmount) / previousAllocation.totalBudgetAmount) * 100
          
          if (Math.abs(changePercentage) > 25) {
            warnings.push(`Year ${year}: Budget changed by ${changePercentage.toFixed(1)}% from previous year`)
          }
        }
      }

      // Suggest sinking fund if not present
      const hasSinkingFund = allocation.categories.some(cat => 
        cat.name.toLowerCase().includes('sinking') || cat.name.toLowerCase().includes('reserve')
      )
      
      if (!hasSinkingFund && allocation.categories.some(cat => cat.type === 'expenditure')) {
        suggestions.push(`Year ${year}: Consider adding a sinking fund for major repairs and replacements`)
      }
    }

    // Cross-year validations
    const yearCount = wizard.yearRange.years.length
    if (yearCount > 5) {
      warnings.push(`Budget range spans ${yearCount} years - consider shorter ranges for better accuracy`)
    }

    const isValid = errors.length === 0
    const hasWarnings = warnings.length > 0
    const hasSuggestions = suggestions.length > 0

    return {
      wizardId,
      isValid,
      totalPercentage: 100, // Default placeholder for now
      hasWarnings,
      hasSuggestions,
      errors,
      warnings,
      suggestions,
      validatedAt: new Date()
    };
  } catch (error) {
    console.error('Error validating budget allocations:', error)
    throw error
  }
}

/**
 * Submit wizard for approval
 */
export const submitForApproval = async (
  wizardId: string,
  submittedBy: string,
  notes?: string
): Promise<void> => {
  try {
    const validation = await validateBudgetAllocations(wizardId)
    
    if (!validation.isValid) {
      throw new Error(`Cannot submit wizard with validation errors: ${validation.errors.join(', ')}`)
    }

    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      status: BudgetSetupStatus.PENDING_APPROVAL,
      currentStep: BudgetSetupStep.REVIEW_AND_APPROVAL,
      submittedBy,
      submittedAt: new Date(),
      submissionNotes: notes,
      validationResult: validation
    })
  } catch (error) {
    console.error('Error submitting wizard for approval:', error)
    throw error
  }
}

/**
 * Approve budget wizard
 */
export const approveBudgetWizard = async (
  wizardId: string,
  approvedBy: string,
  approvalNotes?: string
): Promise<void> => {
  try {
    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      status: BudgetSetupStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
      approvalNotes,
      currentStep: BudgetSetupStep.SETUP_COMPLETION
    })
  } catch (error) {
    console.error('Error approving budget wizard:', error)
    throw error
  }
}

/**
 * Reject budget wizard with feedback
 */
export const rejectBudgetWizard = async (
  wizardId: string,
  rejectedBy: string,
  rejectionReason: string,
  suggestedChanges?: string[]
): Promise<void> => {
  try {
    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      status: BudgetSetupStatus.REJECTED,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason,
      suggestedChanges,
      currentStep: BudgetSetupStep.BUDGET_ALLOCATION // Send back to allocation step
    })
  } catch (error) {
    console.error('Error rejecting budget wizard:', error)
    throw error
  }
}

/**
 * Request changes to budget wizard
 */
export const requestChanges = async (
  wizardId: string,
  requestedBy: string,
  changeRequests: string[],
  targetStep?: BudgetSetupStep
): Promise<void> => {
  try {
    await budgetWizardService.updateBudgetSetupWizard(wizardId, {
      status: BudgetSetupStatus.CHANGES_REQUESTED,
      changeRequestedBy: requestedBy,
      changeRequestedAt: new Date(),
      changeRequests,
      currentStep: targetStep || BudgetSetupStep.BUDGET_ALLOCATION
    })
  } catch (error) {
    console.error('Error requesting changes to wizard:', error)
    throw error
  }
}

/**
 * Get all wizards pending approval for a building
 */
export const getPendingApprovalWizards = async (
  buildingId: string
): Promise<BudgetSetupWizard[]> => {
  try {
    const wizardsRef = collection(db, 'budgetSetupWizards')
    const q = query(
      wizardsRef,
      where('buildingId', '==', buildingId),
      where('status', '==', BudgetSetupStatus.PENDING_APPROVAL),
      orderBy('submittedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BudgetSetupWizard[]
  } catch (error) {
    console.error('Error fetching pending approval wizards:', error)
    throw error
  }
}

/**
 * Calculate budget variance from previous year
 */
export const calculateBudgetVariance = (
  currentAllocation: BudgetYearAllocation,
  previousAllocation?: BudgetYearAllocation
): Record<string, { amount: number; percentage: number }> => {
  if (!previousAllocation) {
    return {}
  }

  const variances: Record<string, { amount: number; percentage: number }> = {}

  currentAllocation.categories.forEach(currentCat => {
    const previousCat = previousAllocation.categories.find(
      cat => cat.categoryTemplateId === currentCat.categoryTemplateId
    )

    if (previousCat) {
      const amountVariance = currentCat.allocatedAmount - previousCat.allocatedAmount
      const percentageVariance = previousCat.allocatedAmount > 0 
        ? (amountVariance / previousCat.allocatedAmount) * 100 
        : 0

      variances[currentCat.categoryTemplateId] = {
        amount: Math.round(amountVariance * 100) / 100,
        percentage: Math.round(percentageVariance * 100) / 100
      }
    }
  })

  return variances
}

// Export service object
export const budgetReviewService = {
  generateReviewSummary,
  validateBudgetAllocations,
  submitForApproval,
  approveBudgetWizard,
  rejectBudgetWizard,
  requestChanges,
  getPendingApprovalWizards,
  calculateBudgetVariance
}
