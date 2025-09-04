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
  Budget,
  BudgetCategoryItem,
  BudgetCompletionSummary,
  BudgetSetupProgress
} from '../types'
import { budgetWizardService } from './budgetWizardService'
import { budgetService } from './budgetService'
import { budgetReviewService } from './budgetReviewService'

// ===== BUDGET SETUP COMPLETION =====

/**
 * Complete the budget setup wizard and create actual budgets
 */
export const completeBudgetSetup = async (
  wizardId: string,
  completedBy: string
): Promise<BudgetCompletionSummary> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    if (wizard.status !== BudgetSetupStatus.APPROVED) {
      throw new Error('Wizard must be approved before completion')
    }

    const batch = writeBatch(db)
    const createdBudgets: Budget[] = []
    const createdCategories: Record<number, BudgetCategoryItem[]> = {}

    // Create budgets for each year
    for (const year of wizard.yearRange.years) {
      const allocation = wizard.yearlyAllocations[year]
      if (!allocation) {
        throw new Error(`Missing allocation for year ${year}`)
      }

      // Create budget document
      const budget: Omit<Budget, 'id'> = {
        buildingId: wizard.buildingId,
        year,
        status: 'approved', // Auto-approve wizard-created budgets
        categories: [], // Will be populated after category creation
        totalAmount: allocation.totalBudgetAmount,
        allocatedAmount: allocation.totalBudgetAmount,
        spentAmount: 0,
        remainingAmount: allocation.totalBudgetAmount,
        createdBy: completedBy,
        approvedBy: completedBy,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const budgetRef = doc(collection(db, 'budgets'))
      batch.set(budgetRef, {
        ...budget,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      })

      const budgetWithId = { ...budget, id: budgetRef.id }
      createdBudgets.push(budgetWithId)

      // Create budget categories
      const categories: BudgetCategoryItem[] = []
      
      for (const categoryAllocation of allocation.categories) {
        const category: Omit<BudgetCategoryItem, 'id'> = {
          budgetId: budgetRef.id,
          name: categoryAllocation.name,
          type: categoryAllocation.type,
          budgetAmount: categoryAllocation.allocatedAmount,
          actualAmount: 0,
          allocatedAmount: categoryAllocation.allocatedAmount,
          spentAmount: 0,
          remainingAmount: categoryAllocation.allocatedAmount,
          notes: categoryAllocation.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const categoryRef = doc(collection(db, 'budgetCategories'))
        batch.set(categoryRef, {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        const categoryWithId = { ...category, id: categoryRef.id }
        categories.push(categoryWithId)
      }

      createdCategories[year] = categories
      
      // Update budget with category references
      batch.update(budgetRef, {
        categories: categories.map(cat => cat.id)
      })
    }

    // Update wizard status to completed
    const wizardRef = doc(db, 'budgetSetupWizards', wizardId)
    batch.update(wizardRef, {
      status: BudgetSetupStatus.COMPLETED,
      currentStep: BudgetSetupStep.SETUP_COMPLETION,
      completedBy,
      completedAt: serverTimestamp(),
      createdBudgetIds: createdBudgets.map(b => b.id)
    })

    // Commit all changes
    await batch.commit()

    // Generate completion summary
    const summary = await generateCompletionSummary(wizardId, createdBudgets, createdCategories)
    
    return summary
  } catch (error) {
    console.error('Error completing budget setup:', error)
    throw error
  }
}

/**
 * Generate completion summary
 */
export const generateCompletionSummary = async (
  wizardId: string,
  createdBudgets: Budget[],
  createdCategories: Record<number, BudgetCategoryItem[]>
): Promise<BudgetCompletionSummary> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const totalBudgetAmount = createdBudgets.reduce((sum, budget) => sum + budget.totalAmount, 0)
    const totalCategories = Object.values(createdCategories).reduce((sum, cats) => sum + cats.length, 0)
    
    const incomeTotal = Object.values(createdCategories)
      .flat()
      .filter(cat => cat.type === 'income')
      .reduce((sum, cat) => sum + cat.budgetAmount, 0)
    
    const expenditureTotal = Object.values(createdCategories)
      .flat()
      .filter(cat => cat.type === 'expenditure')
      .reduce((sum, cat) => sum + cat.budgetAmount, 0)

    const yearSummaries = createdBudgets.map(budget => ({
      year: budget.year,
      budgetId: budget.id,
      totalAmount: budget.totalAmount,
      categoryCount: createdCategories[budget.year]?.length || 0,
      incomeAmount: createdCategories[budget.year]
        ?.filter(cat => cat.type === 'income')
        .reduce((sum, cat) => sum + cat.budgetAmount, 0) || 0,
      expenditureAmount: createdCategories[budget.year]
        ?.filter(cat => cat.type === 'expenditure')
        .reduce((sum, cat) => sum + cat.budgetAmount, 0) || 0
    }))

    return {
      wizardId,
      buildingId: wizard.buildingId,
      yearRange: wizard.yearRange,
      createdBudgets: createdBudgets.map(b => ({
        id: b.id,
        year: b.year,
        name: `${b.year} Budget`,
        totalAmount: b.totalAmount
      })),
      yearSummaries,
      totalBudgetAmount,
      totalCategories,
      incomeTotal,
      expenditureTotal,
      netPosition: incomeTotal - expenditureTotal,
      completedAt: new Date(),
      completedBy: wizard.completedBy || completedBy,
      setupDuration: wizard.completedAt && wizard.createdAt 
        ? Math.round((wizard.completedAt.getTime() - wizard.createdAt.getTime()) / (1000 * 60)) // minutes
        : undefined
    }
  } catch (error) {
    console.error('Error generating completion summary:', error)
    throw error
  }
}

