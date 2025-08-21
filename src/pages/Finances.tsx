import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useBuilding } from '../contexts/BuildingContext';
import { 
  Building as BuildingType, 
  Budget, 
  ServiceChargeDemand, 
  Invoice, 
  Flat,
  PaymentFrequency,
  ServiceChargeDemandStatus,
  PaymentMethod,
  PaymentRecord,
  InvoiceStatus
} from '../types';
import { budgetService } from '../services/budgetService';
// Note: Financial summary now uses real Firebase data instead of mock data
import { 
  getServiceChargeDemands,
  generateServiceChargeDemands,
  updateServiceChargeDemand,
  sendReminder,

} from '../services/serviceChargeService'
import { getInvoicesByBuilding } from '../services/invoiceService'
import { getFlatsByBuilding } from '../services/flatService'
import { 
  Building,
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Plus, 
  Lock,
  Unlock,
  Eye,
  Clock,
  X,
  BarChart3,
  CreditCard,
  Send,
  ChevronDown
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Modal, ModalHeader, ModalFooter } from '../components/UI'

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
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { buildings, selectedBuildingId, selectedBuilding, setSelectedBuildingId, loading: buildingsLoading } = useBuilding()
  
  // Core state
  const [activeTab, setActiveTab] = useState<'budget' | 'demands' | 'invoices' | 'reports'>('budget')
  const [loading, setLoading] = useState(false)
  
  // Financial data
  const [budget, setBudget] = useState<Budget | null>(null)
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeDemand[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [flats, setFlats] = useState<Flat[]>([])
  
  // Service Charges state
  const [selectedQuarter, setSelectedQuarter] = useState('Q1-2024')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDemandDetails, setShowDemandDetails] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<ServiceChargeDemand | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  
  // UI state
  const [showBudgetSetup, setShowBudgetSetup] = useState(false)
  const [budgetLocked, setBudgetLocked] = useState(false)
  
  // Form states
  const [budgetForm, setBudgetForm] = useState({
    year: new Date().getFullYear(),
    financialYearStart: new Date('2024-04-01'), // UK financial year
    status: 'draft',
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

  // Calculate dynamic financial summary based on real Firebase data
  const getFinancialSummary = () => {
    if (!selectedBuildingId) {
      return {
        totalIncome: 0,
        totalExpenditure: 0,
        netPosition: 0,
        outstanding: 0
      }
    }

    // Calculate totals from real budget data loaded from Firebase
    let totalIncome = 0
    let totalExpenditure = 0
    
    if (budget && budget.categories) {
      budget.categories.forEach(category => {
        if (category.type === 'income') {
          totalIncome += category.actualAmount || 0
        } else if (category.type === 'expenditure') {
          totalExpenditure += category.actualAmount || 0
        }
      })
    }
    
    const netPosition = totalIncome - totalExpenditure
    
    // Calculate outstanding amounts from real Firebase data
    const outstandingServiceCharges = serviceCharges.reduce((sum, sc) => sum + (sc.outstandingAmount || 0), 0)
    const outstandingInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PENDING || inv.paymentStatus === 'overdue')
                                      .reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const outstanding = outstandingServiceCharges + outstandingInvoices
    
    return {
      totalIncome,
      totalExpenditure,
      netPosition,
      outstanding
    }
  }

  const financialSummary = getFinancialSummary()

  useEffect(() => {
    if (selectedBuildingId) {
      loadFinancialData()
    }
  }, [selectedBuildingId])


  const loadFinancialData = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      const [budgetData, demandsData, invoicesData, flatsData] = await Promise.all([
        budgetService.getBudgetsByBuilding(selectedBuildingId),
        getServiceChargeDemands(selectedBuildingId),
        getInvoicesByBuilding(selectedBuildingId),
        getFlatsByBuilding(selectedBuildingId)
      ])
      
      setBudget(budgetData.length > 0 ? budgetData[0] : null)
      setServiceCharges(demandsData)
      setInvoices(invoicesData)
      // Financial summary is now calculated dynamically
      setFlats(flatsData)
    } catch (error) {
      console.error('Error loading financial data:', error)
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Error loading financial data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBuildingId) {
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Error', 
        message: 'Please select a building before creating a budget', 
        type: 'error' 
      })
      return
    }

    try {
      setLoading(true)
      
      // Validate that we have at least some budget data
      const totalIncome = budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0)
      const totalExpenditure = budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0)
      
      if (totalIncome === 0 && totalExpenditure === 0) {
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Warning', 
          message: 'Budget has no income or expenditure amounts. Please add some budget values.', 
          type: 'warning' 
        })
      }
      
      const newBudget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
        buildingId: selectedBuildingId,
        year: budgetForm.year,
        financialYearStart: budgetForm.financialYearStart,
        status: budgetForm.status as any,
        categories: [
          ...budgetForm.incomeCategories.map(cat => ({
            id: cat.id,
            budgetId: '',
            type: 'income' as 'income' | 'expenditure',
            name: cat.name,
            budgetAmount: cat.budgetAmount,
            actualAmount: cat.actualAmount,
            allocatedAmount: cat.budgetAmount,
            spentAmount: 0,
            remainingAmount: cat.budgetAmount,
            approvalThreshold: 1000,
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          ...budgetForm.expenditureCategories.map(cat => ({
            id: cat.id,
            budgetId: '',
            type: 'expenditure' as 'income' | 'expenditure',
            name: cat.name,
            budgetAmount: cat.budgetAmount,
            actualAmount: cat.actualAmount,
            allocatedAmount: cat.budgetAmount,
            spentAmount: 0,
            remainingAmount: cat.budgetAmount,
            approvalThreshold: 1000,
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        ],
        totalAmount: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        totalIncome: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        totalExpenditure: budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        netBudget: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0) - 
                   budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        allocatedAmount: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        spentAmount: 0,
        remainingAmount: budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
        createdBy: currentUser?.id || ''
      }

      if (budget) {
        await budgetService.updateBudget(budget.id, newBudget)
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Success', 
          message: 'Budget updated successfully!', 
          type: 'success' 
        })
      } else {
        const createdBudget = await budgetService.createBudget(newBudget)
        console.log('Budget created:', createdBudget)
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Success', 
          message: 'Budget created successfully! Note: If Firebase permissions are not set up, this is saved as mock data.', 
          type: 'success' 
        })
      }
      
      setShowBudgetSetup(false)
      await loadFinancialData()
    } catch (error) {
      console.error('Error saving budget:', error)
      
      let errorMessage = 'Error saving budget'
      if (error instanceof Error) {
        if (error.message.includes('permissions')) {
          errorMessage = 'Firebase permissions error. Budget saved as mock data for development. Please deploy Firebase rules to fix this.'
        } else if (error.message.includes('flats')) {
          errorMessage = 'No flats found for this building. You may need to add flats first, but budget creation can still proceed.'
        } else {
          errorMessage = `Error saving budget: ${error.message}`
        }
      }
      
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Error', 
        message: errorMessage, 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const createSampleFlats = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      
      const sampleFlatsData = [
        {
          flatNumber: '1A',
          buildingId: selectedBuildingId,
          floor: 1,
          buildingBlock: 'A',
          bedrooms: 2,
          bathrooms: 1,
          areaSqFt: 750,
          groundRent: 250,
          groundRentPerSqFt: 0.33,
          groundRentFrequency: PaymentFrequency.ANNUALLY,
          maintenanceCharge: 187.50,
          maintenanceChargePerSqFt: 2.50,
          maintenanceFrequency: PaymentFrequency.QUARTERLY,
          status: 'Occupied',
          notes: 'Sample flat for testing service charges'
        },
        {
          flatNumber: '1B',
          buildingId: selectedBuildingId,
          floor: 1,
          buildingBlock: 'A',
          bedrooms: 1,
          bathrooms: 1,
          areaSqFt: 550,
          groundRent: 200,
          groundRentPerSqFt: 0.36,
          groundRentFrequency: PaymentFrequency.ANNUALLY,
          maintenanceCharge: 137.50,
          maintenanceChargePerSqFt: 2.50,
          maintenanceFrequency: PaymentFrequency.QUARTERLY,
          status: 'Occupied',
          notes: 'Sample flat for testing service charges'
        },
        {
          flatNumber: '2A',
          buildingId: selectedBuildingId,
          floor: 2,
          buildingBlock: 'A',
          bedrooms: 2,
          bathrooms: 2,
          areaSqFt: 800,
          groundRent: 275,
          groundRentPerSqFt: 0.34,
          groundRentFrequency: PaymentFrequency.ANNUALLY,
          maintenanceCharge: 200.00,
          maintenanceChargePerSqFt: 2.50,
          maintenanceFrequency: PaymentFrequency.QUARTERLY,
          status: 'Occupied',
          notes: 'Sample flat for testing service charges'
        },
        {
          flatNumber: '2B',
          buildingId: selectedBuildingId,
          floor: 2,
          buildingBlock: 'A',
          bedrooms: 1,
          bathrooms: 1,
          areaSqFt: 600,
          groundRent: 225,
          groundRentPerSqFt: 0.38,
          groundRentFrequency: PaymentFrequency.ANNUALLY,
          maintenanceCharge: 150.00,
          maintenanceChargePerSqFt: 2.50,
          maintenanceFrequency: PaymentFrequency.QUARTERLY,
          status: 'Occupied',
          notes: 'Sample flat for testing service charges'
        },
        {
          flatNumber: '3A',
          buildingId: selectedBuildingId,
          floor: 3,
          buildingBlock: 'A',
          bedrooms: 3,
          bathrooms: 2,
          areaSqFt: 950,
          groundRent: 300,
          groundRentPerSqFt: 0.32,
          groundRentFrequency: PaymentFrequency.ANNUALLY,
          maintenanceCharge: 237.50,
          maintenanceChargePerSqFt: 2.50,
          maintenanceFrequency: PaymentFrequency.QUARTERLY,
          status: 'Occupied',
          notes: 'Sample flat for testing service charges'
        }
      ]
      
      try {
        // Try to create flats in Firebase first
        const { createFlat } = await import('../services/flatService')
        const createdFlats = await Promise.all(
          sampleFlatsData.map(flatData => createFlat(flatData))
        )
        
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Success', 
          message: `Created ${createdFlats.length} sample flats in Firebase for testing service charges`, 
          type: 'success' 
        })
        
      } catch (firebaseError) {
        console.warn('Firebase flat creation failed, using mock data fallback:', firebaseError)
        
        // Fallback: Create mock flats data in memory
        const mockFlats = sampleFlatsData.map((flatData, index) => ({
          id: `mock-flat-${index + 1}`,
          ...flatData,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
        
        // Store in localStorage as fallback
        const existingMockFlats = JSON.parse(localStorage.getItem('mockFlats') || '[]')
        const updatedMockFlats = [...existingMockFlats, ...mockFlats]
        localStorage.setItem('mockFlats', JSON.stringify(updatedMockFlats))
        
        // Update the flats state directly
        setFlats(mockFlats)
        
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Success', 
          message: `Created ${mockFlats.length} sample flats (mock data) for testing service charges`, 
          type: 'success' 
        })
      }
      
      // Reload financial data to include the new flats
      await loadFinancialData()
      
    } catch (error) {
      console.error('Error creating sample flats:', error)
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Error', 
        message: `Failed to create sample flats: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      })
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

  const getBudgetUtilization = (budgetAmount: number, actualAmount: number) => {
    return budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0
  }

  const getBudgetUtilizationColor = (percentage: number) => {
    return percentage > 90 ? 'text-red-600' : percentage > 70 ? 'text-yellow-600' : 'text-success-600'
  }

  // Service Charges handlers
  const handleGenerateDemands = async () => {
    if (!selectedBuildingId) {
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Please select a building first', type: 'error' })
      return
    }

    // Check if flats exist, if not, offer to create sample flats
    if (!flats.length) {
      const shouldCreateSampleFlats = window.confirm(
        'No flats found for this building. Would you like to create some sample flats for testing service charges?\n\n' +
        'This will create 5 sample flats (1A, 1B, 2A, 2B, 3A) with typical UK property details.'
      )
      
      if (shouldCreateSampleFlats) {
        await createSampleFlats()
        return // Exit and let user try again after flats are created
      } else {
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Info', 
          message: 'Service charges require flats to be associated with the building. Please add flats first or create sample flats.', 
          type: 'info' 
        })
        return
      }
    }

    try {
      setLoading(true)
      const rate = 2.50 // £2.50 per sq ft per quarter
      
      console.log('Generating service charge demands for:', {
        buildingId: selectedBuildingId,
        quarter: selectedQuarter,
        rate,
        flatsCount: flats.length
      })
      
      const demands = await generateServiceChargeDemands(selectedBuildingId, selectedQuarter, rate, flats)
      
      console.log('Generated demands:', demands)
      
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Success', 
        message: `Generated ${demands.length} service charge demands for ${selectedQuarter}`, 
        type: 'success' 
      })
      
      // Force refresh the service charges data
      console.log('Refreshing financial data...')
      await loadFinancialData()
      
      // Additional direct refresh of service charges
      try {
        const refreshedDemands = await getServiceChargeDemands(selectedBuildingId)
        console.log('Refreshed service charges:', refreshedDemands)
        setServiceCharges(refreshedDemands)
      } catch (refreshError) {
        console.warn('Failed to refresh service charges, using fallback:', refreshError)
        // If Firebase fails, try to get from localStorage as fallback
        const mockDemands = JSON.parse(localStorage.getItem('mockServiceCharges') || '[]')
        const buildingMockDemands = mockDemands.filter((demand: any) => demand.buildingId === selectedBuildingId)
        
        console.log('All mock demands:', mockDemands)
        console.log('Filtered mock demands for building', selectedBuildingId, ':', buildingMockDemands)
        
        if (buildingMockDemands.length > 0) {
          setServiceCharges(buildingMockDemands)
          console.log('Using filtered mock service charges from localStorage:', buildingMockDemands)
        } else if (mockDemands.length > 0) {
          // If no building-specific demands found, but we have demands, show all as fallback
          console.log('No building-specific demands found, showing all mock demands as fallback')
          setServiceCharges(mockDemands)
        } else {
          console.log('No mock service charges found at all')
          setServiceCharges([])
        }
      }
      
    } catch (error) {
      console.error('Error generating demands:', error)
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Error', 
        message: `Failed to generate service charge demands: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = (demand: ServiceChargeDemand) => {
    setSelectedDemand(demand)
    setPaymentAmount('')
    setShowPaymentModal(true)
  }

  const handleViewDemandDetails = (demand: ServiceChargeDemand) => {
    setSelectedDemand(demand)
    setShowDemandDetails(true)
  }

  const handleSendReminder = async (demand: ServiceChargeDemand) => {
    try {
      setLoading(true)
      await sendReminder(demand.id)
      addNotification({ userId: currentUser?.id || '', title: 'Success', message: `Reminder sent to ${demand.residentName}`, type: 'success' })
      await loadFinancialData()
    } catch (error) {
      console.error('Error sending reminder:', error)
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Failed to send reminder', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPayment = async () => {
    if (!selectedDemand || !paymentAmount) return

    try {
      setLoading(true)
      const amount = parseFloat(paymentAmount)
      const newPaidAmount = (selectedDemand.amountPaid || 0) + amount
      const newOutstandingAmount = selectedDemand.totalAmountDue - newPaidAmount
      
      const status = newOutstandingAmount <= 0 ? ServiceChargeDemandStatus.PAID : 
                    newPaidAmount > 0 ? ServiceChargeDemandStatus.PARTIALLY_PAID : ServiceChargeDemandStatus.ISSUED

      await updateServiceChargeDemand(selectedDemand.id, {
        status: status,
        amountPaid: newPaidAmount,
        outstandingAmount: Math.max(0, newOutstandingAmount),
        paymentHistory: [...(selectedDemand.paymentHistory || []), {
          paymentId: `payment-${Date.now()}`,
          paymentDate: paymentDate,
          amount: parseFloat(paymentAmount),
          method: PaymentMethod.BANK_TRANSFER,
          reference: `PAY-${Date.now()}`,
          recordedByUid: currentUser?.id || '',
          recordedAt: new Date()
        } as PaymentRecord]
      })

      addNotification({ userId: currentUser?.id || '', title: 'Success', message: 'Payment recorded successfully!', type: 'success' })
      setShowPaymentModal(false)
      setSelectedDemand(null)
      setPaymentAmount('')
      await loadFinancialData()
    } catch (error) {
      console.error('Error recording payment:', error)
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Failed to record payment', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter">Financial Management</h1>
            <p className="text-gray-600 font-inter">Manage budgets, service charges, invoices, and financial reports</p>
          </div>
        </div>

      {/* Financial Summary Cards */}
{financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Total Income</p>
                <p className="text-2xl font-bold text-success-600 font-inter">
                  {formatCurrency(financialSummary.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success-600" />
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Total Expenditure</p>
                <p className="text-2xl font-bold text-red-600 font-inter">
                  {formatCurrency(financialSummary.totalExpenditure)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Net Position</p>
                <p className={`text-2xl font-bold font-inter ${
                  financialSummary.netPosition >= 0 ? 'text-success-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financialSummary.netPosition)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary-600" />
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-inter">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600 font-inter">
                  {formatCurrency(financialSummary?.outstanding || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'budget', name: 'Budget', icon: BarChart3 },
              { id: 'demands', name: 'Service Charges', icon: FileText },
              { id: 'invoices', name: 'Invoices', icon: FileText },
              { id: 'reports', name: 'Reports', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm font-inter ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
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
                <h2 className="text-lg font-semibold text-neutral-900 font-inter">Budget Management</h2>
                <div className="flex items-center space-x-3">
                  {budget && (
                    <button
                      onClick={() => setBudgetLocked(!budgetLocked)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-inter ${
                        budgetLocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-success-100 text-success-700 hover:bg-success-200'
                      }`}
                    >
                      {budgetLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      <span>{budgetLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                  )}
<Button onClick={() => setShowBudgetSetup(true)} leftIcon={<Plus className="h-4 w-4" />}>
                    {budget ? 'Edit Budget' : 'Create Budget'}
                  </Button>
                </div>
              </div>

              {budget ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                      <h3 className="font-medium text-success-900 font-inter">Total Income Budget</h3>
                      <span className="text-2xl font-bold text-success-600">
                        £{(budget.totalIncome || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 font-inter">Total Expenditure Budget</h3>
                      <span className="text-2xl font-bold text-red-600">
                        £{(budget.totalExpenditure || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className={`border rounded-lg p-4 ${
                      (budget?.netBudget || 0) >= 0 
                        ? 'bg-success-50 border-success-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <h3 className="font-medium text-neutral-900 font-inter">
                        Net Budget
                      </h3>
                      <span className={`text-sm font-medium ${
                        (budget?.netBudget ?? 0) >= 0 ? 'text-success-600' : 'text-red-600'
                      }`}>
                        £{(budget?.netBudget ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 font-inter">No Budget Set</h3>
                  <p className="text-gray-600 font-inter">Create a budget to start managing your building's finances</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'demands' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 font-inter">Service Charge Management</h2>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
                  >
                    <option value="Q1-2024">Q1 2024 (Apr-Jun)</option>
                    <option value="Q2-2024">Q2 2024 (Jul-Sep)</option>
                    <option value="Q3-2024">Q3 2024 (Oct-Dec)</option>
                    <option value="Q4-2024">Q4 2024 (Jan-Mar)</option>
                  </select>
<Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      // Clear all mock data and restart
                      localStorage.removeItem('mockFlats')
                      localStorage.removeItem('mockServiceCharges')
                      setFlats([])
                      setServiceCharges([])
                      console.log('Cleared all mock data - ready for fresh start')
                      addNotification({ 
                        userId: currentUser?.id || '', 
                        title: 'Info', 
                        message: 'Cleared all mock data. You can now create fresh sample flats and service charges.', 
                        type: 'info' 
                      })
                    }}
                  >
                    Clear Data
                  </Button>
<Button onClick={handleGenerateDemands} disabled={loading || !selectedBuildingId} leftIcon={<Plus className="h-4 w-4" />}>
                    Generate Demands
                  </Button>
                </div>
              </div>

              {/* Service Charges Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 font-inter">Total Demands</h3>
                  <p className="text-2xl font-bold text-primary-600 font-inter">{serviceCharges.length}</p>
                </div>
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <h3 className="font-medium text-success-900 font-inter">Total Amount</h3>
                  <p className="text-2xl font-bold text-success-600 font-inter">
                    {formatCurrency(serviceCharges.reduce((sum, d) => sum + (d.totalAmountDue || 0), 0))}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 font-inter">Outstanding</h3>
                  <p className="text-2xl font-bold text-yellow-600 font-inter">
                    {formatCurrency(serviceCharges.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0))}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 font-inter">Overdue</h3>
                  <p className="text-2xl font-bold text-red-600 font-inter">
                    {serviceCharges.filter(sc => sc.status === ServiceChargeDemandStatus.ISSUED || sc.status === ServiceChargeDemandStatus.PARTIALLY_PAID).length}
                  </p>
                </div>
              </div>

              {/* Demands Table */}
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 font-inter">Service Charge Demands - {selectedQuarter}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Flat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Resident</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Amount Due</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Outstanding</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceCharges.map((demand) => (
                        <tr key={demand.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 font-inter">
                            {demand.flatNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                            {demand.residentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                            {formatCurrency(demand.totalAmountDue || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                            {formatCurrency(demand.outstandingAmount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                            {new Date(demand.dueDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${
                              demand.status === ServiceChargeDemandStatus.PAID
                                ? 'bg-success-100 text-success-800'
                                : demand.status === ServiceChargeDemandStatus.PARTIALLY_PAID
                                ? 'bg-yellow-100 text-yellow-800'
                                : demand.status === ServiceChargeDemandStatus.OVERDUE
                                ? 'bg-red-100 text-red-800'
                                : 'bg-neutral-100 text-gray-800'
                            }`}>
                              {(demand.status === ServiceChargeDemandStatus.ISSUED || demand.status === ServiceChargeDemandStatus.PARTIALLY_PAID) && new Date(demand.dueDate) < new Date() ? 'Overdue' : demand.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDemandDetails(demand)}
                                className="text-primary-600 hover:text-blue-800 font-inter"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {demand.status !== 'Paid' && (
                                <button
                                  onClick={() => handleRecordPayment(demand)}
                                  className="text-success-600 hover:text-success-800 font-inter"
                                  title="Record Payment"
                                >
                                  <CreditCard className="h-4 w-4" />
                                </button>
                              )}
                              {demand.status !== 'Paid' && (
                                <button
                                  onClick={() => handleSendReminder(demand)}
                                  className="text-orange-600 hover:text-orange-800 font-inter"
                                  title="Send Reminder"
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {serviceCharges.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 font-inter">No Service Charge Demands</h3>
                      <p className="text-gray-600 font-inter">Generate demands for {selectedQuarter} to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 font-inter">Invoices</h3>
              <p className="text-gray-600 font-inter">Invoice management features will be available soon</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 font-inter">Financial Reports</h3>
              <p className="text-gray-600 font-inter">Financial reporting features will be available soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Setup Modal */}
      {showBudgetSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal" style={{ zIndex: 1400 }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 font-inter">
                    {budget ? 'Edit Budget' : 'Create New Budget'}
                  </h2>
                  <p className="text-sm text-gray-600 font-inter mt-1">
                    Building: {selectedBuilding?.name || 'No building selected'}
                  </p>
                </div>
<Button variant="ghost" size="sm" onClick={() => setShowBudgetSetup(false)} aria-label="Close budget modal">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <form onSubmit={handleBudgetSubmit} className="space-y-6">
                {/* Building Selection Warning */}
                {!selectedBuildingId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="text-yellow-600 mr-3">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800 font-inter">No Building Selected</h3>
                        <p className="text-sm text-yellow-700 font-inter mt-1">
                          Please select a building from the dropdown above before creating a budget.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Budget Year and Financial Year Start */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">
                      Budget Year
                    </label>
<Input
                      type="number"
                      value={budgetForm.year}
                      onChange={(e) => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">
                      Financial Year Start
                    </label>
<Input
                      type="date"
                      value={budgetForm.financialYearStart.toISOString().split('T')[0]}
                      onChange={(e) => setBudgetForm({ ...budgetForm, financialYearStart: new Date(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {/* Service Charge and Ground Rent Rates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">
                      Service Charge Rate (£ per sq ft)
                    </label>
<Input
                      type="number"
                      step="0.01"
                      value={budgetForm.serviceChargeRate || 0}
                      onChange={(e) => setBudgetForm({ ...budgetForm, serviceChargeRate: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">
                      Ground Rent Rate (£ per sq ft)
                    </label>
<Input
                      type="number"
                      step="0.01"
                      value={budgetForm.groundRentRate}
                      onChange={(e) => setBudgetForm({ ...budgetForm, groundRentRate: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {/* Income Categories */}
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4 font-inter">Income Categories</h3>
                  <div className="space-y-4">
                    {budgetForm.incomeCategories.map((category, index) => (
                      <div key={category.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                            Category Name
                          </label>
<Input
                            type="text"
                            value={category.name}
                            onChange={(e) => {
                              const updated = [...budgetForm.incomeCategories]
                              updated[index] = { ...updated[index], name: e.target.value }
                              setBudgetForm({ ...budgetForm, incomeCategories: updated })
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                            Budget Amount (£)
                          </label>
<Input
                            type="number"
                            step="0.01"
                            value={category.budgetAmount}
                            onChange={(e) => {
                              const updated = [...budgetForm.incomeCategories]
                              updated[index] = { ...updated[index], budgetAmount: parseFloat(e.target.value) || 0 }
                              setBudgetForm({ ...budgetForm, incomeCategories: updated })
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                            Actual Amount (£)
                          </label>
<Input
                            type="number"
                            step="0.01"
                            value={category.actualAmount}
                            onChange={(e) => {
                              const updated = [...budgetForm.incomeCategories]
                              updated[index] = { ...updated[index], actualAmount: parseFloat(e.target.value) || 0 }
                              setBudgetForm({ ...budgetForm, incomeCategories: updated })
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenditure Categories */}
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-4 font-inter">Expenditure Categories</h3>
                  <div className="space-y-4">
                    {budgetForm.expenditureCategories.map((category, index) => (
                      <div key={category.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                            Category Name
                          </label>
<Input
                            type="text"
                            value={category.name}
                            onChange={(e) => {
                              const updated = [...budgetForm.expenditureCategories]
                              updated[index] = { ...updated[index], name: e.target.value }
                              setBudgetForm({ ...budgetForm, expenditureCategories: updated })
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                            Budget Amount (£)
                          </label>
<Input
                            type="number"
                            step="0.01"
                            value={category.budgetAmount}
                            onChange={(e) => {
                              const updated = [...budgetForm.expenditureCategories]
                              updated[index] = { ...updated[index], budgetAmount: parseFloat(e.target.value) || 0 }
                              setBudgetForm({ ...budgetForm, expenditureCategories: updated })
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1 font-inter">
                            Actual Amount (£)
                          </label>
<Input
                            type="number"
                            step="0.01"
                            value={category.actualAmount}
                            onChange={(e) => {
                              const updated = [...budgetForm.expenditureCategories]
                              updated[index] = { ...updated[index], actualAmount: parseFloat(e.target.value) || 0 }
                              setBudgetForm({ ...budgetForm, expenditureCategories: updated })
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Summary */}
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-neutral-900 mb-4 font-inter">Budget Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-inter">Total Income</p>
                      <p className="text-xl font-semibold text-success-600 font-inter">
                        £{budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-inter">Total Expenditure</p>
                      <p className="text-xl font-semibold text-red-600 font-inter">
                        £{budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-inter">Net Budget</p>
                      <p className={`text-xl font-semibold font-inter ${
                        (budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0) - 
                         budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0)) >= 0
                          ? 'text-success-600' : 'text-red-600'
                      }`}>
                        £{(budgetForm.incomeCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0) - 
                           budgetForm.expenditureCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
<div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
                  <Button variant="secondary" type="button" onClick={() => setShowBudgetSetup(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !selectedBuildingId} loading={loading}>
                    {budget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
{showPaymentModal && selectedDemand && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedDemand(null)
            setPaymentAmount('')
          }}
          title="Record Payment"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 font-inter">Flat: {selectedDemand.flatNumber}</p>
              <p className="text-sm text-gray-600 font-inter">Resident: {selectedDemand.residentName}</p>
              <p className="text-sm text-gray-600 font-inter">
                Outstanding: {formatCurrency(selectedDemand.outstandingAmount || 0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">
                Payment Amount (£)
              </label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                max={selectedDemand.outstandingAmount || 0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">
                Payment Date
              </label>
              <Input
                type="date"
                value={paymentDate.toISOString().split('T')[0]}
                onChange={(e) => setPaymentDate(new Date(e.target.value))}
              />
            </div>

            <ModalFooter>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedDemand(null)
                  setPaymentAmount('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitPayment} disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || loading} loading={loading}>
                Record Payment
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* Demand Details Modal */}
{showDemandDetails && selectedDemand && (
        <Modal
          isOpen={showDemandDetails}
          onClose={() => {
            setShowDemandDetails(false)
            setSelectedDemand(null)
          }}
          title="Service Charge Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 font-inter">Flat Number</h3>
                <p className="text-lg font-semibold text-neutral-900 font-inter">{selectedDemand.flatNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 font-inter">Resident</h3>
                <p className="text-lg font-semibold text-neutral-900 font-inter">{selectedDemand.residentName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 font-inter">Quarter</h3>
                <p className="text-lg font-semibold text-neutral-900 font-inter">{selectedDemand.financialQuarterDisplayString}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 font-inter">Status</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${
                  selectedDemand.status === ServiceChargeDemandStatus.PAID
                    ? 'bg-success-100 text-success-800'
                    : selectedDemand.status === ServiceChargeDemandStatus.PARTIALLY_PAID
                    ? 'bg-yellow-100 text-yellow-800'
                    : selectedDemand.status === ServiceChargeDemandStatus.OVERDUE
                    ? 'bg-red-100 text-red-800'
                    : 'bg-neutral-100 text-gray-800'
                }`}>
                  {selectedDemand.status}
                </span>
              </div>
            </div>

            {/* Financial Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-neutral-900 mb-3 font-inter">Financial Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 font-inter">Total Amount Due</h4>
                  <p className="text-xl font-bold text-primary-600 font-inter">
                    {formatCurrency(selectedDemand.totalAmountDue || 0)}
                  </p>
                </div>
                <div className="bg-success-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-success-900 font-inter">Amount Paid</h4>
                  <p className="text-xl font-bold text-success-600 font-inter">
                    {formatCurrency(selectedDemand.amountPaid || 0)}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900 font-inter">Outstanding</h4>
                  <p className="text-xl font-bold text-red-600 font-inter">
                    {formatCurrency(selectedDemand.outstandingAmount || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {selectedDemand.paymentHistory && selectedDemand.paymentHistory.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-neutral-900 mb-3 font-inter">Payment History</h3>
                <div className="space-y-2">
                  {selectedDemand.paymentHistory.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900 font-inter">
                          {formatCurrency(payment.amount)}
                        </p>
                        <div className="text-xs text-neutral-500">Issued: {selectedDemand.issuedDate ? new Date(selectedDemand.issuedDate).toLocaleDateString() : 'N/A'}</div>
                        <p className="text-sm text-gray-600 font-inter">
                          {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-inter">{payment.method}</p>
                        <div className="text-xs text-neutral-500">{selectedDemand.financialQuarterDisplayString}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Dates */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-neutral-900 mb-3 font-inter">Important Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-500 font-inter">Issue Date</h4>
                  <p className="text-neutral-900 font-inter">
                    {new Date(selectedDemand.issuedDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500 font-inter">Due Date</h4>
                  <p className={`font-inter ${
                    new Date(selectedDemand.dueDate) < new Date() && selectedDemand.status !== ServiceChargeDemandStatus.PAID
                      ? 'text-red-600 font-semibold'
                      : 'text-neutral-900'
                  }`}>
                    {new Date(selectedDemand.dueDate).toLocaleDateString('en-GB')}
                    {new Date(selectedDemand.dueDate) < new Date() && selectedDemand.status !== ServiceChargeDemandStatus.PAID && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        OVERDUE
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDemandDetails(false)
                  setSelectedDemand(null)
                }}
              >
                Close
              </Button>
              {selectedDemand.status !== ServiceChargeDemandStatus.PAID && (
                <Button
                  onClick={() => {
                    setShowDemandDetails(false)
                    handleRecordPayment(selectedDemand)
                  }}
                >
                  Record Payment
                </Button>
              )}
            </ModalFooter>
          </div>
        </Modal>
      )}
      </div>
    </div>
  )
}

export default Finances
