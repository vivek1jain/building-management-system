import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building, 
  Users, 
  Home, 
  DollarSign, 
  Wrench, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  FileText,
  CreditCard,
  PiggyBank,
  Star,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  CheckSquare,
  Square,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye as EyeIcon,
  FileText as FileTextIcon,
  CreditCard as CreditCardIcon,
  PiggyBank as PiggyBankIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Clock as ClockIcon,
  Star as StarIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { 
  PersonStatus, 
  WorkOrderStatus, 
  ServiceChargeDemandStatus,
  ComprehensiveDashboardStats 
} from '../types'
import { getFlatStats } from '../services/flatService'
import { getPeopleStats } from '../services/peopleService'
import { getServiceChargeStats } from '../services/serviceChargeService'
import { getWorkOrderStats } from '../services/workOrderService'
import { budgetService } from '../services/budgetService'
import { getInvoiceStats } from '../services/invoiceService'
import { getAllBuildings, getBuildingStats } from '../services/buildingService'

interface FlatStats {
  totalFlats: number
  occupiedFlats: number
  totalArea: number
  averageArea: number
  totalGroundRent: number
}

interface PeopleStats {
  totalPeople: number
  byStatus: Record<PersonStatus, number>
  byRole: Record<string, number>
  primaryContacts: number
  withFlats: number
  pendingApproval: number
}

interface ServiceChargeStats {
  totalDemands: number
  totalAmountDue: number
  totalAmountPaid: number
  totalOutstanding: number
  byStatus: Record<ServiceChargeDemandStatus, number>
  overdueDemands: number
  overdueAmount: number
}

interface WorkOrderStats {
  totalWorkOrders: number
  byStatus: Record<WorkOrderStatus, number>
  byPriority: Record<string, number>
  urgentWorkOrders: number
  resolvedThisMonth: number
  averageResolutionTime: number
}