/**
 * Get completion status for a wizard
 */
export const getCompletionStatus = async (wizardId: string): Promise<{
  isCompleted: boolean
  completionSummary?: BudgetCompletionSummary
  createdBudgets?: Budget[]
}> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    const isCompleted = wizard.status === BudgetSetupStatus.COMPLETED

    if (!isCompleted) {
      return { isCompleted: false }
    }

    // Fetch created budgets
    const createdBudgets: Budget[] = []
    if (wizard.createdBudgetIds) {
      for (const budgetId of wizard.createdBudgetIds) {
        try {
          const budget = await budgetService.getBudget(budgetId)
          if (budget) {
            createdBudgets.push(budget)
          }
        } catch (error) {
          console.warn(`Could not fetch budget ${budgetId}:`, error)
        }
      }
    }

    // Generate categories map for summary
    const createdCategories: Record<number, BudgetCategoryItem[]> = {}
    for (const budget of createdBudgets) {
      try {
        const categories = await budgetService.getBudgetCategories(budget.id)
        createdCategories[budget.year] = categories
      } catch (error) {
        console.warn(`Could not fetch categories for budget ${budget.id}:`, error)
        createdCategories[budget.year] = []
      }
    }

    const completionSummary = await generateCompletionSummary(wizardId, createdBudgets, createdCategories)

    return {
      isCompleted: true,
      completionSummary,
      createdBudgets
    }
  } catch (error) {
    console.error('Error getting completion status:', error)
    throw error
  }
}

/**
 * Rollback completed wizard (delete created budgets)
 */
export const rollbackCompletedWizard = async (
  wizardId: string,
  rollbackBy: string,
  reason: string
): Promise<void> => {
  try {
    const wizard = await budgetWizardService.getBudgetSetupWizard(wizardId)
    if (!wizard) {
      throw new Error('Wizard not found')
    }

    if (wizard.status !== BudgetSetupStatus.COMPLETED) {
      throw new Error('Can only rollback completed wizards')
    }

    const batch = writeBatch(db)

    // Delete created budgets and their categories
    if (wizard.budgetsCreated) {
      for (const budgetId of wizard.budgetsCreated) {
        // Delete budget categories
        const categoriesRef = collection(db, 'budgetCategories')
        const categoriesQuery = query(categoriesRef, where('budgetId', '==', budgetId))
        const categoriesSnapshot = await getDocs(categoriesQuery)
        
        categoriesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref)
        })

        // Delete budget
        const budgetRef = doc(db, 'budgets', budgetId)
        batch.delete(budgetRef)
      }
    }

    // Update wizard status
    const wizardRef = doc(db, 'budgetSetupWizards', wizardId)
    batch.update(wizardRef, {
      status: BudgetSetupStatus.APPROVED, // Reset to approved
      currentStep: BudgetSetupStep.SETUP_COMPLETION,
      rolledBackBy: rollbackBy,
      rolledBackAt: serverTimestamp(),
      rollbackReason: reason,
      budgetsCreated: [] // Clear created budget IDs
    })

    await batch.commit()
  } catch (error) {
    console.error('Error rolling back completed wizard:', error)
    throw error
  }
}

/**
 * Get all completed wizards for a building
 */
export const getCompletedWizards = async (
  buildingId: string
): Promise<BudgetSetupWizard[]> => {
  try {
    const wizardsRef = collection(db, 'budgetSetupWizards')
    const q = query(
      wizardsRef,
      where('buildingId', '==', buildingId),
      where('status', '==', BudgetSetupStatus.COMPLETED),
      orderBy('completedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BudgetSetupWizard[]
  } catch (error) {
    console.error('Error fetching completed wizards:', error)
    throw error
  }
}

/**
 * Archive old completed wizards
 */
export const archiveOldWizards = async (
  buildingId: string,
  olderThanDays: number = 365
): Promise<number> => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const wizardsRef = collection(db, 'budgetSetupWizards')
    const q = query(
      wizardsRef,
      where('buildingId', '==', buildingId),
      where('status', '==', BudgetSetupStatus.COMPLETED),
      where('completedAt', '<', cutoffDate)
    )
    
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isArchived: true,
        archivedAt: serverTimestamp()
      })
    })

    if (snapshot.docs.length > 0) {
      await batch.commit()
    }

    return snapshot.docs.length
  } catch (error) {
    console.error('Error archiving old wizards:', error)
    throw error
  }
}

// Export service object
export const budgetCompletionService = {
  completeBudgetSetup,
  generateCompletionSummary,
  getCompletionStatus,
  rollbackCompletedWizard,
  getCompletedWizards,
  archiveOldWizards
}
