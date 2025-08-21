import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { 
  generateServiceChargeDemands, 
  getGlobalFinancialSettings, 
  updateGlobalFinancialSettings, 
  sendReminder, 
  checkAndApplyPenalties,
  recordIncome,
  recordExpenditure,
  getIncomeEntries,
  getExpenditureEntries,
  getIncomeStats,
  getExpenditureStats,
  getBuildingFinancialSummary
} from '../services/serviceChargeService'
import { getAllBuildings } from '../services/buildingService'
import { getFlatsByBuilding } from '../services/flatService'
import { Building, ServiceChargeDemand, Income, Expenditure, BuildingFinancialSummary } from '../types'
import { 
  Plus, 
  Settings, 
  Bell, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

const ServiceCharges: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth()
  const { addNotification } = useNotifications()
  
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeDemand[]>([])
  const [incomeEntries, setIncomeEntries] = useState<Income[]>([])
  const [expenditureEntries, setExpenditureEntries] = useState<Expenditure[]>([])
  const [financialSummary, setFinancialSummary] = useState<BuildingFinancialSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDemandForm, setShowDemandForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenditureForm, setShowExpenditureForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [stats, setStats] = useState<any>(null)

  // Form states
  const [demandForm, setDemandForm] = useState({
    quarter: '',
    year: new Date().getFullYear(),
    ratePerSqFt: 0,
    dueDate: '',
    includeGroundRent: false,
    invoiceGrouping: 'per_unit' as 'per_unit' | 'per_resident',
    showBreakdown: false,
    penaltyConfig: {
      type: 'flat' as 'flat' | 'percentage' | 'both',
      flatAmount: 0,
      percentage: 0,
      gracePeriodDays: 0,
      maxPenaltyAmount: 0
    },
    remindersConfig: {
      reminderDays: [7, 3, 1],
      maxReminders: 3
    },
    chargeBreakdown: [] as any[]
  })

  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    source: 'building_charges' as 'building_charges' | 'penalty' | 'interest' | 'miscellaneous' | 'other',
    description: '',
    relatedInvoiceId: ''
  })

  const [expenditureForm, setExpenditureForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: 'proactive_maintenance' as 'proactive_maintenance' | 'reactive_maintenance' | 'salary' | 'utility' | 'insurance' | 'cleaning' | 'security' | 'other',
    description: '',
    tag: 'proactive' as 'proactive' | 'reactive',
    vendorName: '',
    supportingDocumentUrl: ''
  })

  const [settingsForm, setSettingsForm] = useState({
    serviceChargeRatePerSqFt: 0,
    paymentDueLeadDays: 0,
    financialYearStartDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadServiceCharges()
      loadIncomeEntries()
      loadExpenditureEntries()
      loadFinancialSummary()
      loadStats()
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
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading buildings',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const loadServiceCharges = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual service call
      const mockCharges: ServiceChargeDemand[] = [
        {
          id: '1',
          flatId: 'flat1',
          buildingId: selectedBuilding,
          flatNumber: 'A101',
          residentName: 'John Doe',
          financialQuarterDisplayString: 'Q1 2024',
          areaSqFt: 1200,
          rateApplied: 2.5,
          baseAmount: 3000,
          groundRentAmount: 500,
          penaltyAmountApplied: 0,
          totalAmountDue: 3500,
          amountPaid: 2000,
          outstandingAmount: 1500,
          dueDate: new Date('2024-03-31'),
          issuedDate: new Date('2024-01-01'),
          status: 'Partially Paid' as any,
          paymentHistory: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          issuedByUid: firebaseUser?.uid || '',
          invoiceGrouping: 'per_unit',
          showBreakdown: false,
          chargeBreakdown: [],
          penaltyConfig: { type: 'flat', flatAmount: 0, gracePeriodDays: 0 },
          remindersConfig: { reminderDays: [7, 3, 1], maxReminders: 3 },
          remindersSent: 0
        }
      ]
      setServiceCharges(mockCharges)
    } catch (error) {
      console.error('Error loading service charges:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading service charges',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadIncomeEntries = async () => {
    try {
      const incomeData = await getIncomeEntries(selectedBuilding)
      setIncomeEntries(incomeData)
    } catch (error) {
      console.error('Error loading income entries:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading income entries',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const loadExpenditureEntries = async () => {
    try {
      const expenditureData = await getExpenditureEntries(selectedBuilding)
      setExpenditureEntries(expenditureData)
    } catch (error) {
      console.error('Error loading expenditure entries:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading expenditure entries',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const loadFinancialSummary = async () => {
    try {
      const summary = await getBuildingFinancialSummary(selectedBuilding, 'Q1 2024')
      setFinancialSummary(summary)
    } catch (error) {
      console.error('Error loading financial summary:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading financial summary',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const loadStats = async () => {
    try {
      const [incomeStats, expenditureStats] = await Promise.all([
        getIncomeStats(selectedBuilding),
        getExpenditureStats(selectedBuilding)
      ])
      setStats({ income: incomeStats, expenditure: expenditureStats })
    } catch (error) {
      console.error('Error loading stats:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading financial stats',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const handleCreateDemand = async () => {
    try {
      setLoading(true)
      // Get flats for the building first
      const flats = await getFlatsByBuilding(selectedBuilding)
      
      const demandIds = await generateServiceChargeDemands(
        selectedBuilding,
        `${demandForm.quarter} ${demandForm.year}`,
        demandForm.ratePerSqFt,
        flats
      )
      
      if (demandIds && demandIds.length > 0) {
        if (currentUser) {
          addNotification({
            title: 'Success',
            message: `Successfully created ${demandIds.length} service charge demands`,
            type: 'success',
            userId: currentUser.id
          })
        }
        setShowDemandForm(false)
        loadServiceCharges()
      } else {
        if (currentUser) {
          addNotification({
            title: 'Error',
            message: 'No service charge demands were created',
            type: 'error',
            userId: currentUser.id
          })
        }
      }
    } catch (error) {
      console.error('Error creating demand:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error creating service charge demand',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRecordIncome = async () => {
    try {
      setLoading(true)
      await recordIncome(selectedBuilding, {
        buildingId: selectedBuilding,
        date: new Date(incomeForm.date),
        amount: incomeForm.amount,
        source: incomeForm.source,
        description: incomeForm.description,
        relatedInvoiceId: incomeForm.relatedInvoiceId || undefined,
        recordedByUid: firebaseUser?.uid || ''
      })
      
      if (currentUser) {
        addNotification({
          title: 'Success',
          message: 'Income recorded successfully',
          type: 'success',
          userId: currentUser.id
        })
      }
      setShowIncomeForm(false)
      loadIncomeEntries()
      loadFinancialSummary()
    } catch (error) {
      console.error('Error recording income:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error recording income',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRecordExpenditure = async () => {
    try {
      setLoading(true)
      await recordExpenditure(selectedBuilding, {
        buildingId: selectedBuilding,
        date: new Date(expenditureForm.date),
        amount: expenditureForm.amount,
        category: expenditureForm.category,
        description: expenditureForm.description,
        tag: expenditureForm.category.includes('maintenance') ? expenditureForm.tag : undefined,
        vendorName: expenditureForm.vendorName || undefined,
        supportingDocumentUrl: expenditureForm.supportingDocumentUrl || undefined,
        recordedByUid: firebaseUser?.uid || ''
      })
      
      if (currentUser) {
        addNotification({
          title: 'Success',
          message: 'Expenditure recorded successfully',
          type: 'success',
          userId: currentUser.id
        })
      }
      setShowExpenditureForm(false)
      loadExpenditureEntries()
      loadFinancialSummary()
    } catch (error) {
      console.error('Error recording expenditure:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error recording expenditure',
          type: 'error',
          userId: currentUser.id
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (demandId: string) => {
    try {
      await sendReminder(demandId)
      if (currentUser) {
        addNotification({
          title: 'Success',
          message: 'Reminder sent successfully',
          type: 'success',
          userId: currentUser.id
        })
      }
      loadServiceCharges()
    } catch (error) {
      console.error('Error sending reminder:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error sending reminder',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const handleCheckPenalties = async () => {
    try {
      await checkAndApplyPenalties(selectedBuilding)
      if (currentUser) {
        addNotification({
          title: 'Success',
          message: 'Penalties checked and applied',
          type: 'success',
          userId: currentUser.id
        })
      }
      loadServiceCharges()
    } catch (error) {
      console.error('Error checking penalties:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error checking penalties',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const handleSaveSettings = async () => {
    try {
      await updateGlobalFinancialSettings(selectedBuilding, {
        serviceChargeRatePerSqFt: settingsForm.serviceChargeRatePerSqFt,
        paymentDueLeadDays: settingsForm.paymentDueLeadDays,
        financialYearStartDate: new Date(settingsForm.financialYearStartDate)
      })
      if (currentUser) {
        addNotification({
          title: 'Success',
          message: 'Settings saved successfully',
          type: 'success',
          userId: currentUser.id
        })
      }
      setShowSettings(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error saving settings',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-success-600 bg-green-100'
      case 'Partially Paid': return 'text-yellow-600 bg-yellow-100'
      case 'Overdue': return 'text-red-600 bg-red-100'
      case 'Issued': return 'text-primary-600 bg-blue-100'
      default: return 'text-gray-600 bg-neutral-100'
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Financial Management</h1>
          <p className="text-gray-600">Comprehensive financial management including service charges, income tracking, and expenditure management</p>
        </div>

        {/* Building Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Select Building
          </label>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
          >
            <option value="">Select a building</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBuilding && (
          <>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      ${financialSummary?.totalIncome?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Expenditure</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      ${financialSummary?.totalExpenditure?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${financialSummary?.netCashFlow && financialSummary.netCashFlow >= 0 ? 'text-success-600' : 'text-red-600'}`}>
                      ${financialSummary?.netCashFlow?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Outstanding Charges</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      ${serviceCharges.reduce((sum, charge) => sum + charge.outstandingAmount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setShowDemandForm(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Demand
              </button>

              <button
                onClick={() => setShowIncomeForm(true)}
                className="flex items-center px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-600 transition-colors"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Record Income
              </button>

              <button
                onClick={() => setShowExpenditureForm(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrendingDown className="h-5 w-5 mr-2" />
                Record Expenditure
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </button>

              <button
                onClick={handleCheckPenalties}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Check Penalties
              </button>
            </div>

            {/* Service Charges Table */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900">Service Charge Demands</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Flat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Amount Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceCharges.map((charge) => (
                      <tr key={charge.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {charge.flatNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {charge.financialQuarterDisplayString}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          ${charge.totalAmountDue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          ${charge.amountPaid.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          ${charge.outstandingAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(charge.status)}`}>
                            {charge.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {charge.dueDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSendReminder(charge.id)}
                            className="text-primary-600 hover:text-blue-900 mr-3"
                          >
                            Send Reminder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Income and Expenditure Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Income Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900">Recent Income</h3>
                </div>
                <div className="p-6">
                  {incomeEntries.length > 0 ? (
                    <div className="space-y-4">
                      {incomeEntries.slice(0, 5).map((income) => (
                        <div key={income.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{income.description}</p>
                            <p className="text-xs text-neutral-500">{income.source}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-success-600">${income.amount.toLocaleString()}</p>
                            <p className="text-xs text-neutral-500">{new Date(income.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-4">No income entries found</p>
                  )}
                </div>
              </div>

              {/* Expenditure Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900">Recent Expenditures</h3>
                </div>
                <div className="p-6">
                  {expenditureEntries.length > 0 ? (
                    <div className="space-y-4">
                      {expenditureEntries.slice(0, 5).map((expenditure) => (
                        <div key={expenditure.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{expenditure.description}</p>
                            <p className="text-xs text-neutral-500">{expenditure.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">${expenditure.amount.toLocaleString()}</p>
                            <p className="text-xs text-neutral-500">{new Date(expenditure.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-4">No expenditure entries found</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        {/* Create Demand Modal */}
        {showDemandForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-modal" style={{ zIndex: 1400 }}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Create Service Charge Demand</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Quarter</label>
                    <input
                      type="text"
                      value={demandForm.quarter}
                      onChange={(e) => setDemandForm({...demandForm, quarter: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                      placeholder="e.g., Q1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Year</label>
                    <input
                      type="number"
                      value={demandForm.year}
                      onChange={(e) => setDemandForm({...demandForm, year: parseInt(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Rate per sq ft</label>
                    <input
                      type="number"
                      step="0.01"
                      value={demandForm.ratePerSqFt}
                      onChange={(e) => setDemandForm({...demandForm, ratePerSqFt: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Due Date</label>
                    <input
                      type="date"
                      value={demandForm.dueDate}
                      onChange={(e) => setDemandForm({...demandForm, dueDate: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={demandForm.includeGroundRent}
                      onChange={(e) => setDemandForm({...demandForm, includeGroundRent: e.target.checked})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-neutral-900">Include Ground Rent</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Invoice Grouping</label>
                    <select
                      value={demandForm.invoiceGrouping}
                      onChange={(e) => setDemandForm({...demandForm, invoiceGrouping: e.target.value as 'per_unit' | 'per_resident'})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    >
                      <option value="per_unit">Per Unit</option>
                      <option value="per_resident">Per Resident</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowDemandForm(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDemand}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Demand'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record Income Modal */}
        {showIncomeForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-modal" style={{ zIndex: 1400 }}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Record Income</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Date</label>
                    <input
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({...incomeForm, amount: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Source</label>
                    <select
                      value={incomeForm.source}
                      onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value as any})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    >
                      <option value="building_charges">Building Charges</option>
                      <option value="penalty">Penalty</option>
                      <option value="interest">Interest</option>
                      <option value="miscellaneous">Miscellaneous</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowIncomeForm(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordIncome}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-md hover:bg-success-600 disabled:opacity-50"
                  >
                    {loading ? 'Recording...' : 'Record Income'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record Expenditure Modal */}
        {showExpenditureForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-modal" style={{ zIndex: 1400 }}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Record Expenditure</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Date</label>
                    <input
                      type="date"
                      value={expenditureForm.date}
                      onChange={(e) => setExpenditureForm({...expenditureForm, date: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenditureForm.amount}
                      onChange={(e) => setExpenditureForm({...expenditureForm, amount: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Category</label>
                    <select
                      value={expenditureForm.category}
                      onChange={(e) => setExpenditureForm({...expenditureForm, category: e.target.value as any})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    >
                      <option value="proactive_maintenance">Proactive Maintenance</option>
                      <option value="reactive_maintenance">Reactive Maintenance</option>
                      <option value="salary">Salary</option>
                      <option value="utility">Utility</option>
                      <option value="insurance">Insurance</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {expenditureForm.category.includes('maintenance') && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700">Tag</label>
                      <select
                        value={expenditureForm.tag}
                        onChange={(e) => setExpenditureForm({...expenditureForm, tag: e.target.value as 'proactive' | 'reactive'})}
                        className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                      >
                        <option value="proactive">Proactive</option>
                        <option value="reactive">Reactive</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      value={expenditureForm.description}
                      onChange={(e) => setExpenditureForm({...expenditureForm, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Vendor Name (Optional)</label>
                    <input
                      type="text"
                      value={expenditureForm.vendorName}
                      onChange={(e) => setExpenditureForm({...expenditureForm, vendorName: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowExpenditureForm(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordExpenditure}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Recording...' : 'Record Expenditure'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-modal" style={{ zIndex: 1400 }}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Financial Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Service Charge Rate per sq ft</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settingsForm.serviceChargeRatePerSqFt}
                      onChange={(e) => setSettingsForm({...settingsForm, serviceChargeRatePerSqFt: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Payment Due Lead Days</label>
                    <input
                      type="number"
                      value={settingsForm.paymentDueLeadDays}
                      onChange={(e) => setSettingsForm({...settingsForm, paymentDueLeadDays: parseInt(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Financial Year Start Date</label>
                    <input
                      type="date"
                      value={settingsForm.financialYearStartDate}
                      onChange={(e) => setSettingsForm({...settingsForm, financialYearStartDate: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceCharges 