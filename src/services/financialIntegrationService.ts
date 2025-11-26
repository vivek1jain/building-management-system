import { 
  ServiceChargeDemand, 
  Budget, 
  Expense, 
  Invoice
} from '../types'
import { budgetService } from './budgetService'
import { expenseService } from './expenseService'
import { getInvoicesByBuilding } from './invoiceService'
import { getServiceChargeDemands } from './serviceChargeService'
import { handleFirebaseError } from '../utils/errorHandler'

/**
 * Service to integrate financial data across all tabs
 * Links service charges, expenses, invoices, and budget data
 */
export class FinancialIntegrationService {
  
  /**
   * Get financial overview linking all tabs
   */
  async getFinancialOverview(buildingId: string) {
    try {
      // Get data from all financial sources
      const [serviceCharges, budgets, expenses, invoices] = await Promise.all([
        getServiceChargeDemands(buildingId),
        budgetService.getBudgetsByBuilding(buildingId),
        expenseService.getExpensesByBuilding(buildingId),
        getInvoicesByBuilding(buildingId)
      ])

      // Calculate totals
      const totalServiceChargeIncome = serviceCharges.reduce((sum, sc) => sum + sc.amountPaid, 0)
      const totalServiceChargeDemanded = serviceCharges.reduce((sum, sc) => sum + sc.totalAmountDue, 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      const totalInvoices = invoices.reduce((sum, i) => sum + i.amount, 0)

      return {
        serviceCharges: {
          total: serviceCharges.length,
          demanded: totalServiceChargeDemanded,
          collected: totalServiceChargeIncome,
          outstanding: totalServiceChargeDemanded - totalServiceChargeIncome,
          collectionRate: totalServiceChargeDemanded > 0 ? 
            (totalServiceChargeIncome / totalServiceChargeDemanded) * 100 : 0
        },
        expenses: {
          total: expenses.length,
          amount: totalExpenses
        },
        invoices: {
          total: invoices.length,
          amount: totalInvoices
        },
        budget: {
          total: budgets.length,
          totalBudgeted: budgets.reduce((sum, b) => sum + (b.totalIncome || 0), 0)
        },
        netPosition: totalServiceChargeIncome - (totalExpenses + totalInvoices)
      }
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getFinancialOverview',
        buildingId,
      })
    }
  }

  /**
   * Get service charge impact on budget
   */
  async getServiceChargeImpact(buildingId: string) {
    try {
      const [serviceCharges, budgets] = await Promise.all([
        getServiceChargeDemands(buildingId),
        budgetService.getBudgetsByBuilding(buildingId)
      ])

      const actualAmount = serviceCharges.reduce((sum, sc) => sum + sc.amountPaid, 0)
      const totalDemanded = serviceCharges.reduce((sum, sc) => sum + sc.totalAmountDue, 0)
      const budgetedAmount = budgets.reduce((sum, b) => sum + (b.totalIncome || 0), 0)
      
      return {
        budgetedAmount,
        actualAmount,
        variance: actualAmount - budgetedAmount,
        collectionRate: totalDemanded > 0 ? (actualAmount / totalDemanded) * 100 : 0
      }
    } catch (error: any) {
      throw handleFirebaseError(error, {
        action: 'getServiceChargeImpact',
        buildingId,
      })
    }
  }
}

export const financialIntegrationService = new FinancialIntegrationService()
