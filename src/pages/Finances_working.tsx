import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getAllBuildings } from '../services/buildingService'
import { budgetService } from '../services/budgetService'
import { 
  getServiceChargeDemands,
  getBuildingFinancialSummary
} from '../services/serviceChargeService'
import { getInvoicesByBuilding } from '../services/invoiceService'
import { 
  Building, 
  Budget as BudgetType, 
  ServiceChargeDemand, 
  Invoice, 
  PaymentFrequency,
  BuildingFinancialSummary
} from '../types'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calendar, 
  Plus, 
  Lock, 
  Unlock,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react'

// UK-specific budget categories
const UK_INCOME_CATEGORIES = [
  { id: 'service_charges', name: 'Service Charges', frequency: PaymentFrequency.QUARTERLY },
  { id: 'ground_rent', name: 'Ground Rent', frequency: PaymentFrequency.ANNUALLY }
]

const UK_EXPENDITURE_CATEGORIES = [
  { id: 'planned_expenditure', name: 'Planned Expenditure' },
  { id: 'reserve_fund', name: 'Reserve Fund' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'planned_maintenance', name: 'Planned Maintenance' },
  { id: 'other', name: 'Other' }
]

const Finances: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth()
  const { addNotification } = useNotifications()
  
  // Core state
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'budget' | 'demands' | 'invoices' | 'reports'>('budget')
  const [loading, setLoading] = useState(false)
  
  // Financial data
  const [budget, setBudget] = useState<BudgetType | null>(null)
  const [financialSummary, setFinancialSummary] = useState<BuildingFinancialSummary | null>(null)
  
  // UI state
  const [showBudgetSetup, setShowBudgetSetup] = useState(false)
  const [budgetLocked, setBudgetLocked] = useState(false)
  
  // Form states
  const [budgetForm, setBudgetForm] = useState({
    year: new Date().getFullYear(),
    financialYearStart: '2024-04-01', // UK financial year
    serviceChargeRate: 0,
    groundRentRate: 0,
    incomeCategories: UK_INCOME_CATEGORIES.map(cat => ({
      ...cat,
      budgetAmount: 0,
      actualAmount: 0
    })),
    expenditureCategories: UK_EXPENDITURE_CATEGORIES.map(cat => ({
      ...cat,
      budgetAmount: 0,
      actualAmount: 0,
      approvalThreshold: 1000
    }))
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadFinancialData()
    }
  }, [selectedBuilding])

  const loadBuildings = async () => {
    try {
      const buildingsData = await getAllBuildings()
      setBuildings(buildingsData)
      if (buildingsData.length > 0) {
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('Error loading buildings:', error)
    }
  }

  const loadFinancialData = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      const [budgetData, summaryData] = await Promise.all([
        budgetService.getBudgetsByBuilding(selectedBuilding),
        getBuildingFinancialSummary(selectedBuilding, new Date().getFullYear().toString())
      ])
      
      setBudget(budgetData.length > 0 ? budgetData[0] : null)
      setFinancialSummary(summaryData)
    } catch (error) {
      console.error('Error loading financial data:', error)
      addNotification('Error loading financial data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBuilding) return

    try {
      setLoading(true)
      
      const budgetData = {
        buildingId: selectedBuilding,
        year: budgetForm.year,
        financialYearStart: budgetForm.financialYearStart,
        incomeCategories: budgetForm.incomeCategories,
        expenditureCategories: budgetForm.expenditureCategories,
        totalIncome: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        totalExpenditure: budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        netBudget: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0) - 
                   budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (budget) {
        await budgetService.updateBudget(budget.id, budgetData)
        addNotification('Budget updated successfully!', 'success')
      } else {
        await budgetService.createBudget(budgetData)
        addNotification('Budget created successfully!', 'success')
      }
      
      setShowBudgetSetup(false)
      await loadFinancialData()
    } catch (error) {
      console.error('Error saving budget:', error)
      addNotification('Error saving budget. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-inter">Financial Management</h1>
          <p className="text-gray-600 font-inter">Manage budgets, service charges, invoices, and financial reports</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter"
          >
            <option value="">Select Building</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Total Income</p>
                <p className="text-2xl font-bold text-green-600 font-inter">
                  {formatCurrency(financialSummary.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Total Expenditure</p>
                <p className="text-2xl font-bold text-red-600 font-inter">
                  {formatCurrency(financialSummary.totalExpenditure)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Net Position</p>
                <p className={`text-2xl font-bold font-inter ${
                  financialSummary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financialSummary.netPosition)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600 font-inter">
                  {formatCurrency(financialSummary.outstandingAmount)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'budget', name: 'Budget', icon: BarChart3 },
              { id: 'demands', name: 'Service Charges', icon: FileText },
              { id: 'invoices', name: 'Invoices', icon: FileText },
              { id: 'reports', name: 'Reports', icon: PieChart }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm font-inter ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 font-inter">Budget Management</h2>
                <div className="flex items-center space-x-3">
                  {budget && (
                    <button
                      onClick={() => setBudgetLocked(!budgetLocked)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-inter ${
                        budgetLocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {budgetLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      <span>{budgetLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowBudgetSetup(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-inter"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{budget ? 'Edit Budget' : 'Create Budget'}</span>
                  </button>
                </div>
              </div>

              {budget ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 font-inter">Total Income Budget</h3>
                      <p className="text-2xl font-bold text-green-600 font-inter">
                        {formatCurrency(budget.totalIncome)}
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 font-inter">Total Expenditure Budget</h3>
                      <p className="text-2xl font-bold text-red-600 font-inter">
                        {formatCurrency(budget.totalExpenditure)}
                      </p>
                    </div>
                    <div className={`border rounded-lg p-4 ${
                      budget.netBudget >= 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <h3 className={`font-medium font-inter ${
                        budget.netBudget >= 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        Net Budget
                      </h3>
                      <p className={`text-2xl font-bold font-inter ${
                        budget.netBudget >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(budget.netBudget)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 font-inter">No Budget Set</h3>
                  <p className="text-gray-600 font-inter">Create a budget to start managing your building's finances</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'demands' && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 font-inter">Service Charges</h3>
              <p className="text-gray-600 font-inter">Service charge management features will be available soon</p>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 font-inter">Invoices</h3>
              <p className="text-gray-600 font-inter">Invoice management features will be available soon</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 font-inter">Financial Reports</h3>
              <p className="text-gray-600 font-inter">Financial reporting features will be available soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Setup Modal */}
      {showBudgetSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 font-inter">
                {budget ? 'Edit Budget' : 'Create New Budget'}
              </h2>
              
              <form onSubmit={handleBudgetSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">
                      Financial Year
                    </label>
                    <input
                      type="number"
                      value={budgetForm.year}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-inter">
                      Financial Year Start Date
                    </label>
                    <input
                      type="date"
                      value={budgetForm.financialYearStart}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, financialYearStart: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowBudgetSetup(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-inter"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedBuilding}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                  >
                    {loading ? 'Saving...' : (budget ? 'Update Budget' : 'Create Budget')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Finances
