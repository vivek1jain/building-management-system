import React, { useState, useEffect, useMemo } from 'react';
import { FlatLedgerModal } from '../components/FlatLedger';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Modal, ModalHeader, ModalFooter, Dropdown, DropdownOption, PageLoading, SectionLoading, TabLoadingSkeleton, TableRowSkeleton, WidgetSkeleton } from '../components/UI'
import { useAuth } from '../contexts/AuthContext';
import { useBuilding } from '../contexts/BuildingContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import budgetCategoryMasterService from '../services/budgetCategoryMasterService';
import { budgetService } from '../services/budgetService';
import { financialIntegrationService } from '../services/financialIntegrationService';
import { ticketService } from '../services/ticketService';
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
  InvoiceStatus,
  BudgetCategoryMaster,
  BudgetCategoryItem,
  BudgetValidationResult
} from '../types';
import budgetValidationUtils from '../utils/budgetValidation';

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
  Info,
  Edit,
  Settings,
  Trash2
} from 'lucide-react'
import { ServiceChargePeriodDropdown } from '../components/ServiceCharges/ServiceChargePeriodDropdown'
import { getFinancialYearInfo } from '../utils/financialYear'

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
  
  // Ticket Modal state
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<any>(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  
  
  // UI state
  const [showBudgetSetup, setShowBudgetSetup] = useState(false)
  const [budgetLocked, setBudgetLocked] = useState(false)
  const [showExpenseHelpModal, setShowExpenseHelpModal] = useState(false)
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set())
  const [expandedServiceCharges, setExpandedServiceCharges] = useState<Set<string>>(new Set())
  const [expandedModalCategories, setExpandedModalCategories] = useState<Set<string>>(new Set())
  const [activeStatusFilterTile, setActiveStatusFilterTile] = useState<'paid' | 'invoiced' | 'forecast' | null>(null)
  const [activeServiceChargeFilterTile, setActiveServiceChargeFilterTile] = useState<'paid' | 'outstanding' | 'overdue' | null>(null)
  
  // Service Charge Issue Demands states (removed - now using direct flow)
  
  // Budget category management
  const [budgetCategoryMasters, setBudgetCategoryMasters] = useState<BudgetCategoryMaster[]>([])
  const [budgetValidation, setBudgetValidation] = useState<BudgetValidationResult | null>(null)
  
  // Enhanced form state
  const [budgetForm, setBudgetForm] = useState({
    year: new Date().getFullYear(),
    financialYearStart: new Date('2024-04-01'), // UK financial year
    status: 'draft' as const,
    serviceChargeRate: 0,
    totalBudgetAmount: 0,
    totalSqFt: 0,
    ratePerSqFt: 0,
    previousYearRatePerSqFt: 0,
    categories: [] as BudgetCategoryItem[]
  })
  
  // Previous year budget data
  const [previousYearBudget, setPreviousYearBudget] = useState<Budget | null>(null)
  
  // Category management modal state
  const [showCategoryManagement, setShowCategoryManagement] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [editingCategoryMaster, setEditingCategoryMaster] = useState<BudgetCategoryMaster | null>(null)
  const [categoryMasterForm, setCategoryMasterForm] = useState({ name: '', description: '' })
  const [mergingCategories, setMergingCategories] = useState<{ sourceId: string; targetId: string } | null>(null)
  const [categoryInputFocused, setCategoryInputFocused] = useState<string | null>(null)
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false)
  const [loadingCategoryMasters, setLoadingCategoryMasters] = useState(false)
  const [showAddNewCategorySection, setShowAddNewCategorySection] = useState(false)
  const [showMergeCategorySection, setShowMergeCategorySection] = useState(false)
  
  // Load draft from localStorage on mount
  useEffect(() => {
    if (selectedBuildingId) {
      const draftKey = `budget_draft_${selectedBuildingId}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          setBudgetForm({
            ...parsed,
            financialYearStart: new Date(parsed.financialYearStart)
          })
        } catch (error) {
          console.error('Error loading budget draft:', error)
        }
      }
    }
  }, [selectedBuildingId])
  
  // Populate budgetForm when opening modal to edit existing budget
  useEffect(() => {
    if (showBudgetSetup && budget) {
      setBudgetForm({
        year: budget.year || new Date().getFullYear(),
        financialYearStart: budget.financialYearStart ? new Date(budget.financialYearStart) : new Date('2024-04-01'),
        status: 'draft' as const, // Always use 'draft' for form editing
        serviceChargeRate: budget.serviceChargeRate || 0,
        totalBudgetAmount: budget.totalBudgetAmount || 0,
        totalSqFt: budget.totalSqFt || 0,
        ratePerSqFt: budget.ratePerSqFt || 0,
        previousYearRatePerSqFt: budget.previousYearRatePerSqFt || 0,
        categories: budget.categories || []
      })
    } else if (showBudgetSetup && !budget) {
      // Reset form for creating new budget
      setBudgetForm({
        year: new Date().getFullYear(),
        financialYearStart: new Date('2024-04-01'),
        status: 'draft',
        serviceChargeRate: 0,
        totalBudgetAmount: 0,
        totalSqFt: 0,
        ratePerSqFt: 0,
        previousYearRatePerSqFt: 0,
        categories: []
      })
    }
  }, [showBudgetSetup, budget])

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
  
  // Generate period options for service charge demands using financial year logic
  const generatePeriodOptions = () => {
    if (!selectedBuilding?.financialSettings) {
      return []
    }

    try {
      const financialInfo = getFinancialYearInfo(selectedBuilding.financialSettings, new Date())
      const options = []
      
      // Add last period (for reference/context)
      if (financialInfo.previousPeriod) {
        const period = financialInfo.previousPeriod
        const dateRange = `${period.startDate.toLocaleDateString('en-GB', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${period.endDate.toLocaleDateString('en-GB', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`
        const dueDate = `Due: ${period.dueDate.toLocaleDateString('en-GB')}`
        
        options.push({
          value: period.id,
          label: `${period.label} (Last Period)`,
          description: `${dateRange} • ${dueDate}`,
          disabled: true
        })
      }
      
      // Add available periods (current + next 3)
      if (financialInfo.nextPeriods) {
        financialInfo.nextPeriods.forEach(period => {
          const dateRange = `${period.startDate.toLocaleDateString('en-GB', { 
            month: 'short', 
            day: 'numeric' 
          })} - ${period.endDate.toLocaleDateString('en-GB', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}`
          const dueDate = `Due: ${period.dueDate.toLocaleDateString('en-GB')}`
          
          options.push({
            value: period.id,
            label: period.label,
            description: `${dateRange} • ${dueDate}`,
            disabled: false
          })
        })
      }
      
      return options
    } catch (error) {
      console.error('Error generating period options:', error)
      return []
    }
  }
  
  const periodOptions = generatePeriodOptions()
  
  // Handle issuing demands - directly call generate with selected period
  const handleIssueDemands = () => {
    if (!selectedBuildingId || !selectedPeriod) {
      return // Button should be disabled, but just in case
    }
    handleGenerateDemands(selectedPeriod)
  }
  
  // Period selection and confirmation handlers removed - now using direct flow with disabled button

  useEffect(() => {
    if (selectedBuildingId) {
      loadFinancialData()
    }
  }, [selectedBuildingId])

  // Load budget category masters when building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadBudgetCategoryMasters()
    }
  }, [selectedBuildingId])
  
  // Recalculate total budget whenever categories change
  useEffect(() => {
    const newTotal = budgetForm.categories.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0)
    const newRatePerSqFt = budgetValidationUtils.calculateRatePerSqFt(newTotal, budgetForm.totalSqFt)
    
    // Only update if values actually changed to avoid infinite loops
    if (Math.abs(newTotal - budgetForm.totalBudgetAmount) > 0.01 || Math.abs(newRatePerSqFt - budgetForm.ratePerSqFt) > 0.01) {
      setBudgetForm(prev => ({
        ...prev,
        totalBudgetAmount: newTotal,
        ratePerSqFt: newRatePerSqFt
      }))
    }
  }, [budgetForm.categories, budgetForm.totalSqFt, budgetForm.totalBudgetAmount, budgetForm.ratePerSqFt])
  
  // Update budget form when selected building changes
  useEffect(() => {
    if (selectedBuilding?.financialSettings && flats.length > 0) {
      const settings = selectedBuilding.financialSettings
      
      // Create financial year start date from settings
      const financialYearStart = new Date(
        settings.currentYear || new Date().getFullYear(),
        (settings.startMonth || 4) - 1, // Convert to 0-based month (April = 3)
        settings.startDay || 1
      )
      
      // Calculate total square feet from flats
      const totalSqFt = flats.reduce((sum, flat) => sum + (flat.areaSqFt || 0), 0)
      
      setBudgetForm(prev => ({
        ...prev,
        year: settings.currentYear || new Date().getFullYear(),
        financialYearStart,
        serviceChargeRate: settings.serviceChargeRatePerSqFt || 0,
        totalSqFt,
        ratePerSqFt: budgetValidationUtils.calculateRatePerSqFt(prev.totalBudgetAmount, totalSqFt)
      }))
    }
  }, [selectedBuilding, flats])
  
  // Load budget category masters
  const loadBudgetCategoryMasters = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoadingCategoryMasters(true)
      const categories = await budgetCategoryMasterService.getBudgetCategoryMasters(selectedBuildingId)
      setBudgetCategoryMasters(categories)
      
      // If no categories exist, initialize default ones silently
      if (categories.length === 0) {
        await budgetCategoryMasterService.initializeDefaultCategories(selectedBuildingId)
        const defaultCategories = await budgetCategoryMasterService.getBudgetCategoryMasters(selectedBuildingId)
        setBudgetCategoryMasters(defaultCategories)
      }
    } catch (error) {
      console.error('Error loading budget category masters:', error)
    } finally {
      setLoadingCategoryMasters(false)
    }
  }
  
  // Budget category management functions
  const addBudgetCategory = () => {
    const newCategory: BudgetCategoryItem = {
      id: `temp-${Date.now()}`,
      name: '',
      type: 'expenditure',
      budgetAmount: undefined as any, // Start with undefined instead of 0
      percentageOfTotal: 0,
      actualAmount: 0,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: 0
    }
    
    setBudgetForm(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }))
  }
  
  const removeBudgetCategory = (categoryId: string) => {
    setBudgetForm(prev => {
      const updatedCategories = prev.categories.filter(cat => cat.id !== categoryId)
      
      // Calculate new total from remaining categories
      const newTotal = updatedCategories.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0)
      const newRatePerSqFt = budgetValidationUtils.calculateRatePerSqFt(newTotal, prev.totalSqFt)
      
      const updatedCategoriesWithPercentages = budgetValidationUtils.updateCategoryPercentages(
        updatedCategories,
        newTotal
      )
      
      return {
        ...prev,
        totalBudgetAmount: newTotal,
        ratePerSqFt: newRatePerSqFt,
        categories: updatedCategoriesWithPercentages
      }
    })
  }
  
  const updateBudgetCategory = (categoryId: string, updates: Partial<BudgetCategoryItem>) => {
    setBudgetForm(prev => {
      const updatedCategories = prev.categories.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
      
      // Calculate new total from all categories
      const newTotal = updatedCategories.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0)
      const newRatePerSqFt = budgetValidationUtils.calculateRatePerSqFt(newTotal, prev.totalSqFt)
      
      // If amount changed, recalculate percentages
      // If percentage changed, recalculate amounts
      let finalCategories = updatedCategories
      
      if (updates.budgetAmount !== undefined) {
        finalCategories = budgetValidationUtils.updateCategoryPercentages(
          updatedCategories,
          newTotal
        )
      } else if (updates.percentageOfTotal !== undefined) {
        finalCategories = budgetValidationUtils.updateCategoryAmounts(
          updatedCategories,
          newTotal
        )
      }
      
      return {
        ...prev,
        totalBudgetAmount: newTotal,
        ratePerSqFt: newRatePerSqFt,
        categories: finalCategories
      }
    })
  }
  
  const updateTotalBudget = (newTotal: number) => {
    setBudgetForm(prev => {
      const updatedCategories = budgetValidationUtils.updateCategoryAmounts(
        prev.categories,
        newTotal
      )
      
      const newRatePerSqFt = budgetValidationUtils.calculateRatePerSqFt(newTotal, prev.totalSqFt)
      
      return {
        ...prev,
        totalBudgetAmount: newTotal,
        categories: updatedCategories,
        ratePerSqFt: newRatePerSqFt
      }
    })
  }
  
  const autoAdjustPercentages = () => {
    setBudgetForm(prev => ({
      ...prev,
      categories: budgetValidationUtils.autoAdjustPercentages(prev.categories)
    }))
  }
  
  // Save draft to localStorage
  const handleSaveDraft = () => {
    if (!selectedBuildingId) return
    
    const draftKey = `budget_draft_${selectedBuildingId}`
    localStorage.setItem(draftKey, JSON.stringify(budgetForm))
    
    addNotification({
      userId: currentUser?.id || '',
      title: 'Draft Saved',
      message: 'Budget draft has been saved locally',
      type: 'success'
    })
  }
  
  // Clear draft from localStorage after successful save
  const clearDraft = () => {
    if (!selectedBuildingId) return
    const draftKey = `budget_draft_${selectedBuildingId}`
    localStorage.removeItem(draftKey)
  }
  
  // Category Master Management Functions
  const handleCreateCategoryMaster = async () => {
    if (!selectedBuildingId || !categoryMasterForm.name.trim()) return
    
    try {
      await budgetCategoryMasterService.createBudgetCategoryMaster({
        name: categoryMasterForm.name.trim(),
        description: categoryMasterForm.description.trim(),
        buildingId: selectedBuildingId,
        isActive: true
      })
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Success',
        message: 'Category created successfully',
        type: 'success'
      })
      
      setCategoryMasterForm({ name: '', description: '' })
      await loadBudgetCategoryMasters()
    } catch (error) {
      console.error('Error creating category:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to create category',
        type: 'error'
      })
    }
  }
  
  const handleUpdateCategoryMaster = async () => {
    if (!editingCategoryMaster || !categoryMasterForm.name.trim()) return
    
    try {
      await budgetCategoryMasterService.updateBudgetCategoryMaster(editingCategoryMaster.id, {
        name: categoryMasterForm.name.trim(),
        description: categoryMasterForm.description.trim()
      })
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Success',
        message: 'Category updated successfully',
        type: 'success'
      })
      
      setEditingCategoryMaster(null)
      setCategoryMasterForm({ name: '', description: '' })
      setShowEditCategoryModal(false)
      await loadBudgetCategoryMasters()
    } catch (error) {
      console.error('Error updating category:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to update category',
        type: 'error'
      })
    }
  }
  
  const handleDeleteCategoryMaster = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      await budgetCategoryMasterService.deleteBudgetCategoryMaster(id)
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Success',
        message: 'Category deleted successfully',
        type: 'success'
      })
      
      await loadBudgetCategoryMasters()
    } catch (error) {
      console.error('Error deleting category:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to delete category',
        type: 'error'
      })
    }
  }
  
  const handleMergeCategoryMasters = async () => {
    if (!mergingCategories) return
    
    try {
      await budgetCategoryMasterService.mergeBudgetCategoryMasters(
        mergingCategories.sourceId,
        mergingCategories.targetId
      )
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Success',
        message: 'Categories merged successfully',
        type: 'success'
      })
      
      setMergingCategories(null)
      setShowEditCategoryModal(false)
      setEditingCategoryMaster(null)
      setCategoryMasterForm({ name: '', description: '' })
      await loadBudgetCategoryMasters()
    } catch (error) {
      console.error('Error merging categories:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to merge categories',
        type: 'error'
      })
    }
  }
  
  const startEditingCategory = (category: BudgetCategoryMaster) => {
    setEditingCategoryMaster(category)
    setCategoryMasterForm({ name: category.name, description: category.description || '' })
    setShowEditCategoryModal(true)
  }
  
  // Get filtered category suggestions based on input
  const getCategorySuggestions = (inputValue: string) => {
    if (!inputValue.trim()) return []
    const searchLower = inputValue.toLowerCase()
    return budgetCategoryMasters.filter(master => 
      master.name.toLowerCase().includes(searchLower) &&
      !budgetForm.categories.some(cat => cat.name.toLowerCase() === master.name.toLowerCase())
    ).slice(0, 5) // Limit to 5 suggestions
  }
  
  // Quick add all category masters to budget
  const handleQuickAddAllCategories = () => {
    const newCategories = budgetCategoryMasters
      .filter(master => !budgetForm.categories.some(cat => cat.name.toLowerCase() === master.name.toLowerCase()))
      .map(master => ({
        id: `temp-${Date.now()}-${master.id}`,
        name: master.name,
        type: 'expenditure' as const,
        budgetAmount: undefined as any,
        percentageOfTotal: 0,
        actualAmount: 0,
        allocatedAmount: 0,
        spentAmount: 0,
        remainingAmount: 0,
        categoryMasterId: master.id
      }))
    
    setBudgetForm(prev => ({
      ...prev,
      categories: [...prev.categories, ...newCategories]
    }))
    
    setShowQuickAddDropdown(false)
    
    addNotification({
      userId: currentUser?.id || '',
      title: 'Success',
      message: `Added ${newCategories.length} categories from masters`,
      type: 'success'
    })
  }
  
  // Apply category master suggestion
  const applyCategorySuggestion = (categoryId: string, master: BudgetCategoryMaster) => {
    updateBudgetCategory(categoryId, { 
      name: master.name,
      categoryMasterId: master.id
    })
    setCategoryInputFocused(null)
  }
  
  // Validate budget whenever categories or total changes
  useEffect(() => {
    const validation = budgetValidationUtils.validateBudget(
      budgetForm.categories,
      budgetForm.totalBudgetAmount
    )
    setBudgetValidation(validation)
  }, [budgetForm.categories, budgetForm.totalBudgetAmount])
  
  // Handle budget form submission
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBuildingId || !budgetValidation?.isValid) {
      return
    }
    
    try {
      setLoading(true)
      
      // Calculate income and expenditure totals from categories
      const totalIncome = budgetForm.categories
        .filter(cat => cat.type === 'income')
        .reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0)
      
      const totalExpenditure = budgetForm.categories
        .filter(cat => cat.type === 'expenditure')
        .reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0)
      
      const netBudget = totalIncome - totalExpenditure
      
      const budgetData = {
        buildingId: selectedBuildingId,
        year: budgetForm.year,
        financialYearStart: budgetForm.financialYearStart,
        status: budgetForm.status,
        categories: budgetForm.categories,
        totalBudgetAmount: budgetForm.totalBudgetAmount,
        totalIncome,
        totalExpenditure,
        netBudget,
        totalSqFt: budgetForm.totalSqFt,
        ratePerSqFt: budgetForm.ratePerSqFt,
        previousYearRatePerSqFt: budgetForm.previousYearRatePerSqFt,
        // Legacy fields for backward compatibility
        totalAmount: budgetForm.totalBudgetAmount,
        allocatedAmount: budgetForm.totalBudgetAmount,
        spentAmount: 0,
        remainingAmount: budgetForm.totalBudgetAmount,
        createdBy: currentUser?.id || ''
      }
      
      if (budget) {
        await budgetService.updateBudget(budget.id, budgetData)
        addNotification({
          userId: currentUser?.id || '',
          title: 'Success',
          message: 'Budget updated successfully',
          type: 'success'
        })
      } else {
        await budgetService.createBudget(budgetData)
        addNotification({
          userId: currentUser?.id || '',
          title: 'Success', 
          message: 'Budget created successfully',
          type: 'success'
        })
      }
      
      setShowBudgetSetup(false)
      clearDraft() // Clear draft after successful save
      await loadFinancialData()
      
    } catch (error) {
      console.error('Error saving budget:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to save budget',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }
  
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
        const budgets = budgetResult.value
        setBudget(budgets.length > 0 ? budgets[0] : null)
        
        // Find previous year budget
        const currentYear = new Date().getFullYear()
        const previousYear = currentYear - 1
        const prevBudget = budgets.find(b => b.year === previousYear)
        setPreviousYearBudget(prevBudget || null)
        
        console.log('✅ Budget data loaded:', budgets.length, 'budgets')
      } else {
        console.error('❌ Budget loading failed:', budgetResult.reason)
        setBudget(null)
        setPreviousYearBudget(null)
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

  // Derived service charges based on active tile filter
  const filteredServiceCharges = useMemo(() => {
    if (!activeServiceChargeFilterTile) return serviceCharges
    
    return serviceCharges.filter(sc => {
      switch (activeServiceChargeFilterTile) {
        case 'paid':
          return sc.status === ServiceChargeDemandStatus.PAID
        case 'outstanding':
          return (sc.outstandingAmount || 0) > 0
        case 'overdue':
          return (sc.status === ServiceChargeDemandStatus.ISSUED || sc.status === ServiceChargeDemandStatus.PARTIALLY_PAID) &&
                 new Date(sc.dueDate) < new Date()
        default:
          return true
      }
    })
  }, [serviceCharges, activeServiceChargeFilterTile])

  // Group service charges by financial quarter/period
  const groupedServiceCharges = useMemo(() => {
    const groups: Record<string, ServiceChargeDemand[]> = {}
    
    filteredServiceCharges.forEach(charge => {
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
  }, [filteredServiceCharges, sortField, sortDirection])
  
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
      
      const statusLines = []
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
  const handleGenerateDemands = async (periodToUse?: string) => {
    if (!selectedBuildingId) {
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Please select a building first', type: 'error' })
      return
    }
    
    // Use the provided period or fall back to selectedPeriod
    const periodForGeneration = periodToUse || selectedPeriod
    
    if (!periodForGeneration) {
      addNotification({ userId: currentUser?.id || '', title: 'Error', message: 'Please select a period first', type: 'error' })
      return
    }

    // Check if demands already exist for this period
    const existingDemandsForPeriod = serviceCharges.filter(
      demand => demand.financialQuarterDisplayString === periodForGeneration
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
        period: periodForGeneration,
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
          newExpanded.add(periodForGeneration)
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
            
            console.log('[LedgerSync] Reversing ledger entries for cancelled demands')
            
            // Reverse ledger entries for cancelled demands
            try {
              const { reverseServiceChargeDemand } = await import('../services/flatLedgerSyncService')
              
              let reversedCount = 0
              for (const demand of existingDemandsForPeriod) {
                try {
                  await reverseServiceChargeDemand(
                    demand, 
                    currentUser?.id || 'system',
                    'Cancelled to issue replacement demands'
                  )
                  reversedCount++
                } catch (reverseError) {
                  console.error('[LedgerSync] Failed to reverse ledger for demand', {
                    demandId: demand.id,
                    error: reverseError
                  })
                  // Continue with other demands
                }
              }
              
              console.log('[LedgerSync] ✅ Reversed ledger entries', {
                totalDemands: existingDemandsForPeriod.length,
                reversed: reversedCount
              })
            } catch (reversalServiceError) {
              console.error('[LedgerSync] ❌ Ledger reversal service error:', reversalServiceError)
              // Don't fail - demands are cancelled
            }
            
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
        period: periodForGeneration,
        rate,
        flatsCount: flats.length
      })
      
      const demands = await generateServiceChargeDemands(selectedBuildingId, periodForGeneration, rate, flats)
      
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

  // Ticket Modal handlers
  const handleCloseTicketModal = () => {
    setIsTicketModalOpen(false)
    setSelectedTicketForModal(null)
  }

  const handleTicketUpdate = (updatedTicket: any) => {
    // Refresh financial data to reflect any changes
    loadFinancialData()
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

      console.log('[LedgerSync] Payment sync requested', {
        demandId: selectedDemand.id,
        flatId: selectedDemand.flatId,
        flatNumber: selectedDemand.flatNumber,
        amount
      })

      // Update the service charge demand
      await updateServiceChargeDemand(selectedDemand.id, {
        status,
        amountPaid: newPaidAmount,
        outstandingAmount: Math.max(0, newOutstandingAmount),
        paymentHistory: [...(selectedDemand.paymentHistory || []), {
          paymentId: `payment-${Date.now()}`,
          paymentDate,
          amount: parseFloat(paymentAmount),
          method: PaymentMethod.BANK_TRANSFER,
          reference: `PAY-${Date.now()}`,
          recordedByUid: currentUser?.id || '',
          recordedAt: new Date()
        } as PaymentRecord]
      })

      // Sync payment to flat ledger
      try {
        const { recordPaymentForDemand } = await import('../services/flatLedgerSyncService')
        
        await recordPaymentForDemand({
          demand: selectedDemand,
          amount,
          processedAt: paymentDate,
          method: 'Bank Transfer',
          reference: `PAY-${Date.now()}`,
          notes: `Payment for demand ${selectedDemand.id}`,
          createdBy: currentUser?.id || 'system'
        })
        
        console.log('[LedgerSync] ✅ Payment synced to ledger successfully')
      } catch (ledgerError) {
        console.error('[LedgerSync] ❌ Failed to sync payment to ledger:', ledgerError)
        // Don't fail the whole operation - demand was updated
        addNotification({
          userId: currentUser?.id || '',
          title: 'Warning',
          message: 'Payment recorded but ledger sync failed. Please check logs.',
          type: 'warning'
        })
      }

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

  // Derived expenses based on active tile filter
  const visibleExpenses = useMemo(() => {
    if (!activeStatusFilterTile) return expenses
    return expenses.filter(e => e.status === activeStatusFilterTile)
  }, [expenses, activeStatusFilterTile])

  // Show loading spinner while buildings or initial financial data are loading
  if (buildingsLoading || (loading && !budget && serviceCharges.length === 0 && invoices.length === 0 && expenses.length === 0)) {
    return <PageLoading message="Loading financial data..." />
  }

  // Tab configuration for consistent mobile/desktop rendering
  const financeTabs = [
    { id: 'expenses', name: 'Expenses', icon: Receipt },
    { id: 'demands', name: 'Service Charges', icon: FileText },
    { id: 'budget', name: 'Budget', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        isMobile ? 'pt-2 space-y-3' : 'py-8 space-y-6'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter" data-testid="page-title">Finances</h1>
            {!isMobile && (
              <p className="text-gray-600 font-inter">Manage budgets, service charges, invoices, and financial reports</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b border-neutral-200 ${
        isMobile ? 'sticky top-0 bg-white/95 backdrop-blur-sm border-b-2 shadow-sm z-20' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
      }`}>
        <nav className={`-mb-px flex ${isMobile ? 'flex-1 justify-between px-4' : 'space-x-8'}`} aria-label="Tabs">
          {financeTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm font-inter flex items-center justify-center ${isMobile ? 'min-w-[44px]' : 'gap-2'} ${
                  isActive
                    ? 'border-blue-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
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

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        isMobile ? 'pb-2' : ''
      }`}>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'budget' && (
            <div className={isMobile ? 'space-y-3' : 'space-y-6'} data-testid="budget-overview">
              <div className={`flex items-center justify-between ${
                isMobile ? 'sticky top-[49px] bg-white z-10 py-3 -mx-4 px-4 border-b border-neutral-200' : ''
              }`}>
                <h2 className="text-lg font-semibold text-neutral-900 font-inter">Budget Management</h2>
                {!isMobile && (
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
                    <Button onClick={() => setShowBudgetSetup(true)} leftIcon={<Plus className="h-4 w-4" />} data-testid="create-budget">
                      {budget ? 'Edit Budget' : 'Create Budget'}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Mobile action buttons */}
              {isMobile && (
                <div className="flex items-center justify-end space-x-3">
                  {budget && (
                    <button
                      onClick={() => setBudgetLocked(!budgetLocked)}
                      className={`flex items-center justify-center px-3 py-2 rounded-lg font-inter min-w-[44px] ${
                        budgetLocked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-success-100 text-success-700 hover:bg-success-200'
                      }`}
                      title={budgetLocked ? 'Locked' : 'Unlocked'}
                    >
                      {budgetLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                    </button>
                  )}
                  <button
                    onClick={() => setShowBudgetSetup(true)}
                    className="btn-primary flex items-center justify-center px-3 min-w-[44px]"
                    title={budget ? 'Edit Budget' : 'Create Budget'}
                    data-testid="create-budget"
                  >
                    {budget ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </button>
                </div>
              )}

              {budget ? (
                <div className={isMobile ? 'space-y-3' : 'space-y-6'}>
                  {isMobile ? (
                    // Mobile: Accordion Layout
                    <>
                      {/* Total Summary Card */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                        <h3 className="text-sm font-bold text-neutral-900 mb-2">Budget Summary</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-neutral-600">Annual Budget</p>
                            <p className="text-base font-bold text-blue-900" data-testid="budget-total">£{(budget.totalBudgetAmount || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-neutral-600">Actuals (YTD)</p>
                            <p className="text-base font-bold text-purple-900" data-testid="budget-spent">
                              £{expenses.filter(e => e.status === 'paid' || e.status === 'invoiced').reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Budget Categories Heading */}
                      <h3 className="text-sm font-medium text-neutral-700 font-inter mb-2">Budget Categories</h3>
                      
                      {/* Category Accordions */}
                      <div className="space-y-2">
                        {budget.categories && budget.categories.map((category, index) => {
                          const percentage = budget.totalBudgetAmount > 0 
                            ? ((category.budgetAmount || 0) / budget.totalBudgetAmount * 100).toFixed(1)
                            : '0.0'
                          
                          // Find previous year category amount
                          const previousYearCategory = previousYearBudget?.categories?.find(
                            c => c.name.toLowerCase() === category.name.toLowerCase()
                          )
                          const previousYearAmount = previousYearCategory?.budgetAmount || 0
                          
                          // Calculate actuals from expenses with matching category
                          const categoryActuals = expenses
                            .filter(expense => 
                              expense.category?.toLowerCase() === category.name.toLowerCase() &&
                              (expense.status === 'paid' || expense.status === 'invoiced')
                            )
                            .reduce((sum, expense) => sum + (expense.amount || 0), 0)
                          
                          const isExpanded = expandedExpenses.has(category.id)
                          
                          const toggleExpanded = () => {
                            const newExpanded = new Set(expandedExpenses)
                            if (newExpanded.has(category.id)) {
                              newExpanded.delete(category.id)
                            } else {
                              newExpanded.add(category.id)
                            }
                            setExpandedExpenses(newExpanded)
                          }
                          
                          return (
                            <div key={index} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                              {/* Main clickable area */}
                              <div 
                                onClick={toggleExpanded}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                              >
                                <div className="flex-1 pr-3">
                                  <h4 className="text-sm font-medium text-neutral-900 font-inter">
                                    {category.name}
                                  </h4>
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    {percentage}% of budget
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-neutral-900 font-inter">
                                      £{(category.budgetAmount || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} />
                                </div>
                              </div>
                              
                              {/* Expandable Details */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-neutral-100">
                                  <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 mb-1">Previous Year</h5>
                                      <p className="text-sm text-neutral-900 font-inter">
                                        {previousYearAmount > 0 ? `£${previousYearAmount.toLocaleString()}` : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 mb-1">Actuals (YTD)</h5>
                                      <p className="text-sm text-neutral-900 font-inter font-medium">
                                        £{categoryActuals.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    // Desktop: Table Layout
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Budget Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b border-neutral-200">
                              <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Category</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600">Previous Year</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600">Budgeted Amount</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600">Actuals (YTD)</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600">% of Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {/* Total Row at Top */}
                              <tr className="bg-blue-50 border-b-2 border-blue-200">
                                <td className="py-3 px-4 text-sm font-bold text-neutral-900">Total</td>
                                <td className="py-3 px-4 text-sm font-bold text-right text-neutral-500">
                                  {previousYearBudget ? `£${(previousYearBudget.totalBudgetAmount || 0).toLocaleString()}` : '-'}
                                </td>
                                <td className="py-3 px-4 text-sm font-bold text-right text-blue-900">
                                  £{(budget.totalBudgetAmount || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-sm font-bold text-right text-purple-900">
                                  £{expenses.filter(e => e.status === 'paid' || e.status === 'invoiced').reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-sm font-bold text-right text-neutral-900">100%</td>
                              </tr>
                              {budget.categories && budget.categories.map((category, index) => {
                                const percentage = budget.totalBudgetAmount > 0 
                                  ? ((category.budgetAmount || 0) / budget.totalBudgetAmount * 100).toFixed(1)
                                  : '0.0'
                                
                                // Find previous year category amount
                                const previousYearCategory = previousYearBudget?.categories?.find(
                                  c => c.name.toLowerCase() === category.name.toLowerCase()
                                )
                                const previousYearAmount = previousYearCategory?.budgetAmount || 0
                                
                                // Calculate actuals from expenses with matching category
                                const categoryActuals = expenses
                                  .filter(expense => 
                                    expense.category?.toLowerCase() === category.name.toLowerCase() &&
                                    (expense.status === 'paid' || expense.status === 'invoiced')
                                  )
                                  .reduce((sum, expense) => sum + (expense.amount || 0), 0)
                                
                                return (
                                  <tr key={index} className="hover:bg-neutral-50">
                                    <td className="py-3 px-4 text-sm font-medium text-neutral-900">{category.name}</td>
                                    <td className="py-3 px-4 text-sm text-right text-neutral-500">
                                      {previousYearAmount > 0 ? `£${previousYearAmount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right text-neutral-900">
                                      £{(category.budgetAmount || 0).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right font-medium text-neutral-900">
                                      £{categoryActuals.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right text-neutral-600">
                                      {percentage}%
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
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
                {!isMobile && (
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-neutral-700 font-inter whitespace-nowrap">
                      Issue Demands:
                    </h3>
                    <ServiceChargePeriodDropdown
                      value={selectedPeriod}
                      onChange={(value) => setSelectedPeriod(value)}
                      placeholder="Select period..."
                      className="min-w-[350px]"
                      existingDemands={serviceCharges}
                    />
                    <div className="relative">
                      <button
                        onClick={handleIssueDemands}
                        disabled={loading || !selectedBuildingId || !selectedPeriod}
                        className="btn-primary flex items-center justify-center px-3 min-w-[44px]"
                        title={!selectedPeriod ? 'Select a period first' : 'Issue Demands'}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile controls - on new line */}
              {isMobile && (
                <div className="flex items-center justify-between space-x-3">
                  <ServiceChargePeriodDropdown
                    value={selectedPeriod}
                    onChange={(value) => setSelectedPeriod(value)}
                    placeholder="Issue Demands"
                    className="flex-1"
                    buttonClassName="!bg-primary-600 !text-white !border-primary-600 hover:!bg-primary-700 !min-h-[44px] !py-2.5 [&_span]:!text-white [&_svg]:!text-white [&_.lucide-chevron-down]:!hidden"
                    existingDemands={serviceCharges}
                  />
                  <button
                    onClick={handleIssueDemands}
                    disabled={loading || !selectedBuildingId || !selectedPeriod}
                    className="btn-primary flex items-center justify-center px-3 min-w-[44px] h-[44px]"
                    title={!selectedPeriod ? 'Select a period first' : 'Issue Demands'}
                    data-testid="generate-demands"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Service Charges Summary (clickable filters) */}
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveServiceChargeFilterTile(null)}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-success-50 border border-success-200 ${
                    activeServiceChargeFilterTile === null ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-success-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Total Amount</h3>
                  <p className={`font-bold text-success-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {formatCurrency(serviceCharges.reduce((sum, d) => sum + (d.totalAmountDue || 0), 0))}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveServiceChargeFilterTile(null)}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-blue-50 border border-blue-200 ${
                    activeServiceChargeFilterTile === null ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-blue-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Total Demands</h3>
                  <p className={`font-bold text-primary-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>{serviceCharges.length}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveServiceChargeFilterTile(prev => (prev === 'outstanding' ? null : 'outstanding'))}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-yellow-50 border border-yellow-200 ${
                    activeServiceChargeFilterTile === 'outstanding' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-yellow-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Outstanding</h3>
                  <p className={`font-bold text-yellow-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {formatCurrency(serviceCharges.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0))}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveServiceChargeFilterTile(prev => (prev === 'overdue' ? null : 'overdue'))}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-red-50 border border-red-200 ${
                    activeServiceChargeFilterTile === 'overdue' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-red-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Overdue</h3>
                  <p className={`font-bold text-red-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {serviceCharges.filter(sc => (sc.status === ServiceChargeDemandStatus.ISSUED || sc.status === ServiceChargeDemandStatus.PARTIALLY_PAID) && new Date(sc.dueDate) < new Date()).length}
                  </p>
                </button>
              </div>

              {/* Service Charge Demands - Cards on Mobile, Table on Desktop */}
              {isMobile ? (
                // Mobile Card Layout - Grouped by Period
                <div className="space-y-4">
                  {Object.keys(groupedServiceCharges).length === 0 ? (
                    <div className="bg-white rounded-lg p-6 text-center">
                      <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 font-inter">No Service Charge Demands</h3>
                      <p className="text-gray-600 font-inter">
                        Generate demands for the selected period to get started
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedServiceCharges).map(([period, demands]) => {
                      const isExpanded = expandedPeriods.has(period)
                      
                      // Helper function to get period date range
                      const getPeriodDateRange = (periodString: string) => {
                        console.log('getPeriodDateRange called with:', periodString)
                        try {
                          // Handle both "2025-Q3" and "Q3 2025" formats
                          let quarter, year
                          
                          if (periodString.includes('-Q')) {
                            // Format: "2025-Q3"
                            const parts = periodString.split('-')
                            if (parts.length === 2) {
                              year = parts[0]
                              quarter = parts[1] // This will be "Q3"
                            }
                          } else if (periodString.includes(' ')) {
                            // Format: "Q3 2025"
                            const parts = periodString.split(' ')
                            if (parts.length === 2) {
                              quarter = parts[0]
                              year = parts[1]
                            }
                          }
                          
                          console.log('Parsed - Quarter:', quarter, 'Year:', year)
                          
                          if (!quarter || !year) {
                            console.log('Could not parse period, returning original:', periodString)
                            return periodString
                          }
                          
                          let result
                          switch (quarter?.toUpperCase()) {
                            case 'Q1':
                              result = `Jan - Mar ${year}`
                              break
                            case 'Q2':
                              result = `Apr - Jun ${year}`
                              break
                            case 'Q3':
                              result = `Jul - Sep ${year}`
                              break
                            case 'Q4':
                              result = `Oct - Dec ${year}`
                              break
                            default:
                              result = periodString
                          }
                          console.log('Returning date range:', result)
                          return result
                        } catch (error) {
                          console.log('Error parsing period:', periodString, error)
                          return periodString
                        }
                      }
                      
                      return (
                        <div key={period} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                          {/* Clickable Period Header */}
                          <div 
                            className="px-4 py-3 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors duration-200 flex items-center justify-between"
                            onClick={() => togglePeriodExpansion(period)}
                          >
                            <div className="flex items-center space-x-3">
                              <ChevronDown 
                                className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                              <div>
                                <h3 className="text-lg font-semibold text-neutral-900 font-inter">{period}</h3>
                                <p className="text-sm text-gray-500 font-inter">{getPeriodDateRange(period)}</p>
                              </div>
                            </div>
                            <div className="text-sm text-neutral-600 font-inter">
                              {demands.length} demands
                            </div>
                          </div>
                          
                          {/* Collapsible Period Cards */}
                          {isExpanded && (
                            <div className="divide-y divide-neutral-100">
                            {demands.map((demand) => {
                              const isExpanded = expandedServiceCharges.has(demand.id)
                              const isOverdue = (demand.status === ServiceChargeDemandStatus.ISSUED || demand.status === ServiceChargeDemandStatus.PARTIALLY_PAID) && new Date(demand.dueDate) < new Date()
                              
                              const toggleExpanded = () => {
                                const newExpanded = new Set(expandedServiceCharges)
                                if (newExpanded.has(demand.id)) {
                                  newExpanded.delete(demand.id)
                                } else {
                                  newExpanded.add(demand.id)
                                }
                                setExpandedServiceCharges(newExpanded)
                              }
                              
                              return (
                                <div key={demand.id} className="">
                                  {/* Main clickable area */}
                                  <div 
                                    onClick={toggleExpanded}
                                    className="p-3 flex flex-col min-h-[60px] cursor-pointer hover:bg-neutral-25 transition-colors"
                                  >
                                    {/* Top section with Flat and Amount */}
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex-1 pr-2">
                                        <h4 className="text-sm font-medium text-neutral-900 font-inter truncate">
                                          {demand.flatNumber} • {demand.residentName}
                                        </h4>
                                      </div>
                                      <div className="flex items-start space-x-2">
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-neutral-900 font-inter">
                                            {formatCurrency(demand.totalAmountDue || 0)}
                                          </div>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                                          isExpanded ? 'rotate-180' : ''
                                        }`} />
                                      </div>
                                    </div>
                                    
                                    {/* Bottom section with Status and Actions */}
                                    <div className="flex items-end justify-between mt-auto">
                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium font-inter ${
                                        demand.status === ServiceChargeDemandStatus.PAID
                                          ? 'bg-success-100 text-success-800'
                                          : demand.status === ServiceChargeDemandStatus.PARTIALLY_PAID
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : isOverdue
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-neutral-100 text-gray-800'
                                      }`}>
                                        {demand.status === ServiceChargeDemandStatus.PARTIALLY_PAID 
                                          ? 'Partially Paid' 
                                          : isOverdue
                                          ? 'Overdue' 
                                          : demand.status === ServiceChargeDemandStatus.PAID
                                          ? 'Paid'
                                          : 'Issued'}
                                      </span>
                                      
                                      {demand.status !== ServiceChargeDemandStatus.PAID && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent tile expansion
                                            handleRecordPayment(demand)
                                          }}
                                          className="text-blue-600 hover:text-blue-800 font-inter text-xs"
                                          title="Record Payment"
                                        >
                                          Record Payment
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Expandable Details */}
                                  {isExpanded && (
                                    <div className="px-3 pb-3 bg-neutral-25">
                                      <div className="pt-3 border-t border-neutral-200 space-y-2">
                                        {/* Due Date and Credit Info */}
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <h5 className="text-xs font-medium text-gray-700 mb-1">Due Date</h5>
                                            <p className={`text-sm font-inter ${
                                              isOverdue ? 'text-red-600 font-semibold' : 'text-neutral-900'
                                            }`}>
                                              {new Date(demand.dueDate).toLocaleDateString('en-GB')}
                                              {isOverdue && (
                                                <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                                                  OVERDUE
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <div>
                                            <h5 className="text-xs font-medium text-gray-700 mb-1">Amount Paid</h5>
                                            <p className="text-sm text-neutral-900 font-inter">
                                              {formatCurrency(demand.amountPaid || 0)}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {/* Credit Applied Info */}
                                        {demand.hasCreditApplied && (
                                          <div>
                                            <h5 className="text-xs font-medium text-gray-700 mb-1">Credit Applied</h5>
                                            <div className="text-green-600 font-medium text-sm">
                                              £{(demand.creditAppliedAmount || 0).toFixed(2)}
                                              <span className="text-xs ml-1 bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                                Original: {formatCurrency((demand.originalAmountBeforeCredit || demand.totalAmountDue) || 0)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Actions */}
                                        <div className="flex items-center justify-end space-x-2 pt-2">
                                          <button
                                            onClick={() => handleViewDemandDetails(demand)}
                                            className="text-primary-600 hover:text-blue-800 font-inter flex items-center text-xs"
                                            title="View Details"
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Details
                                          </button>
                                          {demand.status !== ServiceChargeDemandStatus.PAID && (
                                            <button
                                              onClick={() => handleSendReminder(demand)}
                                              className="text-orange-600 hover:text-orange-800 font-inter flex items-center text-xs"
                                              title="Send Reminder"
                                            >
                                              <Send className="h-3 w-3 mr-1" />
                                              Send Reminder
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
                                            className="text-purple-600 hover:text-purple-800 font-inter flex items-center text-xs"
                                            title="View Flat Ledger"
                                          >
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            Ledger
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              ) : (
                // Desktop Table Layout - Period Accordion
                <div data-testid="invoice-list" data-demands-section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
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
              )}
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

              {/* Expenses Summary (clickable filters) */}
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveStatusFilterTile(null)}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-success-50 border border-success-200 ${
                    activeStatusFilterTile === null ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-success-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Expense Total</h3>
                  <p className={`font-bold text-success-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatusFilterTile(prev => (prev === 'paid' ? null : 'paid'))}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-blue-50 border border-blue-200 ${
                    activeStatusFilterTile === 'paid' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-blue-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Paid</h3>
                  <p className={`font-bold text-primary-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {formatCurrency(expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0))}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatusFilterTile(prev => (prev === 'invoiced' ? null : 'invoiced'))}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-red-50 border border-red-200 ${
                    activeStatusFilterTile === 'invoiced' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-red-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Invoiced</h3>
                  <p className={`font-bold text-red-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {formatCurrency(expenses.filter(e => e.status === 'invoiced').reduce((sum, e) => sum + (e.amount || 0), 0))}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatusFilterTile(prev => (prev === 'forecast' ? null : 'forecast'))}
                  className={`w-full text-left rounded-lg ${
                    isMobile ? 'p-3 min-h-[80px]' : 'p-4'
                  } bg-orange-50 border border-orange-200 ${
                    activeStatusFilterTile === 'forecast' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className={`font-medium text-orange-900 font-inter ${isMobile ? 'text-sm' : ''}`}>Forecast</h3>
                  <p className={`font-bold text-orange-600 font-inter ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {formatCurrency(expenses.filter(e => e.status === 'forecast').reduce((sum, e) => sum + (e.amount || 0), 0))}
                  </p>
                </button>
              </div>

              {/* Expenses Display - Cards on Mobile, Table on Desktop */}
              {isMobile ? (
                // Mobile Card Layout
                <div className="space-y-3">
                  {visibleExpenses.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 text-center">
                      <Receipt className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 font-inter">No Expense Forecasts</h3>
                      <p className="text-gray-600 font-inter">
                        Complete some tickets with final costs to see expense forecasts here
                      </p>
                    </div>
                  ) : (
                    visibleExpenses.map((expense) => {
                      const isExpanded = expandedExpenses.has(expense.id)
                      
                      const toggleExpanded = () => {
                        const newExpanded = new Set(expandedExpenses)
                        if (newExpanded.has(expense.id)) {
                          newExpanded.delete(expense.id)
                        } else {
                          newExpanded.add(expense.id)
                        }
                        setExpandedExpenses(newExpanded)
                      }
                      
                      return (
                        <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                          {/* Main clickable area */}
                          <div 
                            onClick={toggleExpanded}
                            className="p-2 flex flex-col min-h-[60px] cursor-pointer hover:bg-neutral-50 transition-colors"
                          >
                            {/* Top section with Contractor and Amount */}
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 pr-2">
                                <h4 className="text-sm font-medium text-neutral-900 font-inter truncate">
                                  {expense.vendorName || expense.supplierName || 'Unknown Supplier'}
                                </h4>
                              </div>
                              <div className="flex items-start space-x-2">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-neutral-900 font-inter">
                                    {formatCurrency(expense.amount || 0)}
                                  </div>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`} />
                              </div>
                            </div>
                            
                            {/* Bottom section with Status and Actions */}
                            <div className="flex items-end justify-between mt-auto">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium font-inter ${
                                expense.status === 'forecast'
                                  ? 'bg-orange-100 text-orange-800'
                                  : expense.status === 'invoiced'
                                  ? 'bg-red-100 text-red-800'
                                  : expense.status === 'paid'
                                  ? 'bg-success-100 text-success-800'
                                  : 'bg-neutral-100 text-gray-800'
                              }`}>
                                {expense.status === 'forecast' ? 'Pending' : expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </span>
                              
                              {expense.status === 'invoiced' && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation(); // Prevent tile expansion
                                    try {
                                      await expenseService.markExpenseAsPaid(expense.id)
                                      addNotification({
                                        userId: currentUser?.id || '',
                                        title: 'Success',
                                        message: 'Expense marked as paid',
                                        type: 'success'
                                      })
                                      await loadFinancialData()
                                    } catch (error) {
                                      addNotification({
                                        userId: currentUser?.id || '',
                                        title: 'Error',
                                        message: 'Failed to mark expense as paid',
                                        type: 'error'
                                      })
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-inter text-xs"
                                  title="Mark as Paid"
                                >
                                  Mark as Paid
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Expandable Details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                              {/* Ticket Description */}
                              <div>
                                <h5 className="text-xs font-medium text-gray-700 mb-1">Description</h5>
                                <p className="text-sm text-neutral-900 font-inter">{expense.description}</p>
                              </div>
                              
                              {/* Date, Ticket ID and Category */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">Date Created</h5>
                                  <p className="text-sm text-neutral-900 font-inter">
                                    {new Date(expense.createdAt).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                                {expense.ticketId && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-1">Ticket ID</h5>
                                    <p className="text-sm text-neutral-900 font-inter">
                                      {expense.ticketId.substring(0, 8)}...
                                    </p>
                                  </div>
                                )}
                                {expense.category && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-1">Category</h5>
                                    <p className="text-sm text-neutral-900 font-inter capitalize">
                                      {expense.category.replace('_', ' ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center justify-end space-x-2 pt-2">
                                {expense.ticketId && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const ticket = await ticketService.getTicketById(expense.ticketId)
                                        if (ticket) {
                                          setSelectedTicketForModal(ticket)
                                          setIsTicketModalOpen(true)
                                        } else {
                                          addNotification({
                                            userId: currentUser?.id || '',
                                            title: 'Error',
                                            message: 'Ticket not found',
                                            type: 'error'
                                          })
                                        }
                                      } catch (error) {
                                        addNotification({
                                          userId: currentUser?.id || '',
                                          title: 'Error',
                                          message: 'Failed to load ticket details',
                                          type: 'error'
                                        })
                                      }
                                    }}
                                    className="text-primary-600 hover:text-blue-800 font-inter flex items-center text-xs"
                                    title="View Ticket"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Ticket
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
                                    className="text-success-600 hover:text-success-800 font-inter flex items-center text-xs"
                                    title="Mark as Invoiced"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark Invoiced
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
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
                        {visibleExpenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-sm text-neutral-900 font-inter">
                              <div>
                                {expense.ticketId ? (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const ticket = await ticketService.getTicketById(expense.ticketId)
                                        if (ticket) {
                                          setSelectedTicketForModal(ticket)
                                          setIsTicketModalOpen(true)
                                        } else {
                                          addNotification({
                                            userId: currentUser?.id || '',
                                            title: 'Error',
                                            message: 'Ticket not found',
                                            type: 'error'
                                          })
                                        }
                                      } catch (error) {
                                        addNotification({
                                          userId: currentUser?.id || '',
                                          title: 'Error',
                                          message: 'Failed to load ticket details',
                                          type: 'error'
                                        })
                                      }
                                    }}
                                    className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-left"
                                    title="View related ticket"
                                  >
                                    {expense.description}
                                  </button>
                                ) : (
                                  <div className="font-medium">{expense.description}</div>
                                )}
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
                                {expense.status === 'forecast' ? 'Pending' : expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 font-inter">
                              {new Date(expense.createdAt).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
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
                                    className="text-success-600 hover:text-success-800 font-inter flex items-center"
                                    title="Mark as Invoiced"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Invoiced
                                  </button>
                                )}
                                {expense.status === 'invoiced' && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await expenseService.markExpenseAsPaid(expense.id)
                                        addNotification({
                                          userId: currentUser?.id || '',
                                          title: 'Success',
                                          message: 'Expense marked as paid',
                                          type: 'success'
                                        })
                                        await loadFinancialData()
                                      } catch (error) {
                                        addNotification({
                                          userId: currentUser?.id || '',
                                          title: 'Error',
                                          message: 'Failed to mark expense as paid',
                                          type: 'error'
                                        })
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-inter"
                                    title="Mark as Paid"
                                  >
                                    Mark as Paid
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

      {/* Budget Setup Modal */}
      {showBudgetSetup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal" 
          style={{ zIndex: 1400 }}
          onClick={() => setShowBudgetSetup(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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

                {/* Previous Year Budget Section */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  {/* Header with Year */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-medium text-neutral-700 font-inter">Previous Budget</h3>
                    <div className="text-sm font-semibold text-neutral-900 font-inter px-2 py-1 bg-white border border-neutral-200 rounded">
                      {previousYearBudget ? previousYearBudget.year : budgetForm.year - 1}
                    </div>
                  </div>
                  
                  {/* Stacked fields */}
                  {previousYearBudget ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-500 font-inter">
                          Total Amount:
                        </label>
                        <div className="text-sm font-semibold text-neutral-900 font-inter">
                          £{previousYearBudget.totalBudgetAmount?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-500 font-inter">
                          Rate per Sq Ft:
                        </label>
                        <div className="text-sm font-semibold text-neutral-900 font-inter">
                          £{previousYearBudget.ratePerSqFt?.toFixed(2) || '0.00'}/sqft
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-500 font-inter">
                          Total Amount:
                        </label>
                        <div className="text-sm text-neutral-400 font-inter">
                          No data
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-500 font-inter">
                          Rate per Sq Ft:
                        </label>
                        <div className="text-sm text-neutral-400 font-inter">
                          No data
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2 font-inter italic">
                        No budget was created for {budgetForm.year - 1}. Starting fresh this year.
                      </p>
                    </div>
                  )}
                </div>

                {/* Annual Budget Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {/* Header with Year */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-medium text-neutral-700 font-inter">Annual Budget</h3>
                    <Input
                      type="number"
                      value={budgetForm.year}
                      onChange={(e) => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) })}
                      required
                      className="w-20 text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                      data-testid="budget-year"
                    />
                  </div>
                  
                  {/* Stacked fields */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-500 font-inter">
                        Total Amount:
                      </label>
                      <div className="text-sm font-semibold text-neutral-900 font-inter">
                        £{budgetForm.totalBudgetAmount.toLocaleString('en-GB')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-500 font-inter">
                        Proposed Rate:
                      </label>
                      <div className="text-sm font-semibold text-neutral-900 font-inter">
                        £{budgetForm.ratePerSqFt.toFixed(2)}/sqft
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget Categories Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-neutral-700 font-inter">Budget Categories</h3>
                    <div className="flex gap-2">
                      {isMobile ? (
                        // Mobile: Icon buttons
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCategoryManagement(true)
                              loadBudgetCategoryMasters()
                            }}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Manage Categories"
                          >
                            <Settings className="h-4 w-4 text-neutral-600" />
                          </button>
                          {budgetCategoryMasters.length > 0 && budgetForm.categories.length === 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="Quick Add"
                              >
                                <Plus className="h-4 w-4 text-neutral-600" />
                              </button>
                              {showQuickAddDropdown && (
                                <div className="absolute right-0 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                                  <div className="p-2">
                                    <button
                                      type="button"
                                      onClick={handleQuickAddAllCategories}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded font-inter"
                                    >
                                      Add all category masters ({budgetCategoryMasters.filter(m => !budgetForm.categories.some(c => c.name.toLowerCase() === m.name.toLowerCase())).length})
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        // Desktop: Text buttons
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCategoryManagement(true)
                              loadBudgetCategoryMasters() // Reload to ensure fresh data
                            }}
                          >
                            Manage
                          </Button>
                          {budgetCategoryMasters.length > 0 && budgetForm.categories.length === 0 && (
                            <div className="relative">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowQuickAddDropdown(!showQuickAddDropdown)}
                              >
                                Quick Add ▾
                              </Button>
                              {showQuickAddDropdown && (
                                <div className="absolute right-0 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                                  <div className="p-2">
                                    <button
                                      type="button"
                                      onClick={handleQuickAddAllCategories}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded font-inter"
                                    >
                                      Add all category masters ({budgetCategoryMasters.filter(m => !budgetForm.categories.some(c => c.name.toLowerCase() === m.name.toLowerCase())).length})
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Categories - Desktop Table / Mobile Accordion */}
                    {budgetForm.categories.length > 0 ? (
                      isMobile ? (
                        // Mobile: Accordion Style
                        <div className="space-y-2">
                          {budgetForm.categories.map((category, index) => {
                            const isExpanded = expandedModalCategories.has(category.id)
                            
                            return (
                              <div key={category.id} className="bg-white rounded-lg border border-neutral-200">
                                <div className="p-2.5 flex items-center justify-between gap-2">
                                  <div
                                    onClick={() => {
                                      const newExpanded = new Set(expandedModalCategories)
                                      if (newExpanded.has(category.id)) {
                                        newExpanded.delete(category.id)
                                      } else {
                                        newExpanded.add(category.id)
                                      }
                                      setExpandedModalCategories(newExpanded)
                                    }}
                                    className="flex-1 min-w-0 cursor-pointer"
                                  >
                                    <h4 className="text-sm font-medium text-neutral-900 font-inter truncate">
                                      {category.name}
                                    </h4>
                                    <div className="text-xs text-neutral-600 font-inter mt-0.5">
                                      £{(category.budgetAmount || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeBudgetCategory(category.id)
                                      }}
                                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Delete category"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedModalCategories)
                                        if (newExpanded.has(category.id)) {
                                          newExpanded.delete(category.id)
                                        } else {
                                          newExpanded.add(category.id)
                                        }
                                        setExpandedModalCategories(newExpanded)
                                      }}
                                      className="p-1"
                                    >
                                      <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`} />
                                    </button>
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-0 border-t border-neutral-100">
                                    <div className="space-y-3 mt-3">
                                      <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">
                                          Category Name
                                        </label>
                                        <div className="text-sm text-neutral-900 font-inter p-2 bg-neutral-50 rounded border border-neutral-200">
                                          {category.name}
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 italic">
                                          To change the category name, use the Settings icon above
                                        </p>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">
                                          Budget Amount (£)
                                        </label>
                                        <Input
                                          type="text"
                                          value={category.budgetAmount ? category.budgetAmount.toLocaleString('en-GB') : ''}
                                          onChange={(e) => {
                                            const rawValue = e.target.value.replace(/,/g, '')
                                            const numValue = parseFloat(rawValue) || 0
                                            updateBudgetCategory(category.id, { budgetAmount: numValue })
                                          }}
                                          placeholder="0"
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        // Desktop: Table
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-300">
                                <th className="text-left text-xs font-medium text-neutral-600 py-2 px-2 font-inter">Category Name</th>
                                <th className="text-right text-xs font-medium text-neutral-600 py-2 px-2 font-inter w-32">Amount (£)</th>
                                <th className="text-right text-xs font-medium text-neutral-600 py-2 px-2 font-inter w-20">%</th>
                                <th className="w-12"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {budgetForm.categories.map((category, index) => {
                                const percentage = budgetForm.totalBudgetAmount > 0
                                  ? ((category.budgetAmount || 0) / budgetForm.totalBudgetAmount * 100).toFixed(1)
                                  : '0.0'
                                return (
                                <tr key={category.id} className="border-b border-neutral-200 last:border-0">
                                  <td className="py-1 px-2">
                                    <div className="text-sm text-neutral-900 font-inter px-2 h-8 flex items-center bg-neutral-50 rounded">
                                      {category.name}
                                    </div>
                                  </td>
                                  <td className="py-1 px-2">
                                    <Input
                                      type="text"
                                      value={category.budgetAmount ? category.budgetAmount.toLocaleString('en-GB') : ''}
                                      onChange={(e) => {
                                        const rawValue = e.target.value.replace(/,/g, '')
                                        const numValue = parseFloat(rawValue) || 0
                                        updateBudgetCategory(category.id, { budgetAmount: numValue })
                                      }}
                                      placeholder="0"
                                      className="text-sm text-right border-0 bg-white shadow-none focus:ring-1 focus:ring-primary-500 focus:outline-none px-2 h-8 rounded w-full"
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-right text-sm text-neutral-600 bg-neutral-50">
                                    {percentage}%
                                  </td>
                                  <td className="py-1 text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeBudgetCategory(category.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              )})}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-6 text-neutral-500">
                        <p className="text-sm font-inter">No categories added yet.</p>
                        <p className="text-xs font-inter mt-1">Click "Quick Add" to get started.</p>
                      </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className={`flex items-center pt-6 border-t border-neutral-200 ${
                  isMobile ? 'flex-col gap-2 w-full' : 'justify-between'
                }`}>
                  {isMobile ? (
                    // Mobile: Horizontally aligned buttons
                    <>
                      <Button 
                        variant="secondary" 
                        type="button" 
                        onClick={() => setShowBudgetSetup(false)}
                        className="w-full min-h-[44px]"
                      >
                        Cancel
                      </Button>
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={handleSaveDraft}
                          disabled={!selectedBuildingId}
                          className="flex-1 min-h-[44px]"
                        >
                          Save Draft
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading || !selectedBuildingId || !budgetValidation?.isValid} 
                          loading={loading}
                          className="flex-1 min-h-[44px]"
                          data-testid="save-budget"
                        >
                          {budget ? 'Update' : 'Create'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Desktop: Original layout
                    <>
                      <Button 
                        variant="secondary" 
                        type="button" 
                        onClick={() => setShowBudgetSetup(false)}
                      >
                        Cancel
                      </Button>
                      <div className="flex space-x-3">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={handleSaveDraft}
                          disabled={!selectedBuildingId}
                        >
                          Save Draft
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading || !selectedBuildingId || !budgetValidation?.isValid} 
                          loading={loading}
                          data-testid="save-budget"
                        >
                          {budget ? 'Update' : 'Create Budget'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryManagement && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal" 
          style={{ zIndex: 1500 }}
          onClick={() => setShowCategoryManagement(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 font-inter">
                  Manage Budget Categories
                </h2>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCategoryManagement(false)} aria-label="Close">
                                  <X className="h-6 w-6" />
                                </Button>
              </div>

              {/* Add New and Merge - Side by Side */}
              <div className="mb-4">
                {/* Headers Side by Side */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Add New Category Header */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNewCategorySection(!showAddNewCategorySection);
                      if (!showAddNewCategorySection) setShowMergeCategorySection(false);
                    }}
                    className="flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                  >
                    <h3 className="text-xs font-medium text-neutral-900 font-inter">
                      Add New
                    </h3>
                    <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                      showAddNewCategorySection ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Merge Categories Header */}
                  {budgetCategoryMasters.length >= 2 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMergeCategorySection(!showMergeCategorySection);
                        if (!showMergeCategorySection) setShowAddNewCategorySection(false);
                      }}
                      className="flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                    >
                      <h3 className="text-xs font-medium text-neutral-900 font-inter">
                        Merge
                      </h3>
                      <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                        showMergeCategorySection ? 'rotate-180' : ''
                      }`} />
                    </button>
                  ) : (
                    <div className="flex items-center justify-center p-3 bg-neutral-100 rounded-lg border border-neutral-200 opacity-50">
                      <h3 className="text-xs font-medium text-neutral-500 font-inter">
                        Merge
                      </h3>
                    </div>
                  )}
                </div>

                {/* Expanded Content - Full Width */}
                {showAddNewCategorySection && (
                  <div className="p-4 bg-white rounded-lg border border-neutral-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                          Category Name *
                        </label>
                        <Input
                          type="text"
                          value={categoryMasterForm.name}
                          onChange={(e) => setCategoryMasterForm({ ...categoryMasterForm, name: e.target.value })}
                          placeholder="Enter category name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                          Description
                        </label>
                        <Input
                          type="text"
                          value={categoryMasterForm.description}
                          onChange={(e) => setCategoryMasterForm({ ...categoryMasterForm, description: e.target.value })}
                          placeholder="Optional description"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button type="button" size="sm" onClick={handleCreateCategoryMaster} disabled={!categoryMasterForm.name.trim()}>
                        Create Category
                      </Button>
                    </div>
                  </div>
                )}

                {showMergeCategorySection && budgetCategoryMasters.length >= 2 && (
                  <div className="p-4 bg-white rounded-lg border border-neutral-200">
                    <p className="text-xs text-neutral-600 font-inter mb-3">
                      Merge two categories into one to preserve data integrity.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                          Source (to merge)
                        </label>
                        <Dropdown
                          options={budgetCategoryMasters.map(cat => ({
                            value: cat.id,
                            label: cat.name
                          }))}
                          value={mergingCategories?.sourceId || ''}
                          onChange={(value) => setMergingCategories(prev => ({ ...prev, sourceId: value, targetId: prev?.targetId || '' }))}
                          placeholder="Select source..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                          Target (to keep)
                        </label>
                        <Dropdown
                          options={budgetCategoryMasters
                            .filter(cat => cat.id !== mergingCategories?.sourceId)
                            .map(cat => ({
                              value: cat.id,
                              label: cat.name
                            }))}
                          value={mergingCategories?.targetId || ''}
                          onChange={(value) => setMergingCategories(prev => ({ sourceId: prev?.sourceId || '', targetId: value }))}
                          placeholder="Select target..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button 
                        type="button"
                        size="sm" 
                        onClick={handleMergeCategoryMasters} 
                        disabled={!mergingCategories?.sourceId || !mergingCategories?.targetId}
                      >
                        Merge
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Categories */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 font-inter mb-3">
                  Existing Categories
                </h3>
                {loadingCategoryMasters ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-neutral-500 font-inter mt-2">Loading categories...</p>
                  </div>
                ) : budgetCategoryMasters.length > 0 ? (
                  <div className="space-y-2">
                    {budgetCategoryMasters.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-neutral-900 font-inter">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-neutral-500 font-inter mt-1">{category.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingCategory(category)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 font-inter text-center py-4">
                    No categories created yet. Add your first category above.
                  </p>
                )}
              </div>


              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <Button type="button" onClick={() => setShowCategoryManagement(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategoryMaster && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal" 
          style={{ zIndex: 1600 }}
          onClick={() => {
            setShowEditCategoryModal(false)
            setEditingCategoryMaster(null)
            setCategoryMasterForm({ name: '', description: '' })
            setMergingCategories(null)
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 font-inter">
                  Edit Category: {editingCategoryMaster.name}
                </h2>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowEditCategoryModal(false)
                    setEditingCategoryMaster(null)
                    setCategoryMasterForm({ name: '', description: '' })
                    setMergingCategories(null)
                  }} 
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Edit Category Form */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="text-sm font-medium text-neutral-900 font-inter mb-3">
                  Category Details
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                      Category Name *
                    </label>
                    <Input
                      type="text"
                      value={categoryMasterForm.name}
                      onChange={(e) => setCategoryMasterForm({ ...categoryMasterForm, name: e.target.value })}
                      placeholder="Enter category name"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                      Description
                    </label>
                    <Input
                      type="text"
                      value={categoryMasterForm.description}
                      onChange={(e) => setCategoryMasterForm({ ...categoryMasterForm, description: e.target.value })}
                      placeholder="Optional description"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button 
                    type="button"
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      setShowEditCategoryModal(false)
                      setEditingCategoryMaster(null)
                      setCategoryMasterForm({ name: '', description: '' })
                      setMergingCategories(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleUpdateCategoryMaster} disabled={!categoryMasterForm.name.trim()}>
                    Update Category
                  </Button>
                </div>
              </div>

              {/* Merge Section */}
              {budgetCategoryMasters.length >= 2 && (
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-900 font-inter mb-3">
                    Merge This Category
                  </h3>
                  <p className="text-xs text-neutral-600 font-inter mb-3">
                    Merge this category into another to preserve data integrity. This category will be deactivated and all references will point to the target category.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1 font-inter">
                      Merge into (Target Category)
                    </label>
                    <Dropdown
                      options={budgetCategoryMasters
                        .filter(cat => cat.id !== editingCategoryMaster.id)
                        .map(cat => ({
                          value: cat.id,
                          label: cat.name
                        }))}
                      value={mergingCategories?.targetId || ''}
                      onChange={(value) => setMergingCategories({ sourceId: editingCategoryMaster.id, targetId: value })}
                      placeholder="Select target category..."
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={handleMergeCategoryMasters} 
                      disabled={!mergingCategories?.targetId}
                    >
                      Merge Categories
                    </Button>
                  </div>
                </div>
              )}
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

      {/* Ticket Detail Modal */}
      {selectedTicketForModal && (
        <TicketDetailModal
          ticket={selectedTicketForModal}
          isOpen={isTicketModalOpen}
          onClose={handleCloseTicketModal}
          onUpdate={handleTicketUpdate}
        />
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

      {/* Period selection and confirmation modals removed - now using direct flow with disabled button */}

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
                        Pending
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

    </div>
  )
}

export default Finances