const ComprehensiveDashboard = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [currentYear] = useState(new Date().getFullYear())
  
  // Stats state
  const [flatStats, setFlatStats] = useState<FlatStats>({
    totalFlats: 0,
    occupiedFlats: 0,
    totalArea: 0,
    averageArea: 0,
    totalGroundRent: 0
  })
  
  const [peopleStats, setPeopleStats] = useState<PeopleStats>({
    totalPeople: 0,
    byStatus: {} as Record<PersonStatus, number>,
    byRole: {} as Record<string, number>,
    primaryContacts: 0,
    withFlats: 0,
    pendingApproval: 0
  })
  
  const [serviceChargeStats, setServiceChargeStats] = useState<ServiceChargeStats>({
    totalDemands: 0,
    totalAmountDue: 0,
    totalAmountPaid: 0,
    totalOutstanding: 0,
    byStatus: {} as Record<ServiceChargeDemandStatus, number>,
    overdueDemands: 0,
    overdueAmount: 0
  })
  
  const [workOrderStats, setWorkOrderStats] = useState<WorkOrderStats>({
    totalWorkOrders: 0,
    byStatus: {} as Record<WorkOrderStatus, number>,
    byPriority: {} as Record<string, number>,
    urgentWorkOrders: 0,
    resolvedThisMonth: 0,
    averageResolutionTime: 0
  })
  
  const [budgetStats, setBudgetStats] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    budgetUtilization: 0
  })
  
  const [invoiceStats, setInvoiceStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    overdueCount: 0
  })

  useEffect(() => {
    loadComprehensiveData()
  }, [])

  const loadComprehensiveData = async () => {
    try {
      setLoading(true)
      
      // Get buildings for the current user
      const buildings = await getAllBuildings()
      const currentBuilding = buildings[0] // For now, use first building
      
      if (!currentBuilding) {
        addNotification({
          title: 'No Buildings Found',
          message: 'Please create a building first to view dashboard data.',
          type: 'warning',
          userId: 'current'
        })
        setLoading(false)
        return
      }

      // Load all data in parallel
      const [
        flatStatsData,
        peopleStatsData,
        serviceChargeStatsData,
        workOrderStatsData,
        budgetStatsData,
        invoiceStatsData
      ] = await Promise.allSettled([
        getFlatStats(currentBuilding.id),
        getPeopleStats(currentBuilding.id),
        getServiceChargeStats(currentBuilding.id),
        getWorkOrderStats(currentBuilding.id),
        budgetService.getBudgetStats(currentBuilding.id, currentYear),
        getInvoiceStats(currentBuilding.id)
      ])

      // Set flat stats
      if (flatStatsData.status === 'fulfilled') {
        setFlatStats(flatStatsData.value)
      }

      // Set people stats
      if (peopleStatsData.status === 'fulfilled') {
        setPeopleStats(peopleStatsData.value)
      }

      // Set service charge stats
      if (serviceChargeStatsData.status === 'fulfilled') {
        setServiceChargeStats(serviceChargeStatsData.value)
      }

      // Set work order stats
      if (workOrderStatsData.status === 'fulfilled') {
        setWorkOrderStats(workOrderStatsData.value)
      }

      // Set budget stats
      if (budgetStatsData.status === 'fulfilled') {
        setBudgetStats(budgetStatsData.value)
      }

      // Set invoice stats
      if (invoiceStatsData.status === 'fulfilled') {
        setInvoiceStats(invoiceStatsData.value)
      }

    } catch (error: any) {
      console.error('Error loading comprehensive dashboard data:', error)
      addNotification({
        title: 'Error Loading Dashboard',
        message: error.message || 'Failed to load dashboard data.',
        type: 'error',
        userId: 'current'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Resolved':
      case 'Complete':
        return 'text-success-600 bg-success-100'
      case 'Pending':
      case 'In Progress':
        return 'text-yellow-600 bg-yellow-100'
      case 'Overdue':
      case 'Urgent':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-neutral-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Comprehensive Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Complete overview of your building management system - {currentYear}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/flats"
            className="btn-primary flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Manage Flats</span>
          </Link>
          <Link
            to="/people"
            className="btn-secondary flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>People</span>
          </Link>
        </div>
      </div>

      {/* Building Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Flats Overview */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Flats</p>
              <p className="text-2xl font-bold text-neutral-900">{flatStats.totalFlats}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-primary-600">{flatStats.occupiedFlats} occupied</span>
            </div>
          </div>
        </div>

        {/* People Overview */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total People</p>
              <p className="text-2xl font-bold text-neutral-900">{peopleStats.totalPeople}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">{peopleStats.pendingApproval} pending</span>
            </div>
          </div>
        </div>

        {/* Service Charges Overview */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Service Charges</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(serviceChargeStats.totalAmountDue)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
              <span className="text-success-600">{formatCurrency(serviceChargeStats.totalAmountPaid)} collected</span>
            </div>
          </div>
        </div>

        {/* Work Orders Overview */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Work Orders</p>
              <p className="text-2xl font-bold text-neutral-900">{workOrderStats.totalWorkOrders}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600">{workOrderStats.urgentWorkOrders} urgent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flats & People Management */}
        <div className="space-y-6">
          {/* Flats Statistics */}
          <div className="card">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Flats Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Area</p>
                <p className="text-lg font-semibold text-neutral-900">{flatStats.totalArea.toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Area</p>
                <p className="text-lg font-semibold text-neutral-900">{Math.round(flatStats.averageArea)} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupancy Rate</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {flatStats.totalFlats > 0 ? Math.round((flatStats.occupiedFlats / flatStats.totalFlats) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ground Rent</p>
                <p className="text-lg font-semibold text-neutral-900">{formatCurrency(flatStats.totalGroundRent)}</p>
              </div>
            </div>
          </div>

          {/* People Statistics */}
          <div className="card">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">People Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Primary Contacts</span>
                <span className="font-semibold text-neutral-900">{peopleStats.primaryContacts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">With Flats</span>
                <span className="font-semibold text-neutral-900">{peopleStats.withFlats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Approval</span>
                <span className="font-semibold text-red-600">{peopleStats.pendingApproval}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Work Order Management */}
        <div className="space-y-6">
          {/* Service Charge Statistics */}
          <div className="card">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Service Charges</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Demands</span>
                <span className="font-semibold text-neutral-900">{serviceChargeStats.totalDemands}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Outstanding Amount</span>
                <span className="font-semibold text-red-600">{formatCurrency(serviceChargeStats.totalOutstanding)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue Demands</span>
                <span className="font-semibold text-red-600">{serviceChargeStats.overdueDemands}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="font-semibold text-success-600">
                  {serviceChargeStats.totalAmountDue > 0 
                    ? Math.round((serviceChargeStats.totalAmountPaid / serviceChargeStats.totalAmountDue) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Work Order Statistics */}
          <div className="card">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Work Orders</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolved This Month</span>
                <span className="font-semibold text-success-600">{workOrderStats.resolvedThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Urgent Orders</span>
                <span className="font-semibold text-red-600">{workOrderStats.urgentWorkOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-semibold text-yellow-600">
                  {workOrderStats.byStatus[WorkOrderStatus.IN_REPAIR] || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/flats"
            className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
          >
            <Home className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-neutral-900">Manage Flats</p>
              <p className="text-sm text-gray-600">View and edit flat details</p>
            </div>
          </Link>
          
          <Link
            to="/people"
            className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
          >
            <Users className="h-5 w-5 text-success-600 mr-3" />
            <div>
              <p className="font-medium text-neutral-900">People Management</p>
              <p className="text-sm text-gray-600">Manage residents and contacts</p>
            </div>
          </Link>
          
          <Link
            to="/financial-management"
            className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
          >
            <CreditCard className="h-5 w-5 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-neutral-900">Financial Management</p>
              <p className="text-sm text-gray-600">Service charges, income & expenses</p>
            </div>
          </Link>
          
          <Link
            to="/work-orders"
            className="flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
          >
            <Wrench className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-neutral-900">Work Orders</p>
              <p className="text-sm text-gray-600">Track maintenance requests</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Alerts Section */}
      {(serviceChargeStats.overdueDemands > 0 || workOrderStats.urgentWorkOrders > 0 || peopleStats.pendingApproval > 0) && (
        <div className="card">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Alerts</h3>
          <div className="space-y-3">
            {serviceChargeStats.overdueDemands > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">Overdue Service Charges</p>
                  <p className="text-sm text-red-700">
                    {serviceChargeStats.overdueDemands} demands overdue with {formatCurrency(serviceChargeStats.overdueAmount)} outstanding.
                  </p>
                </div>
              </div>
            )}
            
            {workOrderStats.urgentWorkOrders > 0 && (
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Urgent Work Orders</p>
                  <p className="text-sm text-orange-700">
                    {workOrderStats.urgentWorkOrders} urgent work orders require immediate attention.
                  </p>
                </div>
              </div>
            )}
            
            {peopleStats.pendingApproval > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending Approvals</p>
                  <p className="text-sm text-yellow-700">
                    {peopleStats.pendingApproval} people are waiting for approval.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComprehensiveDashboard 