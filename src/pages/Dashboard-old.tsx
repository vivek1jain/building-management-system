import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Building,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  Wrench,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle,
  Activity
} from 'lucide-react'
import { mockBuildings, mockTickets, mockWorkOrders, mockEvents, mockFlats, mockResidents } from '../services/mockData'

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const [selectedBuilding, setSelectedBuilding] = useState(mockBuildings[0]?.id || '')

  // Calculate metrics from mock data
  const calculateMetrics = () => {
    const buildings = mockBuildings
    const flats = mockFlats
    const residents = mockResidents
    const tickets = mockTickets
    const workOrders = mockWorkOrders
    const events = mockEvents
    const budgets = mockBudgets

    // Calculate occupancy rate based on residents
    const occupiedFlats = residents.length
    const occupancyRate = flats.length > 0 ? (occupiedFlats / flats.length) * 100 : 0
    
    // Count urgent tickets (using status as priority indicator)
    const urgentTickets = tickets.filter(ticket => 
      ticket.status === 'new' || ticket.status === 'in_progress'
    ).length
    
    // Count pending work orders
    const pendingWorkOrders = workOrders.filter(wo => 
      wo.status === 'pending' || wo.status === 'in_progress'
    ).length
    
    // Count upcoming events
    const upcomingEvents = events.filter(event => 
      new Date(event.startDate) > new Date() && 
      new Date(event.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length
    
    // Calculate budget metrics
    const currentBudget = budgets.find(b => b.buildingId === selectedBuilding)
    const monthlyRevenue = currentBudget?.totalBudget || 0
    const totalSpent = currentBudget?.categories.reduce((sum, cat) => sum + cat.actualAmount, 0) || 0
    const budgetUtilization = monthlyRevenue > 0 ? (totalSpent / monthlyRevenue) * 100 : 0

    return {
      totalBuildings: buildings.length,
      totalFlats: flats.length,
      totalResidents: residents.length,
      occupancyRate,
      urgentTickets,
      pendingWorkOrders,
      upcomingEvents,
      monthlyRevenue,
      monthlyExpenses: totalSpent,
      budgetUtilization
    }
  }

  const metrics = calculateMetrics()

  // Get urgent items for triage
  const getUrgentItems = () => {
    const items: any[] = []
    
    // Recent tickets (using status as urgency indicator)
    mockTickets
      .filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress')
      .slice(0, 3)
      .forEach(ticket => {
        const building = mockBuildings.find(b => b.id === ticket.buildingId)
        items.push({
          id: ticket.id,
          title: ticket.title,
          type: 'ticket',
          priority: ticket.status === 'open' ? 'high' : 'medium',
          status: ticket.status,
          buildingName: building?.name || 'Unknown Building',
          dueDate: ticket.createdAt
        })
      })
    
    // Active work orders
    mockWorkOrders
      .filter(wo => wo.status === 'in_progress')
      .slice(0, 2)
      .forEach(workOrder => {
        const building = mockBuildings.find(b => b.id === workOrder.buildingId)
        items.push({
          id: workOrder.id,
          title: workOrder.title,
          type: 'work_order',
          priority: 'medium',
          status: workOrder.status,
          buildingName: building?.name || 'Unknown Building',
          dueDate: workOrder.scheduledDate
        })
      })
    
    // Upcoming events
    mockEvents
      .filter(event => new Date(event.startDate) > new Date())
      .slice(0, 2)
      .forEach(event => {
        const building = mockBuildings.find(b => b.id === event.buildingId)
        items.push({
          id: event.id,
          title: event.title,
          type: 'event',
          priority: 'medium',
          status: event.status,
          buildingName: building?.name || 'Unknown Building',
          dueDate: event.startDate
        })
      })
    
    return items.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    })
  }

  const urgentItems = getUrgentItems()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return <AlertTriangle className="h-4 w-4" />
      case 'work_order':
        return <Wrench className="h-4 w-4" />
      case 'event':
        return <Calendar className="h-4 w-4" />
      case 'financial':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Building Manager Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-gray-500" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="select"
            >
              {mockBuildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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