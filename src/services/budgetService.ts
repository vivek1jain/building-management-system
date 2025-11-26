import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  Budget, 
  BudgetCategoryItem, 
  Expense, 
  BudgetStatus
} from '../types'
import { handleFirebaseError, createAppError } from '../utils/errorHandler'

// Budget Service
export const budgetService = {
  // Create a new budget
  async createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const budgetRef = await addDoc(collection(db, 'budgets'), {
        ...budgetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const budget = await getDoc(budgetRef)
      return { id: budgetRef.id, ...budget.data() } as Budget
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'createBudget',
        budgetData,
      })
    }
  },

  // Get budget by ID
  async getBudget(budgetId: string): Promise<Budget | null> {
    try {
      const budgetDoc = await getDoc(doc(db, 'budgets', budgetId))
      if (budgetDoc.exists()) {
        return { id: budgetDoc.id, ...budgetDoc.data() } as Budget
      }
      return null
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getBudget',
        budgetId,
      })
    }
  },

  // Get budgets by building
  async getBudgetsByBuilding(buildingId: string): Promise<Budget[]> {
    try {
      const budgetsQuery = query(
        collection(db, 'budgets'),
        where('buildingId', '==', buildingId)
      )
      const querySnapshot = await getDocs(budgetsQuery)
      
      // Sort in memory instead of using orderBy
      const budgets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[]
      
      return budgets.sort((a, b) => b.year - a.year)
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getBudgetsByBuilding',
        buildingId,
      })
    }
  },

  // Get current year budget for building
  async getCurrentYearBudget(buildingId: string, year: number): Promise<Budget | null> {
    try {
      const budgetQuery = query(
        collection(db, 'budgets'),
        where('buildingId', '==', buildingId),
        where('year', '==', year)
      )
      const querySnapshot = await getDocs(budgetQuery)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return { id: doc.id, ...doc.data() } as Budget
      }
      return null
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getCurrentYearBudget',
        buildingId,
        year,
      })
    }
  },

  // Update budget
  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    try {
      await updateDoc(doc(db, 'budgets', budgetId), {
        ...updates,
        updatedAt: serverTimestamp()
      } as any) // Type assertion needed for Firestore FieldValue compatibility
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updateBudget',
        budgetId,
      })
    }
  },

  // Update budget status
  async updateBudgetStatus(budgetId: string, status: BudgetStatus, approvedBy?: string): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: serverTimestamp()
      }
      
      if (status === 'approved' && approvedBy) {
        updates.approvedBy = approvedBy
        updates.approvedAt = new Date()
      }
      
      await updateDoc(doc(db, 'budgets', budgetId), updates)
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updateBudgetStatus',
        budgetId,
        status,
      })
    }
  },

  // Delete budget
  async deleteBudget(budgetId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'budgets', budgetId))
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'deleteBudget',
        budgetId,
      })
    }
  },

  // Create budget category
  async createBudgetCategory(categoryData: Omit<BudgetCategoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetCategoryItem> {
    try {
      const categoryRef = await addDoc(collection(db, 'budgetCategories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const category = await getDoc(categoryRef)
      return { id: categoryRef.id, ...category.data() } as BudgetCategoryItem
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'createBudgetCategory',
        categoryData,
      })
    }
  },

  // Get budget categories
  async getBudgetCategories(budgetId: string): Promise<BudgetCategoryItem[]> {
    try {
      const categoriesQuery = query(
        collection(db, 'budgetCategories'),
        where('budgetId', '==', budgetId)
      )
      const querySnapshot = await getDocs(categoriesQuery)
      
      // Sort in memory instead of using orderBy
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetCategoryItem[]
      
      return categories.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getBudgetCategories',
        budgetId,
      })
    }
  },

  // Update budget category
  async updateBudgetCategory(categoryId: string, updates: Partial<BudgetCategoryItem>): Promise<void> {
    try {
      await updateDoc(doc(db, 'budgetCategories', categoryId), {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updateBudgetCategory',
        categoryId,
      })
    }
  },

  // Create expense
  async createExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    try {
      const expenseRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const expense = await getDoc(expenseRef)
      return { id: expenseRef.id, ...expense.data() } as Expense
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'createExpense',
        expenseData,
      })
    }
  },

  // Get expenses by building
  async getExpensesByBuilding(buildingId: string): Promise<Expense[]> {
    try {
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('buildingId', '==', buildingId)
      )
      const querySnapshot = await getDocs(expensesQuery)
      
      // Sort in memory instead of using orderBy
      const expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]
      
      return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getExpensesByBuilding',
        buildingId,
      })
    }
  },

  // Get expenses by budget
  async getExpensesByBudget(budgetId: string): Promise<Expense[]> {
    try {
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('budgetId', '==', budgetId)
      )
      const querySnapshot = await getDocs(expensesQuery)
      
      // Sort in memory instead of using orderBy
      const expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]
      
      return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getExpensesByBudget',
        budgetId,
      })
    }
  },

  // Update expense
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'updateExpense',
        expenseId,
      })
    }
  },

  // Approve expense
  async approveExpense(expenseId: string, approvedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        status: 'approved',
        approvedBy,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'approveExpense',
        expenseId,
      })
    }
  },

  // Get budget statistics
  async getBudgetStats(buildingId: string, year: number): Promise<{
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    budgetUtilization: number
    categoryBreakdown: Record<string, { allocated: number; spent: number; remaining: number }>
  }> {
    try {
      const budget = await this.getCurrentYearBudget(buildingId, year)
      const expenses = await this.getExpensesByBudget(budget?.id || '')
      
      const totalBudget = budget?.totalAmount || 0
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const totalRemaining = totalBudget - totalSpent
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      // Calculate category breakdown
      const categoryBreakdown: Record<string, { allocated: number; spent: number; remaining: number }> = {}
      
      if (budget) {
        for (const category of budget.categories) {
          const categoryExpenses = expenses.filter(expense => expense.categoryId === category.id)
          const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
          
          categoryBreakdown[category.name] = {
            allocated: category.allocatedAmount,
            spent,
            remaining: category.allocatedAmount - spent
          }
        }
      }

      return {
        totalBudget,
        totalSpent,
        totalRemaining,
        budgetUtilization,
        categoryBreakdown
      }
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getBudgetStats',
        buildingId,
        year,
      })
    }
  },

  // Copy budget from previous year
  async copyBudgetFromPreviousYear(buildingId: string, fromYear: number, toYear: number): Promise<Budget | null> {
    try {
      const previousBudget = await this.getCurrentYearBudget(buildingId, fromYear)
      if (!previousBudget) {
        return null
      }

      const newBudgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
        ...previousBudget,
        year: toYear,
        status: 'draft',
        approvedBy: undefined,
        approvedAt: undefined
      }

      return await this.createBudget(newBudgetData)
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'copyBudgetFromPreviousYear',
        buildingId,
        fromYear,
        toYear,
      })
    }
  }
} 