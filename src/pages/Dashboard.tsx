import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Link } from 'react-router-dom'
import { budgetService } from '../services/budgetService'
import { 
  getInvoiceStats 
} from '../services/invoiceService'
import { 
  getAllBuildings
} from '../services/buildingService'
import { 
  getIncomeStats, 
  getExpenditureStats,
  getBuildingFinancialSummary
} from '../services/serviceChargeService'
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  CreditCard
} from 'lucide-react'
import DataSeeder from '../components/DataSeeder'

// Define missing types
interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: string;
}

interface TicketItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo: string;
}

const Dashboard: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(true)
  const [budgetStats, setBudgetStats] = useState<any>(null)
  const [invoiceStats, setInvoiceStats] = useState<any>(null)
  const [incomeStats, setIncomeStats] = useState<any>(null)
  const [expenditureStats, setExpenditureStats] = useState<any>(null)
  const [financialSummary, setFinancialSummary] = useState<any>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tickets, setTickets] = useState<TicketItem[]>([])

  useEffect(() => {
    if (firebaseUser?.uid) {
      loadDashboardData()
    }
  }, [firebaseUser])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load buildings first
      const buildingsData = await getAllBuildings()
      
      if (buildingsData.length > 0) {
        const selectedBuilding = buildingsData[0].id
        const currentYear = new Date().getFullYear()
        
        // Load all data in parallel
        const [
          budgetStatsData,
          invoiceStatsData,
          incomeStatsData,
          expenditureStatsData
        ] = await Promise.all([
          budgetService.getBudgetStats(selectedBuilding, currentYear),
          getInvoiceStats(selectedBuilding),
          getIncomeStats(selectedBuilding),
          getExpenditureStats(selectedBuilding)
        ])
        
        // Load financial summary separately to handle potential errors
        let financialSummaryData = null
        try {
          const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${currentYear}`
          financialSummaryData = await getBuildingFinancialSummary(selectedBuilding, currentQuarter)
        } catch (error) {
          console.error('Error loading financial summary:', error)
          // Continue without financial summary
        }
        
        setBudgetStats(budgetStatsData)
        setInvoiceStats(invoiceStatsData)
        setIncomeStats(incomeStatsData)
        setExpenditureStats(expenditureStatsData)
        setFinancialSummary(financialSummaryData)
        
        // Load mock data for other components
        loadMockData()
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Error loading dashboard data',
          type: 'error',
          userId: currentUser.id
        })
      }
      loadMockData() // Fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    // Mock category breakdown
    setCategoryBreakdown([
      { category: 'Maintenance', amount: 45000, percentage: 30 },
      { category: 'Utilities', amount: 30000, percentage: 20 },
      { category: 'Insurance', amount: 25000, percentage: 17 },
      { category: 'Cleaning', amount: 20000, percentage: 13 },
      { category: 'Security', amount: 15000, percentage: 10 },
      { category: 'Other', amount: 15000, percentage: 10 }
    ])

    // Mock todos
    setTodos([
      { id: '1', title: 'Review Q1 financial reports', completed: false, priority: 'high' },
      { id: '2', title: 'Schedule building maintenance', completed: false, priority: 'medium' },
      { id: '3', title: 'Update resident contact list', completed: true, priority: 'low' },
      { id: '4', title: 'Process vendor payments', completed: false, priority: 'high' },
      { id: '5', title: 'Check security system', completed: false, priority: 'medium' }
    ])

    // Mock events
    setEvents([
      { id: '1', title: 'Building Inspection', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), type: 'maintenance' },
      { id: '2', title: 'Resident Meeting', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), type: 'meeting' },
      { id: '3', title: 'Fire Safety Drill', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), type: 'safety' },
      { id: '4', title: 'Vendor Payment Due', date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), type: 'financial' }
    ])

    // Mock tickets
    setTickets([
      { id: '1', title: 'Leaking pipe in unit 3A', status: 'In Progress', priority: 'high', assignedTo: 'John Smith' },
      { id: '2', title: 'Broken elevator', status: 'Scheduled', priority: 'urgent', assignedTo: 'Mike Johnson' },
      { id: '3', title: 'Lighting issue in lobby', status: 'New', priority: 'medium', assignedTo: 'Unassigned' },
      { id: '4', title: 'HVAC maintenance', status: 'Complete', priority: 'low', assignedTo: 'Sarah Wilson' }
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'text-blue-600 bg-blue-100'
      case 'In Progress': return 'text-yellow-600 bg-yellow-100'
      case 'Scheduled': return 'text-purple-600 bg-purple-100'
      case 'Complete': return 'text-green-600 bg-green-100'
      case 'Closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser.name}</p>
        </div>

        {/* Data Seeder Component */}
        <DataSeeder />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Income */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${financialSummary?.totalIncome?.toLocaleString() || incomeStats?.totalIncome?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Expenditure */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Expenditure</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${financialSummary?.totalExpenditure?.toLocaleString() || expenditureStats?.totalExpenditure?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${financialSummary?.netCashFlow && financialSummary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${financialSummary?.netCashFlow?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Outstanding Charges */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Outstanding Charges</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${invoiceStats?.overdueAmount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget and Invoice Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Budget</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${budgetStats?.totalBudget?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Budget Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${budgetStats?.totalSpent?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {invoiceStats?.pendingCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {invoiceStats?.overdueCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    to="/financial-management"
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Financial Management</p>
                      <p className="text-sm text-gray-600">Service charges, income & expenses</p>
                    </div>
                  </Link>

                  <Link
                    to="/budget"
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Budget Management</p>
                      <p className="text-sm text-gray-600">Plan & track spending</p>
                    </div>
                  </Link>

                  <Link
                    to="/comprehensive"
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <BarChart3 className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Comprehensive Dashboard</p>
                      <p className="text-sm text-gray-600">View all advanced features</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity and Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Recent Tickets */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Tickets</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {tickets.slice(0, 4).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{ticket.assignedTo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link to="/tickets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View all tickets →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {events.slice(0, 4).map((event) => (
                      <div key={event.id} className="flex items-center">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date.toLocaleDateString()}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {event.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link to="/events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View all events →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Todo List and Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Todo List */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Todo List</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {todos.slice(0, 5).map((todo) => (
                      <div key={todo.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => {
                            setTodos(todos.map(t => 
                              t.id === todo.id ? { ...t, completed: !t.completed } : t
                            ))
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className={`ml-3 text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.title}
                        </span>
                        <span className={`ml-auto inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Expense Breakdown</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {categoryBreakdown.map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                          <span className="text-sm font-medium text-gray-900">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${category.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard 