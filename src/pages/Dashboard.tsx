import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Building,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  Wrench,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  CheckCircle,
  Activity,
  BarChart3,
  CreditCard,
  Bell
} from 'lucide-react'
import { mockBuildings, mockTickets, mockWorkOrders, mockEvents, mockFlats, mockResidents } from '../services/mockData'

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const [selectedBuilding, setSelectedBuilding] = useState(mockBuildings[0]?.id || '')

  // Calculate metrics from mock data
  const calculateMetrics = () => {
    const selectedBuildingData = mockBuildings.find(b => b.id === selectedBuilding)
    const buildingFlats = mockFlats.filter(f => f.buildingId === selectedBuilding)
    const buildingResidents = mockResidents.filter(r => 
      buildingFlats.some(f => f.id === r.flatId)
    )
    const buildingTickets = mockTickets.filter(t => t.buildingId === selectedBuilding)
    const buildingWorkOrders = mockWorkOrders.filter(w => w.buildingId === selectedBuilding)
    const buildingEvents = mockEvents.filter(e => e.buildingId === selectedBuilding)

    // Calculate occupancy rate
    const occupiedFlats = buildingFlats.filter(f => f.status === 'occupied').length
    const occupancyRate = buildingFlats.length > 0 ? (occupiedFlats / buildingFlats.length) * 100 : 0

    // Count urgent items
    const urgentTickets = buildingTickets.filter(t => 
      t.status === 'open' && (t.priority === 'urgent' || t.priority === 'high')
    ).length
    
    const pendingWorkOrders = buildingWorkOrders.filter(w => 
      w.status === 'pending' || w.status === 'in_progress'
    ).length

    const upcomingEvents = buildingEvents.filter(e => {
      const eventDate = new Date(e.startDate)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return eventDate >= now && eventDate <= nextWeek
    }).length

    // Mock financial data
    const monthlyRevenue = 45000
    const monthlyExpenses = 32000
    const budgetUtilization = 68

    return {
      totalBuildings: mockBuildings.length,
      totalFlats: buildingFlats.length,
      totalResidents: buildingResidents.length,
      occupancyRate: Math.round(occupancyRate),
      urgentTickets,
      pendingWorkOrders,
      upcomingEvents,
      monthlyRevenue,
      monthlyExpenses,
      budgetUtilization,
      selectedBuildingName: selectedBuildingData?.name || 'Unknown Building'
    }
  }

  const metrics = calculateMetrics()

  // Get urgent items for triage
  const getUrgentItems = () => {
    const buildingTickets = mockTickets.filter(t => t.buildingId === selectedBuilding)
    const buildingWorkOrders = mockWorkOrders.filter(w => w.buildingId === selectedBuilding)
    const buildingEvents = mockEvents.filter(e => e.buildingId === selectedBuilding)

    const urgentItems = []

    // Add urgent tickets
    buildingTickets
      .filter(t => t.status === 'open' && (t.priority === 'urgent' || t.priority === 'high'))
      .forEach(ticket => {
        urgentItems.push({
          id: ticket.id,
          title: ticket.title,
          type: 'ticket',
          priority: ticket.priority,
          status: ticket.status,
          assignedTo: ticket.assignedTo,
          createdAt: ticket.createdAt
        })
      })

    // Add pending work orders
    buildingWorkOrders
      .filter(w => w.status === 'pending' || w.status === 'in_progress')
      .forEach(workOrder => {
        urgentItems.push({
          id: workOrder.id,
          title: workOrder.title,
          type: 'work_order',
          priority: workOrder.priority,
          status: workOrder.status,
          assignedTo: workOrder.assignedTo,
          createdAt: workOrder.createdAt
        })
      })

    // Add upcoming events
    buildingEvents
      .filter(e => {
        const eventDate = new Date(e.startDate)
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        return eventDate >= now && eventDate <= nextWeek
      })
      .forEach(event => {
        urgentItems.push({
          id: event.id,
          title: event.title,
          type: 'event',
          priority: 'medium',
          status: event.status,
          assignedTo: event.assignedTo.join(', '),
          createdAt: event.createdAt
        })
      })

    return urgentItems.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
    })
  }

  const urgentItems = getUrgentItems()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100'
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
      default:
        return <Bell className="h-4 w-4" />
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Buildings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Buildings</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.totalBuildings}</p>
              </div>
            </div>
          </div>

          {/* Total Flats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Flats</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.totalFlats}</p>
              </div>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.occupancyRate}%</p>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">£{metrics.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Urgent Items Triage */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Urgent Items Triage</h2>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {urgentItems.length} items
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {urgentItems.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No urgent items</h3>
                    <p className="mt-1 text-sm text-gray-500">All caught up! Great work.</p>
                  </div>
                ) : (
                  urgentItems.slice(0, 5).map((item) => (
                    <div key={`${item.type}-${item.id}`} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-500">
                              Assigned to: {item.assignedTo || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{item.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {urgentItems.length > 5 && (
                <div className="px-6 py-3 bg-gray-50 text-center">
                  <Link to="/tickets-work-orders" className="text-sm text-blue-600 hover:text-blue-500">
                    View all {urgentItems.length} urgent items →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-gray-600">Urgent Tickets</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{metrics.urgentTickets}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wrench className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending Work Orders</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{metrics.pendingWorkOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Upcoming Events</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{metrics.upcomingEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">Monthly Expenses</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">£{metrics.monthlyExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/tickets-work-orders"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Manage Tickets</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  to="/finances"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">View Finances</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  to="/events"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Manage Events</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  to="/building-data"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-purple-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Building Data</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
