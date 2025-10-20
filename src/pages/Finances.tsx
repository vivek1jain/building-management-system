import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useBuilding } from '../contexts/BuildingContext';
import { useIsMobile } from '../hooks/useMediaQuery';
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
import { FlatLedgerModal } from '../components/FlatLedger';
import { financialIntegrationService } from '../services/financialIntegrationService';

type SortField = 'flatNumber' | 'residentName' | 'totalAmountDue' | 'outstandingAmount' | 'dueDate' | 'status'
type SortDirection = 'asc' | 'desc'
// Note: Financial summary now uses real Firebase data instead of mock data
import { 
  getServiceChargeDemands,
  generateServiceChargeDemands,
  updateServiceChargeDemand,
  sendReminder,

} from '../services/serviceChargeService'
import { getInvoicesByBuilding } from '../services/invoiceService'
import { getFlatsByBuilding } from '../services/flatService'
import { expenseService } from '../services/expenseService'
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
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Receipt,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Users,
  Search,
  Filter,
  BookOpen,
  Info
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Modal, ModalHeader, ModalFooter, Dropdown, DropdownOption, PageLoading, SectionLoading, TabLoadingSkeleton, TableRowSkeleton, WidgetSkeleton } from '../components/UI'
import { ServiceChargePeriodDropdown } from '../components/ServiceCharges/ServiceChargePeriodDropdown'

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
  const isMobile = useIsMobile()

  
  // Core state
  const [activeTab, setActiveTab] = useState<'budget' | 'demands' | 'invoices' | 'expenses'>('expenses')
  const [loading, setLoading] = useState(false)
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // Financial data
  const [budget, setBudget] = useState<Budget | null>(null)
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeDemand[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [flats, setFlats] = useState<Flat[]>([])
  const [financialOverview, setFinancialOverview] = useState<any>(null)
  
  // Service Charges state
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDemandDetails, setShowDemandDetails] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<ServiceChargeDemand | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set())
  
  // Flat Ledger state
  const [showFlatLedger, setShowFlatLedger] = useState(false)
  const [selectedFlatForLedger, setSelectedFlatForLedger] = useState<{
    flatId: string
    flatNumber: string
    residentName: string
  } | null>(null)
  
  
  // UI state
  const [showBudgetSetup, setShowBudgetSetup] = useState(false)
  const [budgetLocked, setBudgetLocked] = useState(false)
  const [showExpenseHelpModal, setShowExpenseHelpModal] = useState(false)
  
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
        outstanding: 0,
        forecastExpenses: 0,
        adjustedCashPosition: 0
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
    
    // Calculate forecast expenses (expenses in forecast status)
    const forecastExpenses = expenses
      .filter(expense => expense.status === 'forecast')
      .reduce((sum, expense) => sum + (expense.amount || 0), 0)
    
    // Calculate adjusted cash position (current cash position minus committed forecast expenses)
    const adjustedCashPosition = netPosition - forecastExpenses
    
    return {
      totalIncome,
      totalExpenditure,
      netPosition,
      outstanding,
      forecastExpenses,
      adjustedCashPosition
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
      console.log('Loading financial data for building:', selectedBuildingId)
      
      // Load data with individual error handling
      const results = await Promise.allSettled([
        budgetService.getBudgetsByBuilding(selectedBuildingId),
        getServiceChargeDemands(selectedBuildingId),
        getInvoicesByBuilding(selectedBuildingId),
        expenseService.getExpensesByBuilding(selectedBuildingId),
        getFlatsByBuilding(selectedBuildingId)
      ])
      
      const [budgetResult, demandsResult, invoicesResult, expensesResult, flatsResult] = results
      
      // Process budget data
      if (budgetResult.status === 'fulfilled') {
        setBudget(budgetResult.value.length > 0 ? budgetResult.value[0] : null)
        console.log('✅ Budget data loaded:', budgetResult.value.length, 'budgets')
      } else {
        console.error('❌ Budget loading failed:', budgetResult.reason)
        setBudget(null)
      }
      
      // Process service charges
      if (demandsResult.status === 'fulfilled') {
        setServiceCharges(demandsResult.value)
        console.log('✅ Service charges loaded:', demandsResult.value.length, 'demands')
      } else {
        console.error('❌ Service charges loading failed:', demandsResult.reason)
        setServiceCharges([])
      }
      
      // Process invoices
      if (invoicesResult.status === 'fulfilled') {
        setInvoices(invoicesResult.value)
        console.log('✅ Invoices loaded:', invoicesResult.value.length, 'invoices')
      } else {
        console.error('❌ Invoices loading failed:', invoicesResult.reason)
        setInvoices([])
      }
      
      // Process expenses
      if (expensesResult.status === 'fulfilled') {
        setExpenses(expensesResult.value)
        console.log('✅ Expenses loaded:', expensesResult.value.length, 'expenses')
      } else {
        console.error('❌ Expenses loading failed:', expensesResult.reason)
        setExpenses([])
      }
      
      // Process flats
      if (flatsResult.status === 'fulfilled') {
        setFlats(flatsResult.value)
        console.log('✅ Flats loaded:', flatsResult.value.length, 'flats')
      } else {
        console.error('❌ Flats loading failed:', flatsResult.reason)
        setFlats([])
      }

      // Load financial overview
      try {
        const overview = await financialIntegrationService.getFinancialOverview(selectedBuildingId)
        setFinancialOverview(overview)
        console.log('✅ Financial overview loaded:', overview)
      } catch (error) {
        console.error('❌ Financial overview loading failed:', error)
        setFinancialOverview(null)
      }
      
      // Check if any critical data failed to load
      const failedServices = results.filter(result => result.status === 'rejected').length
      if (failedServices > 0) {
        console.warn(`${failedServices} financial data services failed to load`)
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Partial Load', 
          message: `Financial data partially loaded. ${failedServices} services had errors.`, 
          type: 'warning' 
        })
      } else {
        console.log('✅ All financial data loaded successfully')
      }
      
    } catch (error) {
      console.error('Error in loadFinancialData:', error)
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Error', 
        message: `Error loading financial data: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Group service charges by financial quarter/period
  const groupedServiceCharges = useMemo(() => {
    const groups: Record<string, ServiceChargeDemand[]> = {}
    
    serviceCharges.forEach(charge => {
      const period = charge.financialQuarterDisplayString || 'Unknown Period'
      if (!groups[period]) {
        groups[period] = []
      }
      groups[period].push(charge)
    })
    
    // Sort each group internally
    Object.keys(groups).forEach(period => {
      groups[period].sort((a, b) => {
        if (sortField) {
          let aValue: any
          let bValue: any

          switch (sortField) {
            case 'flatNumber':
              aValue = a.flatNumber?.toLowerCase() || ''
              bValue = b.flatNumber?.toLowerCase() || ''
              break
            case 'residentName':
              aValue = a.residentName?.toLowerCase() || ''
              bValue = b.residentName?.toLowerCase() || ''
              break
            case 'totalAmountDue':
              aValue = a.totalAmountDue || 0
              bValue = b.totalAmountDue || 0
              break
            case 'outstandingAmount':
              aValue = a.outstandingAmount || 0
              bValue = b.outstandingAmount || 0
              break
            case 'dueDate':
              aValue = new Date(a.dueDate).getTime()
              bValue = new Date(b.dueDate).getTime()
              break
            case 'status':
              aValue = a.status || ''
              bValue = b.status || ''
              break
            default:
              return 0
          }

          if (aValue < bValue) {
            return sortDirection === 'asc' ? -1 : 1
          }
          if (aValue > bValue) {
            return sortDirection === 'asc' ? 1 : -1
          }
          return 0
        }
        // Default sort by flat number if no sort field specified
        return (a.flatNumber || '').localeCompare(b.flatNumber || '')
      })
    })
    
    // Sort periods chronologically (most recent first)
    const sortedPeriods = Object.keys(groups).sort((a, b) => {
      // Try to parse periods to determine chronological order
      // Handle both "Q1 2024" and "2024-Q1" formats
      const parseQuarter = (period: string) => {
        if (period.includes(' ')) {
          const [q, year] = period.split(' ')
          return {
            year: parseInt(year) || 0,
            quarter: parseInt(q.substring(1)) || 0
          }
        } else if (period.includes('-Q')) {
          const [year, q] = period.split('-Q')
          return {
            year: parseInt(year) || 0,
            quarter: parseInt(q) || 0
          }
        }
        return { year: 0, quarter: 0 }
      }
      
      const periodA = parseQuarter(a)
      const periodB = parseQuarter(b)
      
      // Sort by year first (descending), then by quarter (descending)
      if (periodB.year !== periodA.year) {
        return periodB.year - periodA.year
      }
      return periodB.quarter - periodA.quarter
    })
    
    const result: Record<string, ServiceChargeDemand[]> = {}
    sortedPeriods.forEach(period => {
      result[period] = groups[period]
    })
    
    return result
  }, [serviceCharges, sortField, sortDirection])
  
  // Auto-expand periods on first load
  useEffect(() => {
    const periods = Object.keys(groupedServiceCharges)
    if (periods.length > 0 && expandedPeriods.size === 0) {
      // Expand the first (most recent) period by default
      setExpandedPeriods(new Set([periods[0]]))
    }
  }, [groupedServiceCharges])
  
  const togglePeriodExpansion = (period: string) => {
    const newExpanded = new Set(expandedPeriods)
    if (newExpanded.has(period)) {
      newExpanded.delete(period)
    } else {
      newExpanded.add(period)
    }
    setExpandedPeriods(newExpanded)
  }

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => {
    const isActive = sortField === field
    const isAsc = isActive && sortDirection === 'asc'
    const isDesc = isActive && sortDirection === 'desc'

    return (
      <th 
        className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter cursor-pointer hover:bg-neutral-200 transition-colors duration-200 select-none"
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSort(field)
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Sort by ${field} ${isActive ? (isAsc ? 'descending' : 'ascending') : 'ascending'}`}
      >
        <div className="flex items-center justify-between">
          <span>{children}</span>
          <div className="flex flex-col ml-2">
            <ArrowUp 
              className={`h-3 w-3 ${isAsc ? 'text-primary-600' : 'text-neutral-300'}`} 
            />
            <ArrowDown 
              className={`h-3 w-3 -mt-1 ${isDesc ? 'text-primary-600' : 'text-neutral-300'}`} 
            />
          </div>
        </div>
      </th>
    )
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
          message: 'Budget created successfully!', 
          type: 'success' 
        })
      }
      
      setShowBudgetSetup(false)
      await loadFinancialData()
    } catch (error) {
      console.error('Error saving budget:', error)
      
      let errorMessage = 'Error saving budget'
      if (error instanceof Error) {
        errorMessage = `Error saving budget: ${error.message}`
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
        console.error('Firebase flat creation failed:', firebaseError)
        
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Error', 
          message: `Failed to create sample flats: ${firebaseError instanceof Error ? firebaseError.message : 'Unknown error'}`, 
          type: 'error' 
        })
        return
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

  // Show comprehensive dialog for existing demands
  const showExistingDemandsDialog = (data: {
    period: string
    totalDemands: number
    paidCount: number
    partiallyPaidCount: number
    outstandingCount: number
    overdueCount: number
    existingDemands: ServiceChargeDemand[]
  }): Promise<'cancel' | 'send_reminders' | 'view_existing' | 'cancel_and_reissue' | 'create_duplicates'> => {
    return new Promise((resolve) => {
      const { period, totalDemands, paidCount, partiallyPaidCount, outstandingCount, overdueCount } = data
      
      let statusLines = []
      if (paidCount > 0) statusLines.push(`✅ ${paidCount} Paid`)
      if (partiallyPaidCount > 0) statusLines.push(`⚠️ ${partiallyPaidCount} Partially Paid`)
      if (outstandingCount > 0) statusLines.push(`❌ ${outstandingCount} Outstanding`)
      if (overdueCount > 0) statusLines.push(`🚨 ${overdueCount} Overdue`)
      
      const hasPayments = paidCount > 0 || partiallyPaidCount > 0
      const warningNote = hasPayments ? '\n⚠️ WARNING: Canceling will affect demands with existing payments!' : ''
      
      const actionOptions = [
        '1️⃣ Send Payment Reminders (to all outstanding)',
        '2️⃣ View & Manage Existing Demands', 
        `3️⃣ Cancel Current & Issue New Demands${hasPayments ? ' ⚠️' : ''}`,
        '4️⃣ Create Duplicate Demands (not recommended)',
        '5️⃣ Cancel'
      ]
      
      const message = `⚠️ Service Charges Already Exist for ${period}\n\n` +
        `Current Status (${totalDemands} demands):\n${statusLines.join('\n')}${warningNote}\n\n` +
        `What would you like to do?\n${actionOptions.join('\n')}\n\n` +
        `Enter 1, 2, 3, 4, or 5:`
      
      const userChoice = window.prompt(message)
      
      switch (userChoice?.trim()) {
        case '1':
          resolve('send_reminders')
          break
        case '2':
          resolve('view_existing')
          break
        case '3':
          resolve('cancel_and_reissue')
          break
        case '4':
          resolve('create_duplicates')
          break
        case '5':
        default:
          resolve('cancel')
          break
      }
    })
  }

  // Handle bulk reminders for outstanding demands
  const handleBulkReminders = async (demands: ServiceChargeDemand[]) => {
    const outstandingDemands = demands.filter(d => 
      d.status === ServiceChargeDemandStatus.ISSUED || 
      d.status === ServiceChargeDemandStatus.PARTIALLY_PAID
    )
    
    if (outstandingDemands.length === 0) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Info',
        message: 'No outstanding demands found to send reminders for.',
        type: 'info'
      })
      return
    }
    
    try {
      setLoading(true)
      let successCount = 0
      let failureCount = 0
      
      // Send reminders in batches to avoid overwhelming the system
      for (const demand of outstandingDemands) {
        try {
          await sendReminder(demand.id)
          successCount++
        } catch (error) {
          console.error(`Failed to send reminder for ${demand.flatNumber}:`, error)
          failureCount++
        }
      }
      
      if (successCount > 0) {
        addNotification({
          userId: currentUser?.id || '',
          title: 'Success',
          message: `Sent ${successCount} payment reminder${successCount === 1 ? '' : 's'} successfully${failureCount > 0 ? ` (${failureCount} failed)` : ''}.`,
          type: successCount === outstandingDemands.length ? 'success' : 'warning'
        })
      } else {
        addNotification({
          userId: currentUser?.id || '',
          title: 'Error',
          message: 'Failed to send any reminders. Please try again or send them individually.',
          type: 'error'
        })
      }
      
      // Refresh data to update reminder counts
      await loadFinancialData()
      
    } catch (error) {
      console.error('Error sending bulk reminders:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to send reminders. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Service Charges handlers
  const handleGenerateDemands = async () => {
    if (!selectedBuildingId) {
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Please select a building first', type: 'error' })
      return
    }
    
    if (!selectedPeriod) {
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Please select a period first', type: 'error' })
      return
    }

    // Check if demands already exist for this period
    const existingDemandsForPeriod = serviceCharges.filter(
      demand => demand.financialQuarterDisplayString === selectedPeriod
    )
    
    if (existingDemandsForPeriod.length > 0) {
      const paidCount = existingDemandsForPeriod.filter(d => d.status === ServiceChargeDemandStatus.PAID).length
      const partiallyPaidCount = existingDemandsForPeriod.filter(d => d.status === ServiceChargeDemandStatus.PARTIALLY_PAID).length
      const outstandingCount = existingDemandsForPeriod.length - paidCount - partiallyPaidCount
      const overdueCount = existingDemandsForPeriod.filter(d => 
        (d.status === ServiceChargeDemandStatus.ISSUED || d.status === ServiceChargeDemandStatus.PARTIALLY_PAID) &&
        new Date(d.dueDate) < new Date()
      ).length
      
      // Show comprehensive dialog
      const action = await showExistingDemandsDialog({
        period: selectedPeriod,
        totalDemands: existingDemandsForPeriod.length,
        paidCount,
        partiallyPaidCount,
        outstandingCount,
        overdueCount,
        existingDemands: existingDemandsForPeriod
      })
      
      switch (action) {
        case 'cancel':
          // Scroll to existing demands table
          const demandsSection = document.querySelector('[data-demands-section]')
          if (demandsSection) {
            demandsSection.scrollIntoView({ behavior: 'smooth' })
          }
          addNotification({ 
            userId: currentUser?.id || '', 
            title: 'Info', 
            message: 'Use the table below to manage existing demands for this period.', 
            type: 'info' 
          })
          return
          
        case 'send_reminders':
          await handleBulkReminders(existingDemandsForPeriod)
          return
          
        case 'view_existing':
          // Scroll to and expand the relevant period
          const newExpanded = new Set(expandedPeriods)
          newExpanded.add(selectedPeriod)
          setExpandedPeriods(newExpanded)
          
          const demandsSectionView = document.querySelector('[data-demands-section]')
          if (demandsSectionView) {
            demandsSectionView.scrollIntoView({ behavior: 'smooth' })
          }
          return
          
        case 'cancel_and_reissue':
          // Confirm the action if there are existing payments
          if (paidCount > 0 || partiallyPaidCount > 0) {
            const confirmCancel = window.confirm(
              `⚠️ WARNING: This will cancel ${existingDemandsForPeriod.length} existing demands including ${paidCount + partiallyPaidCount} with payments.\n\n` +
              `Are you absolutely sure you want to proceed?\n\n` +
              `This action cannot be undone and may cause payment reconciliation issues.`
            )
            
            if (!confirmCancel) {
              return
            }
          }
          
          // Cancel existing demands first
          try {
            setLoading(true)
            
            addNotification({
              userId: currentUser?.id || '',
              title: 'Info',
              message: `Canceling ${existingDemandsForPeriod.length} existing demands...`,
              type: 'info'
            })
            
            // Cancel all existing demands for this period
            const cancelPromises = existingDemandsForPeriod.map(demand => 
              updateServiceChargeDemand(demand.id, {
                status: ServiceChargeDemandStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy: currentUser?.id || '',
                cancelReason: 'Cancelled to issue replacement demands'
              })
            )
            
            await Promise.all(cancelPromises)
            
            addNotification({
              userId: currentUser?.id || '',
              title: 'Success',
              message: `Cancelled ${existingDemandsForPeriod.length} existing demands. Now issuing new demands...`,
              type: 'success'
            })
            
            // Refresh data to reflect cancellations
            await loadFinancialData()
            
            // Continue to generate new demands (break out of the switch)
          } catch (error) {
            console.error('Error cancelling existing demands:', error)
            addNotification({
              userId: currentUser?.id || '',
              title: 'Error',
              message: `Failed to cancel existing demands: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error'
            })
            setLoading(false)
            return
          }
          break
          
        case 'create_duplicates':
          // Continue with creation - user explicitly chose to create duplicates
          break
          
        default:
          return
      }
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
        period: selectedPeriod,
        rate,
        flatsCount: flats.length
      })
      
      const demands = await generateServiceChargeDemands(selectedBuildingId, selectedPeriod, rate, flats)
      
      console.log('Generated demands:', demands)
      
      addNotification({ 
        userId: currentUser?.id || '', 
        title: 'Success', 
        message: `Generated ${demands.length} service charge demands for selected period`, 
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
        console.error('Failed to refresh service charges:', refreshError)
        addNotification({ 
          userId: currentUser?.id || '', 
          title: 'Warning', 
          message: 'Service charges generated but failed to refresh data immediately. Please refresh the page.', 
          type: 'warning' 
        })
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

  // Show loading spinner while buildings or initial financial data are loading
  if (buildingsLoading || (loading && !budget && serviceCharges.length === 0 && invoices.length === 0 && expenses.length === 0)) {
    return <PageLoading message="Loading financial data..." />
  }

  // Tab configuration for consistent mobile/desktop rendering
  const financeTabs = [
    { id: 'expenses', name: 'Expenses', icon: Receipt },
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'demands', name: 'Service Charges', icon: FileText },
    { id: 'budget', name: 'Budget', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        isMobile ? 'py-2 space-y-3' : 'py-8 space-y-6'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter">Finances</h1>
            {!isMobile && (
              <p className="text-gray-600 font-inter">Manage budgets, service charges, invoices, and financial reports</p>
            )}
          </div>
        </div>


        {/* Tab Navigation */}
        <div className="border-b border-neutral-200">
          <nav className={`-mb-px flex ${isMobile ? 'justify-between px-4' : 'space-x-8'}`} aria-label="Tabs">
            {financeTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  } py-2 border-b-2 font-medium text-sm transition-colors font-inter flex items-center ${
                    isMobile ? 'min-w-[44px] justify-center' : 'px-1 gap-2'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!isMobile && <span>{tab.name}</span>}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
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

                  {/* Service Charge Impact on Budget */}
                  {financialOverview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Service Charge Impact on Budget
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900">Budgeted Income</h4>
                            <p className="text-xl font-bold text-blue-600">
                              £{financialOverview.budget.totalBudgeted.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-green-900">Actual Collections</h4>
                            <p className="text-xl font-bold text-green-600">
                              £{financialOverview.serviceCharges.collected.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-orange-900">Outstanding</h4>
                            <p className="text-xl font-bold text-orange-600">
                              £{financialOverview.serviceCharges.outstanding.toLocaleString()}
                            </p>
                          </div>
                          <div className={`p-4 rounded-lg ${
                            financialOverview.serviceCharges.collectionRate >= 90 
                              ? 'bg-green-50' 
                              : financialOverview.serviceCharges.collectionRate >= 70 
                              ? 'bg-yellow-50' 
                              : 'bg-red-50'
                          }`}>
                            <h4 className={`text-sm font-medium ${
                              financialOverview.serviceCharges.collectionRate >= 90 
                                ? 'text-green-900' 
                                : financialOverview.serviceCharges.collectionRate >= 70 
                                ? 'text-yellow-900' 
                                : 'text-red-900'
                            }`}>Collection Rate</h4>
                            <p className={`text-xl font-bold ${
                              financialOverview.serviceCharges.collectionRate >= 90 
                                ? 'text-green-600' 
                                : financialOverview.serviceCharges.collectionRate >= 70 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {financialOverview.serviceCharges.collectionRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Budget vs Actual Variance:
                            </span>
                            <span className={`font-bold ${
                              (financialOverview.serviceCharges.collected - financialOverview.budget.totalBudgeted) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              £{(financialOverview.serviceCharges.collected - financialOverview.budget.totalBudgeted).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                  <ServiceChargePeriodDropdown
                    value={selectedPeriod}
                    onChange={(value) => setSelectedPeriod(value)}
                    placeholder="Select period..."
                    className="min-w-[350px]"
                    existingDemands={serviceCharges}
                  />
                  <Button onClick={handleGenerateDemands} disabled={loading || !selectedBuildingId}>
                    Issue Demands
                  </Button>
                </div>
              </div>

              {/* Service Charges Summary */}
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'
              }`}>
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

              {/* Demands Accordion by Period */}
              <div data-demands-section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 font-inter">Service Charge Demands</h3>
                  {Object.keys(groupedServiceCharges).length > 1 && (
                    <p className="text-sm text-gray-600 font-inter mt-1">
                      Grouped by period • Click to expand/collapse periods
                    </p>
                  )}
                </div>
                
                {Object.keys(groupedServiceCharges).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 font-inter">No Service Charge Demands</h3>
                    <p className="text-gray-600 font-inter">Generate demands for the selected period to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {Object.entries(groupedServiceCharges).map(([period, demands], periodIndex) => {
                      const isExpanded = expandedPeriods.has(period)
                      const periodTotal = demands.reduce((sum, d) => sum + (d.totalAmountDue || 0), 0)
                      const periodOutstanding = demands.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0)
                      const periodPaid = demands.filter(d => d.status === ServiceChargeDemandStatus.PAID).length
                      const periodOverdue = demands.filter(d => 
                        (d.status === ServiceChargeDemandStatus.ISSUED || d.status === ServiceChargeDemandStatus.PARTIALLY_PAID) &&
                        new Date(d.dueDate) < new Date()
                      ).length
                      
                      return (
                        <div key={period} className="">
                          {/* Period Header */}
                          <div 
                            className="px-6 py-4 bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors duration-200 flex items-center justify-between"
                            onClick={() => togglePeriodExpansion(period)}
                          >
                            <div className="flex items-center space-x-3">
                              <ChevronDown 
                                className={`h-5 w-5 text-neutral-500 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                              <div>
                                <h4 className="text-lg font-semibold text-neutral-900 font-inter">{period}</h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm text-neutral-600 font-inter">
                                    {demands.length} demands • {formatCurrency(periodTotal)} total
                                  </span>
                                  {periodOutstanding > 0 && (
                                    <span className="text-sm text-orange-600 font-inter">
                                      {formatCurrency(periodOutstanding)} outstanding
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {periodPaid > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                  {periodPaid} paid
                                </span>
                              )}
                              {periodOverdue > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {periodOverdue} overdue
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Period Content */}
                          {isExpanded && (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                {periodIndex === 0 && (
                                  <thead className="bg-neutral-50">
                                    <tr>
                                      <SortableHeader field="flatNumber">Flat</SortableHeader>
                                      <SortableHeader field="residentName">Resident</SortableHeader>
                                      <SortableHeader field="totalAmountDue">Amount Due</SortableHeader>
                                      <SortableHeader field="outstandingAmount">Outstanding</SortableHeader>
                                      <SortableHeader field="dueDate">Due Date</SortableHeader>
                                      <SortableHeader field="status">Status</SortableHeader>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">Actions</th>
                                    </tr>
                                  </thead>
                                )}
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {demands.map((demand) => (
                                    <tr key={demand.id} className="hover:bg-neutral-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 font-inter">
                                        {demand.flatNumber}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                                        {demand.residentName}
                                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                            {demand.hasCreditApplied ? (
                              <div>
                                <div className="text-gray-500 line-through text-sm">
                                  {formatCurrency((demand.originalAmountBeforeCredit || demand.totalAmountDue) || 0)}
                                </div>
                                <div className="text-green-600 font-medium">
                                  {formatCurrency(demand.totalAmountDue || 0)}
                                  <span className="text-xs ml-1 bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                    Credit: £{(demand.creditAppliedAmount || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div>{formatCurrency(demand.totalAmountDue || 0)}</div>
                            )}
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
                                          {demand.status === ServiceChargeDemandStatus.PARTIALLY_PAID 
                                            ? 'Partially Paid' 
                                            : demand.status === ServiceChargeDemandStatus.ISSUED && new Date(demand.dueDate) < new Date() 
                                            ? 'Overdue' 
                                            : demand.status}
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
                                          <button
                                            onClick={() => {
                                              setSelectedFlatForLedger({
                                                flatId: demand.flatId,
                                                flatNumber: demand.flatNumber,
                                                residentName: demand.residentName
                                              })
                                              setShowFlatLedger(true)
                                            }}
                                            className="text-purple-600 hover:text-purple-800 font-inter"
                                            title="View Flat Ledger"
                                          >
                                            <BookOpen className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Invoices</h3>
                <p className="text-gray-600 font-inter">Invoice management features will be available soon</p>
              </div>
              
              {/* Development Proposal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600 mt-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Invoice Management System - Development Proposal</h3>
                    <div className="bg-white rounded-lg p-6 border border-blue-200">
                      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
{`🎯 CORE INVOICE MANAGEMENT FEATURES

1. Multi-Channel Invoice Input
• Drag & Drop Zone: Large, prominent area for dragging PDF/image files directly into the app
• File Upload: Traditional file picker supporting batch uploads (multiple files/folders)
• Email Integration:
  - Dedicated email address for the building (e.g., invoices-building123@yourapp.com)
  - Email forwarding with automatic attachment extraction
  - Email parsing to extract vendor info from sender/subject

2. Intelligent File Processing & OCR
• Automatic Data Extraction:
  - Vendor name, invoice number, date, amount, line items
  - Tax/VAT identification
  - Due dates and payment terms
• File Format Support: PDF, JPG, PNG, TIFF
• Multi-page Document Handling: Split or keep as single invoice

3. Smart File Naming & Organization
Auto-generated naming convention:
  YYYY-MM-DD_VendorName_InvoiceNumber_Amount.pdf
  2024-03-15_AcmePlumbing_INV001234_£450.00.pdf

• Manual Override: Allow editing of auto-generated names
• Duplicate Detection: Flag potential duplicates based on vendor/amount/date
• Version Control: Handle invoice revisions/corrections

4. Advanced Search & Filtering
• Full-text Search: Search within invoice content (OCR'd text)
• Filter by:
  - Date range, vendor, amount range
  - Invoice status (pending, paid, overdue, disputed)
  - Category/expense type
  - Associated ticket/work order
• Quick Filters: "This month", "Overdue", "High value (>£1000)"

5. Expense Reconciliation Engine

Automatic Matching:
• Ticket-to-Invoice Matching:
  - Match by vendor name and approximate amount
  - Match by work description/location
  - Date proximity (invoice within reasonable timeframe of ticket completion)
• Smart Suggestions: "This invoice might relate to Ticket #TKT-123 (Boiler Repair - £445)"

Manual Linking Interface:
• Side-by-side View: Show invoice details alongside potential expense forecasts
• Drag & Drop Linking: Drag invoice onto expense forecast to link them
• Bulk Actions: Link multiple invoices to large work orders

6. Invoice Status Workflow
Received → Under Review → Approved → Scheduled for Payment → Paid → Archived
                ↓
           Disputed/Rejected → Vendor Communication

7. Approval & Authorization System
• Approval Thresholds: Auto-approve <£200, require approval >£1000
• Multi-level Approval: Building Manager → Regional Manager → Finance Team
• Approval History: Track who approved what and when

🔧 TECHNICAL IMPLEMENTATION APPROACH

File Storage Strategy:
• Cloud Storage: AWS S3/Google Cloud for scalability
• CDN Integration: Fast file access globally
• Backup & Versioning: Automatic backups with version history

OCR & AI Integration:
• OCR Engine: Google Vision API or AWS Textract for text extraction
• AI Enhancement:
  - GPT-4 Vision for complex invoice layouts
  - Custom training for common UK invoice formats
  - Learning from user corrections

Email Integration Options:
1. Dedicated Email Service:
   - Unique email per building
   - Automatic forwarding rules
   - Parse sender domain for vendor identification

2. Email API Integration:
   - Gmail/Outlook API access
   - Rule-based processing
   - Attachment extraction

Database Schema Considerations:
invoices:
- id, building_id, vendor_id, invoice_number
- amount, currency, tax_amount, net_amount
- invoice_date, due_date, received_date
- status, approval_status, payment_date
- file_path, original_filename, ocr_text
- linked_expense_id, linked_ticket_id

invoice_line_items:
- invoice_id, description, quantity, unit_price, total
- category, expense_type

vendor_mappings:
- email_domain, vendor_name, default_category

📱 USER EXPERIENCE DESIGN

Dashboard Integration:
• Invoice Alerts: "3 new invoices need review"
• Overdue Warnings: "2 invoices overdue for payment"
• Reconciliation Status: "5 expenses awaiting invoice match"

Workflow Efficiency:
• Batch Operations: Select multiple invoices for bulk approval/payment
• Keyboard Shortcuts: Quick navigation and actions
• Mobile Optimized: Review/approve invoices on mobile devices

Vendor Management:
• Vendor Profiles: Contact info, payment terms, tax details
• Performance Tracking: Average payment time, dispute history
• Communication Log: Track email exchanges about invoices

🎯 PROPOSED MVP FEATURES (Phase 1)

1. Basic Upload: Drag & drop + file picker
2. OCR Processing: Extract key fields (vendor, amount, date)
3. Manual Review Interface: Confirm/edit extracted data
4. Simple Search: By vendor, date, amount
5. Expense Linking: Manual linking to forecast expenses
6. Status Tracking: Received → Approved → Paid

🚀 ADVANCED FEATURES (Phase 2+)

1. Email Integration: Automated email processing
2. AI-Powered Matching: Automatic expense reconciliation
3. Approval Workflows: Multi-level approval system
4. Payment Integration: Connect to accounting systems
5. Analytics: Vendor performance, spending patterns
6. Mobile App: Invoice approval on-the-go

🔄 INTEGRATION POINTS

• Expenses Tab: Seamless linking to forecast expenses
• Tickets System: Auto-suggest invoice-to-ticket relationships
• Vendor Management: Central vendor database
• Accounting Export: QuickBooks, Xero integration
• Bank Reconciliation: Match payments to invoices

💡 IMPLEMENTATION PRIORITY

Recommended starting point: Basic upload and OCR functionality, then build out the reconciliation features with the existing expense forecasting system.`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-blue-700 font-medium">
                        💭 This comprehensive proposal outlines the complete invoice management system we can build to handle drag & drop uploads, email forwarding, OCR processing, expense reconciliation, and approval workflows.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-neutral-900 font-inter">Expense Forecasts</h2>
                  <button
                    onClick={() => setShowExpenseHelpModal(true)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="About Expense Forecasts"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                {!isMobile && (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600 font-inter">
                      Showing forecast expenses from completed tickets
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses Summary */}
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'
              }`}>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 font-inter">Total Forecasts</h3>
                  <p className="text-2xl font-bold text-primary-600 font-inter">{expenses.length}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 font-inter">Pending Invoices</h3>
                  <p className="text-2xl font-bold text-orange-600 font-inter">
                    {expenses.filter(e => e.status === 'forecast').length}
                  </p>
                </div>
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <h3 className="font-medium text-success-900 font-inter">Total Amount</h3>
                  <p className="text-2xl font-bold text-success-600 font-inter">
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 font-inter">Invoiced</h3>
                  <p className="text-2xl font-bold text-red-600 font-inter">
                    {expenses.filter(e => e.status === 'invoiced').length}
                  </p>
                </div>
              </div>

              {/* Expenses Display - Cards on Mobile, Table on Desktop */}
              {isMobile ? (
                // Mobile Card Layout
                <div className="space-y-3">
                  <div className="px-4 py-3 border-b border-neutral-200 bg-white rounded-t-lg">
                    <h3 className="text-lg font-medium text-neutral-900 font-inter">Forecast Expenses</h3>
                  </div>
                  {expenses.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 text-center">
                      <Receipt className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 font-inter">No Expense Forecasts</h3>
                      <p className="text-gray-600 font-inter">
                        Complete some tickets with final costs to see expense forecasts here
                      </p>
                    </div>
                  ) : (
                    expenses.map((expense) => (
                      <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
                        {/* Header with Description and Amount */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <h4 className="text-sm font-medium text-neutral-900 font-inter line-clamp-2">
                              {expense.description}
                            </h4>
                            {expense.ticketId && (
                              <div className="text-xs text-gray-500 mt-1">
                                Ticket: {expense.ticketId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-neutral-900 font-inter">
                            {formatCurrency(expense.amount || 0)}
                          </div>
                        </div>
                        
                        {/* Supplier and Category */}
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="truncate max-w-[120px]" title={expense.vendorName || expense.supplierName || 'Unknown Supplier'}>
                              {expense.vendorName || expense.supplierName || 'Unknown Supplier'}
                            </span>
                            {expense.category && (
                              <span className="capitalize">
                                {expense.category.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <span>{new Date(expense.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${
                            expense.status === 'forecast'
                              ? 'bg-orange-100 text-orange-800'
                              : expense.status === 'invoiced'
                              ? 'bg-red-100 text-red-800'
                              : expense.status === 'paid'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-neutral-100 text-gray-800'
                          }`}>
                            {expense.status === 'forecast' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {expense.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {expense.status === 'forecast' ? 'Pending Invoice' : expense.status}
                          </span>
                          <div className="flex items-center space-x-2">
                            {expense.ticketId && (
                              <button
                                onClick={() => {
                                  addNotification({
                                    userId: currentUser?.id || '',
                                    title: 'Info',
                                    message: `Ticket ${expense.ticketId.substring(0, 8)}... linked to this expense`,
                                    type: 'info'
                                  })
                                }}
                                className="text-primary-600 hover:text-blue-800 font-inter"
                                title="View Ticket"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            )}
                            {expense.status === 'forecast' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await expenseService.markAsInvoiced(expense.id, currentUser?.id || '')
                                    addNotification({
                                      userId: currentUser?.id || '',
                                      title: 'Success',
                                      message: 'Expense marked as invoiced',
                                      type: 'success'
                                    })
                                    await loadFinancialData()
                                  } catch (error) {
                                    addNotification({
                                      userId: currentUser?.id || '',
                                      title: 'Error',
                                      message: 'Failed to update expense status',
                                      type: 'error'
                                    })
                                  }
                                }}
                                className="text-success-600 hover:text-success-800 font-inter"
                                title="Mark as Invoiced"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Desktop Table Layout
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200">
                    <h3 className="text-lg font-medium text-neutral-900 font-inter">Forecast Expenses</h3>
                    <p className="text-sm text-gray-600 font-inter mt-1">
                      Expenses automatically created from completed maintenance tickets
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Ticket/Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Supplier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Date Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider font-inter">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-sm text-neutral-900 font-inter">
                              <div>
                                <div className="font-medium">{expense.description}</div>
                                {expense.ticketId && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Ticket: {expense.ticketId.substring(0, 8)}...
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                              {expense.vendorName || expense.supplierName || 'Unknown Supplier'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                              <div className="font-medium">
                                {formatCurrency(expense.amount || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                              <span className="capitalize">{expense.category?.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${
                                expense.status === 'forecast'
                                  ? 'bg-orange-100 text-orange-800'
                                  : expense.status === 'invoiced'
                                  ? 'bg-red-100 text-red-800'
                                  : expense.status === 'paid'
                                  ? 'bg-success-100 text-success-800'
                                  : 'bg-neutral-100 text-gray-800'
                              }`}>
                                {expense.status === 'forecast' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {expense.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {expense.status === 'forecast' ? 'Pending Invoice' : expense.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                              {new Date(expense.createdAt).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {expense.ticketId && (
                                  <button
                                    onClick={() => {
                                      // TODO: Navigate to ticket detail
                                      addNotification({
                                        userId: currentUser?.id || '',
                                        title: 'Info',
                                        message: `Ticket ${expense.ticketId.substring(0, 8)}... linked to this expense`,
                                        type: 'info'
                                      })
                                    }}
                                    className="text-primary-600 hover:text-blue-800 font-inter"
                                    title="View Ticket"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                )}
                                {expense.status === 'forecast' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await expenseService.markAsInvoiced(expense.id, currentUser?.id || '')
                                        addNotification({
                                          userId: currentUser?.id || '',
                                          title: 'Success',
                                          message: 'Expense marked as invoiced',
                                          type: 'success'
                                        })
                                        await loadFinancialData()
                                      } catch (error) {
                                        addNotification({
                                          userId: currentUser?.id || '',
                                          title: 'Error',
                                          message: 'Failed to update expense status',
                                          type: 'error'
                                        })
                                      }
                                    }}
                                    className="text-success-600 hover:text-success-800 font-inter"
                                    title="Mark as Invoiced"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {expenses.length === 0 && (
                      <div className="text-center py-12">
                        <Receipt className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 font-inter">No Expense Forecasts</h3>
                        <p className="text-gray-600 font-inter">
                          Complete some tickets with final costs to see expense forecasts here
                        </p>
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 font-inter">
                            💡 Tip: When you mark tickets as complete with a final cost, forecast expenses are automatically created here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expense Help Modal */}
      {showExpenseHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal" style={{ zIndex: 1400 }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Receipt className="h-6 w-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900 font-inter">
                    About Expense Forecasts
                  </h2>
                </div>
                <button
                  onClick={() => setShowExpenseHelpModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Close help modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-neutral-700 font-inter">
                  These forecasts are automatically created when maintenance tickets are completed with a final cost.
                </p>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-900 font-inter">Status Definitions:</h3>
                  <ul className="space-y-2 text-sm text-neutral-700 font-inter">
                    <li className="flex items-start space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-0.5">
                        Pending Invoice
                      </span>
                      <span>Work completed, waiting for supplier invoice</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-0.5">
                        Invoiced
                      </span>
                      <span>Invoice received and processed</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800 mt-0.5">
                        Paid
                      </span>
                      <span>Invoice has been paid</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-600 font-inter">
                    💡 Tip: When you mark tickets as complete with a final cost, forecast expenses are automatically created here
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowExpenseHelpModal(false)}
                  className="btn-primary"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Flat Ledger Modal */}
      {selectedFlatForLedger && (
        <FlatLedgerModal
          isOpen={showFlatLedger}
          onClose={() => {
            setShowFlatLedger(false)
            setSelectedFlatForLedger(null)
          }}
          flatId={selectedFlatForLedger.flatId}
          buildingId={selectedBuildingId || ''}
          flatNumber={selectedFlatForLedger.flatNumber}
          residentName={selectedFlatForLedger.residentName}
        />
      )}

    </div>
  )
}

export default Finances
