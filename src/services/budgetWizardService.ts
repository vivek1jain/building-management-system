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
  BudgetYearRange,
  BudgetCategoryTemplate,
  BudgetYearAllocation,
  BudgetCategoryAllocation,
  BudgetSetupProgress,
  BudgetYearRangeValidation,
  BudgetSetupSummary,
  Budget,
  BudgetCategoryItem,
  PaymentFrequency
} from '../types'
import { budgetService } from './budgetService'

// ===== BUDGET WIZARD MANAGEMENT =====

export const createBudgetSetupWizard = async (
  buildingId: string,
  createdBy: string
): Promise<string> => {
  try {
    const wizardData: Omit<BudgetSetupWizard, 'id' | 'createdAt' | 'updatedAt'> = {
      buildingId,
      currentStep: BudgetSetupStep.YEAR_RANGE_SELECTION,
      status: BudgetSetupStatus.IN_PROGRESS,
      yearRange: {
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 2,
        years: []
      },
      categoryTemplate: [],
      yearlyAllocations: {},
      approvalRequired: true,
      budgetsCreated: [],
      createdBy
    }

    const docRef = await addDoc(collection(db, 'budgetSetupWizards'), {
      ...wizardData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return docRef.id
  } catch (error) {
    console.error('Error creating budget setup wizard:', error)
    throw error
  }
}

export const getBudgetSetupWizard = async (wizardId: string): Promise<BudgetSetupWizard | null> => {
  try {
    const docRef = doc(db, 'budgetSetupWizards', wizardId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
      lastStepCompletedAt: data.lastStepCompletedAt?.toDate?.() || null,
      approvedAt: data.approvedAt?.toDate?.() || null,
      completedAt: data.completedAt?.toDate?.() || null,
      submittedAt: data.submittedAt?.toDate?.() || null,
      rejectedAt: data.rejectedAt?.toDate?.() || null,
      changeRequestedAt: data.changeRequestedAt?.toDate?.() || null,
      rolledBackAt: data.rolledBackAt?.toDate?.() || null,
      archivedAt: data.archivedAt?.toDate?.() || null
    } as BudgetSetupWizard
  } catch (error) {
    console.error('Error getting budget setup wizard:', error)
    throw error
  }
}

export const updateBudgetSetupWizard = async (
  wizardId: string,
  updates: Partial<BudgetSetupWizard>
): Promise<void> => {
  try {
    const docRef = doc(db, 'budgetSetupWizards', wizardId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating budget setup wizard:', error)
    throw error
  }
}

// ===== YEAR RANGE VALIDATION =====

export const validateYearRange = (yearRange: BudgetYearRange): BudgetYearRangeValidation => {
  const errors: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  
  const currentYear = new Date().getFullYear()
  
  if (yearRange.startYear < currentYear - 1) {
    errors.push('Start year cannot be more than 1 year in the past')
  }
  
  if (yearRange.endYear < yearRange.startYear) {
    errors.push('End year must be after start year')
  }
  
  if (yearRange.endYear - yearRange.startYear > 10) {
    errors.push('Year range cannot exceed 10 years')
  }
  
  if (yearRange.years.length === 0) {
    errors.push('At least one year must be selected')
  }
  
  if (yearRange.startYear < currentYear) {
    warnings.push('Creating budgets for past years - ensure this is intentional')
  }
  
  if (yearRange.years.length === 1) {
    recommendations.push('Consider planning for multiple years to improve financial forecasting')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  }
}

export const generateYearArray = (startYear: number, endYear: number): number[] => {
  const years: number[] = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  return years
}

// ===== DEFAULT CATEGORY TEMPLATES =====

export const getDefaultBudgetCategoryTemplates = (): BudgetCategoryTemplate[] => {
  return [
    {
      id: 'income-service-charges',
      name: 'Service Charges',
      type: 'income',
      category: 'other',
      description: 'Regular service charge income from residents',
      isRequired: true,
      applyToAllYears: true,
      frequency: 'quarterly' as PaymentFrequency
    },
    {
      id: 'exp-maintenance',
      name: 'Maintenance & Repairs',
      type: 'expenditure',
      category: 'maintenance',
      description: 'Ongoing maintenance and repair costs',
      isRequired: true,
      applyToAllYears: true,
      approvalThreshold: 1000
    },
    {
      id: 'exp-insurance',
      name: 'Insurance',
      type: 'expenditure',
      category: 'insurance',
      description: 'Building insurance premiums',
      isRequired: true,
      applyToAllYears: true,
      frequency: 'annually' as PaymentFrequency
    },
    {
      id: 'exp-utilities',
      name: 'Utilities',
      type: 'expenditure',
      category: 'utilities',
      description: 'Electricity, gas, water for common areas',
      isRequired: true,
      applyToAllYears: true
    },
    {
      id: 'exp-sinking-fund',
      name: 'Sinking Fund',
      type: 'expenditure',
      category: 'sinking',
      description: 'Reserve fund for major repairs and replacements',
      isRequired: true,
      applyToAllYears: true
    }
  ]
}

// ===== WIZARD COMPLETION =====

export const completeBudgetSetupWizard = async (
  wizardId: string,
  completedBy: string
): Promise<string[]> => {
  try {
    const wizard = await getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const budgetIds: string[] = []
    
    for (const year of wizard.yearRange.years) {
      const allocation = wizard.yearlyAllocations[year]
      if (!allocation) continue

      const budgetCategories: Omit<BudgetCategoryItem, 'id' | 'createdAt' | 'updatedAt'>[] = 
        allocation.categories.map(catAlloc => ({
          budgetId: '',
          name: catAlloc.name,
          type: catAlloc.type,
          budgetAmount: catAlloc.allocatedAmount,
          percentageOfTotal: (catAlloc.allocatedAmount / allocation.totalBudgetAmount) * 100, // Required property
          actualAmount: 0,
          allocatedAmount: catAlloc.allocatedAmount,
          spentAmount: 0,
          remainingAmount: catAlloc.allocatedAmount,
          notes: catAlloc.notes
        }))

      const budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
        buildingId: wizard.buildingId,
        year,
        status: 'approved',
        categories: [],
        totalBudgetAmount: allocation.totalBudgetAmount, // Required property
        totalAmount: allocation.totalBudgetAmount,
        allocatedAmount: allocation.totalBudgetAmount,
        spentAmount: 0,
        remainingAmount: allocation.totalBudgetAmount,
        approvedBy: wizard.approvedBy,
        approvedAt: wizard.approvedAt,
        createdBy: completedBy
      }

      const previousYear = year - 1
      const budgets = await budgetService.getBudgetsByBuilding(wizard.buildingId)
      const previousBudget = budgets.find(b => b.year === previousYear)
      const createdBudget = await budgetService.createBudget(budgetData)
      budgetIds.push(createdBudget.id)

      for (const categoryData of budgetCategories) {
        await budgetService.createBudgetCategory({
          ...categoryData,
          budgetId: createdBudget.id
        })
      }
    }

    await updateBudgetSetupWizard(wizardId, {
      status: BudgetSetupStatus.COMPLETED,
      completedAt: new Date(),
      budgetsCreated: budgetIds,
      currentStep: BudgetSetupStep.SETUP_COMPLETION
    })

    return budgetIds
  } catch (error) {
    console.error('Error completing budget setup wizard:', error)
    throw error
  }
}

// Export service object
export const budgetWizardService = {
  createBudgetSetupWizard,
  getBudgetSetupWizard,
  updateBudgetSetupWizard,
  validateYearRange,
  generateYearArray,
  getDefaultBudgetCategoryTemplates,
  completeBudgetSetupWizard
}
