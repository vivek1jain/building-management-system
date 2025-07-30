import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { budgetService } from '../services/budgetService'
import { getAllBuildings, createBuilding } from '../services/buildingService'
import { 
  Budget as BudgetType, 
  BudgetCategoryItem, 
  Building, 
  BudgetStatus,
  BudgetCategory 
} from '../types'

const BudgetPage: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth()
  
  // Debug: Log user state
  console.log('BudgetPage rendered with user:', currentUser)
  console.log('Firebase user:', firebaseUser)
  
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [budgets, setBudgets] = useState<BudgetType[]>([])
  const [selectedBudget, setSelectedBudget] = useState<BudgetType | null>(null)
  const [categories, setCategories] = useState<BudgetCategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateBudget, setShowCreateBudget] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [currentYear] = useState(new Date().getFullYear())

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    year: currentYear,
    totalAmount: 0,
    notes: ''
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    allocatedAmount: 0,
    approvalThreshold: 0,
    notes: ''
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadBudgets()
    }
  }, [selectedBuilding])

  useEffect(() => {
    if (selectedBudget) {
      loadCategories()
    }
  }, [selectedBudget])

  const loadBuildings = async () => {
    try {
      setLoading(true)
      console.log('Loading buildings...', { currentUser })
      const buildingsData = await getAllBuildings()
      
      // If no buildings exist, create a demo building
      if (buildingsData.length === 0) {
        try {
          console.log('Creating demo building...', { currentUser })
          const demoBuilding = await createBuilding({
            name: 'Demo Building',
            address: '123 Demo Street, Demo City',
            code: 'DEMO001',
            buildingType: 'Residential',
            floors: 5,
            units: 20,
            capacity: 50,
            area: 5000,
            financialYearStart: new Date('2024-01-01'),
            managers: firebaseUser?.uid ? [firebaseUser.uid] : [],
            admins: firebaseUser?.uid ? [firebaseUser.uid] : [],
            assets: [],
            meters: []
          })
          console.log('Demo building created:', demoBuilding)
          setBuildings([demoBuilding])
          setSelectedBuilding(demoBuilding.id)
        } catch (createError) {
          console.error('Error creating demo building:', createError)
          // Create a mock building for demo purposes
          const mockBuilding: Building = {
            id: 'demo-building-1',
            name: 'Demo Building',
            address: '123 Demo Street, Demo City',
            code: 'DEMO001',
            buildingType: 'Residential',
            floors: 5,
            units: 20,
            capacity: 50,
            area: 5000,
            financialYearStart: new Date('2024-01-01'),
            managers: firebaseUser?.uid ? [firebaseUser.uid] : [],
            admins: firebaseUser?.uid ? [firebaseUser.uid] : [],
            assets: [],
            meters: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          console.log('Using mock building:', mockBuilding)
          setBuildings([mockBuilding])
          setSelectedBuilding(mockBuilding.id)
        }
      } else {
      setBuildings(buildingsData)
        setSelectedBuilding(buildingsData[0].id)
      }
    } catch (error) {
      console.error('Error loading buildings:', error)
      // Show empty state on error
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const loadBudgets = async () => {
    if (!selectedBuilding) return
    
    try {
      setLoading(true)
      const budgetsData = await budgetService.getBudgetsByBuilding(selectedBuilding)
      setBudgets(budgetsData)
      
      // Select current year budget if exists
      const currentBudget = budgetsData.find(b => b.year === currentYear)
      if (currentBudget) {
        setSelectedBudget(currentBudget)
      }
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    if (!selectedBudget) return
    
    try {
      const categoriesData = await budgetService.getBudgetCategories(selectedBudget.id)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleCreateBudget = async () => {
    if (!selectedBuilding || !firebaseUser) return
    
    try {
      setLoading(true)
      const newBudget = await budgetService.createBudget({
        buildingId: selectedBuilding,
        year: budgetForm.year,
        status: 'draft',
        categories: [],
        totalAmount: budgetForm.totalAmount,
        allocatedAmount: 0,
        spentAmount: 0,
        remainingAmount: budgetForm.totalAmount,
        createdBy: firebaseUser.uid
      })
      
      setBudgets([...budgets, newBudget])
      setSelectedBudget(newBudget)
      setShowCreateBudget(false)
      setBudgetForm({ year: currentYear, totalAmount: 0, notes: '' })
    } catch (error) {
      console.error('Error creating budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!selectedBudget || !firebaseUser) return
    
    try {
      setLoading(true)
      const newCategory = await budgetService.createBudgetCategory({
        budgetId: selectedBudget.id,
        name: categoryForm.name,
        allocatedAmount: categoryForm.allocatedAmount,
        spentAmount: 0,
        remainingAmount: categoryForm.allocatedAmount,
        approvalThreshold: categoryForm.approvalThreshold,
        notes: categoryForm.notes,
        attachments: []
      })
      
      setCategories([...categories, newCategory])
      setShowCreateCategory(false)
      setCategoryForm({ name: '', allocatedAmount: 0, approvalThreshold: 0, notes: '' })
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetStatusUpdate = async (budgetId: string, status: BudgetStatus) => {
    if (!firebaseUser) return
    
    try {
      setLoading(true)
              await budgetService.updateBudgetStatus(budgetId, status, firebaseUser.uid)
      await loadBudgets() // Reload to get updated data
    } catch (error) {
      console.error('Error updating budget status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: BudgetStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'awaiting_approval': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'locked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getBudgetUtilization = (budget: BudgetType) => {
    if (budget.totalAmount === 0) return 0
    return Math.round((budget.spentAmount / budget.totalAmount) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
        <p className="text-gray-600">Manage budgets, categories, and track expenses</p>
      </div>

      {/* Authentication Status */}
      {!firebaseUser && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> You are not authenticated. Some features may not work properly.
            Please log in to access all budget management features.
          </p>
        </div>
      )}

      {/* Building Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Building
        </label>
        {buildings.length > 0 ? (
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name} - {building.address}
            </option>
          ))}
        </select>
        ) : (
          <div className="text-red-600 text-sm">
            No buildings available. Creating demo building...
          </div>
        )}
      </div>

      {/* Budget Overview */}
      {selectedBuilding && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Budget</h3>
          <p className="text-3xl font-bold text-blue-600">
            £{selectedBudget?.totalAmount.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Spent</h3>
          <p className="text-3xl font-bold text-red-600">
            £{selectedBudget?.spentAmount.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Remaining</h3>
          <p className="text-3xl font-bold text-green-600">
            £{selectedBudget?.remainingAmount.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Utilization</h3>
          <p className="text-3xl font-bold text-purple-600">
            {selectedBudget ? getBudgetUtilization(selectedBudget) : 0}%
          </p>
        </div>
      </div>
      )}

      {/* Budget Actions */}
      {selectedBuilding && (
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowCreateBudget(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Budget
        </button>
        {selectedBudget && (
          <button
            onClick={() => setShowCreateCategory(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Add Category
          </button>
        )}
      </div>
      )}

      {/* Budgets List */}
      {selectedBuilding && (
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Budgets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {budgets.length > 0 ? (
                  budgets.map((budget) => (
                <tr 
                  key={budget.id}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedBudget?.id === budget.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedBudget(budget)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {budget.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{budget.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{budget.spentAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{budget.remainingAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                      {budget.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {budget.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBudgetStatusUpdate(budget.id, 'awaiting_approval')
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Submit for Approval
                      </button>
                    )}
                        {budget.status === 'awaiting_approval' && currentUser?.role === 'admin' && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBudgetStatusUpdate(budget.id, 'approved')
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBudgetStatusUpdate(budget.id, 'rejected')
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No budgets found. Create your first budget to get started.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Categories */}
      {selectedBudget && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Budget Categories - {selectedBudget.year}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Threshold
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{category.allocatedAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{category.spentAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{category.remainingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{category.approvalThreshold.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Budget</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={budgetForm.year}
                  onChange={(e) => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input
                  type="number"
                  value={budgetForm.totalAmount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={budgetForm.notes}
                  onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateBudget}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Budget
              </button>
              <button
                onClick={() => setShowCreateBudget(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Budget Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount</label>
                <input
                  type="number"
                  value={categoryForm.allocatedAmount}
                  onChange={(e) => setCategoryForm({ ...categoryForm, allocatedAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Threshold</label>
                <input
                  type="number"
                  value={categoryForm.approvalThreshold}
                  onChange={(e) => setCategoryForm({ ...categoryForm, approvalThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={categoryForm.notes}
                  onChange={(e) => setCategoryForm({ ...categoryForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateCategory}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Category
              </button>
              <button
                onClick={() => setShowCreateCategory(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetPage 