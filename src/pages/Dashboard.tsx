import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBuilding } from '../contexts/BuildingContext'
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
  Bell,
  RefreshCw,
  Home,
  ChevronDown,
  FileText
} from 'lucide-react'
import { getAllBuildings } from '../services/buildingService'
import { ticketService } from '../services/ticketService'
import { Building as BuildingType, Ticket, TicketStatus, UrgencyLevel } from '../types'
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/UI'

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { buildings, selectedBuildingId, selectedBuilding: selectedBuildingData, setSelectedBuildingId } = useBuilding()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load tickets when selected building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadTickets()
    }
  }, [selectedBuildingId])

  const loadTickets = async () => {
    if (!selectedBuildingId) return
    
    try {
      setRefreshing(true)
      console.log('🎫 Loading all tickets from Firebase...')
      const allTickets = await ticketService.getTickets()
      console.log('🎫 All tickets loaded:', allTickets.length)
      
      // Filter tickets for the selected building
      const buildingTickets = allTickets.filter(ticket => ticket.buildingId === selectedBuildingId)
      console.log('🎫 Building tickets filtered:', buildingTickets.length)
      setTickets(buildingTickets)
    } catch (error) {
      console.error('❌ Error loading tickets:', error)
      // Don't show notification for ticket loading errors as this is less critical
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTickets()
    setRefreshing(false)
  }

  // Calculate metrics from real Firebase data
  const calculateMetrics = () => {
    // Calculate ticket metrics
    const urgentTickets = tickets.filter(t => 
      (t.status === 'New' || t.status === 'Quote Requested') && (t.urgency === 'Critical' || t.urgency === 'High')
    ).length
    
    const openTickets = tickets.filter(t => t.status === 'New').length
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length
    const resolvedTickets = tickets.filter(t => t.status === 'Complete').length

    // Mock data for metrics we don't have services for yet
    const totalFlats = 24
    const totalResidents = 56
    const occupancyRate = 87
    const monthlyRevenue = 45000
    const monthlyExpenses = 32000
    const pendingWorkOrders = 3
    const upcomingEvents = 2

    return {
      totalBuildings: buildings.length,
      totalFlats,
      totalResidents,
      occupancyRate,
      urgentTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      pendingWorkOrders,
      upcomingEvents,
      monthlyRevenue,
      monthlyExpenses,
      selectedBuildingName: selectedBuildingData?.name || 'Select Building'
    }
  }

  const metrics = calculateMetrics()

  // Get urgent items for triage (from real Firebase data)
  const getUrgentItems = () => {
    const urgentItems: any[] = []

    // Add urgent tickets from Firebase data
    tickets
      .filter(t => (t.status === 'New' || t.status === 'Quote Requested') && (t.urgency === 'Critical' || t.urgency === 'High'))
      .forEach(ticket => {
        urgentItems.push({
          id: ticket.id,
          title: ticket.title,
          type: 'ticket',
          priority: ticket.urgency,
          status: ticket.status,
          assignedTo: ticket.assignedTo || 'Unassigned',
          createdAt: ticket.createdAt
        })
      })

    // For now, no work orders or events since we don't have those services
    // This can be extended when those services are added

    return urgentItems.sort((a, b) => {
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
    })
  }

  const urgentItems = getUrgentItems()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'High':
        return 'text-red-600 bg-red-100'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'Low':
        return 'text-success-600 bg-success-100'
      default:
        return 'text-gray-600 bg-neutral-100'
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quote Requested': return 'bg-yellow-100 text-yellow-800'
      case 'Quote Received': return 'bg-purple-100 text-purple-800'
      case 'PO Sent': return 'bg-indigo-100 text-indigo-800'
      case 'Contracted': return 'bg-orange-100 text-orange-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Complete': return 'bg-success-100 text-success-800'
      case 'Closed': return 'bg-neutral-100 text-gray-800'
      case 'Triage': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
<h1 className="text-3xl font-bold text-neutral-900 mb-2">Building Manager Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser.name}</p>
            {selectedBuildingData && (
              <p className="text-sm text-neutral-500 mt-1">Current building: {selectedBuildingData.name}</p>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBuildings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flats</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalFlats}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.occupancyRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{metrics.monthlyRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Urgent Items Triage */}
          <div className="lg:col-span-2">
<Card padding="none" shadow="sm" className="bg-white">
              <CardHeader className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <CardTitle as="h2" className="text-lg font-medium text-neutral-900">Urgent Items Triage</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                    {urgentItems.length} items
                  </span>
                </div>
              </CardHeader>
              <div className="divide-y divide-gray-200">
                {urgentItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-2 text-sm font-medium">No urgent items</h3>
                    <p className="mt-1 text-sm text-muted-foreground">All caught up! Great work.</p>
                  </div>
                ) : (
<div className="divide-y divide-gray-200">
                    {urgentItems.slice(0, 5).map((item) => (
                      <div key={`${item.type}-${item.id}`} className="py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Assigned to: {item.assignedTo || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className="text-xs text-neutral-500 capitalize">{item.type.replace('_', ' ')}</span>
                        </div>
                      </div>
))}
              </div>
                )}
              </div>
              {urgentItems.length > 5 && (
                <div className="px-6 py-3 bg-neutral-50 text-center">
                  <Link to="/tickets-work-orders" className="text-sm text-primary-600 hover:text-blue-500">
                    View all {urgentItems.length} urgent items →
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
<Card padding="md" shadow="sm" className="bg-white">
              <CardTitle as="h3" className="text-lg font-medium text-neutral-900 mb-4">Quick Stats</CardTitle>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                    <span className="text-sm text-muted-foreground">Urgent Tickets</span>
                  </div>
                  <span className="text-sm font-semibold">{metrics.urgentTickets}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wrench className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Pending Work Orders</span>
                  </div>
                  <span className="text-sm font-semibold">{metrics.pendingWorkOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-muted-foreground">Upcoming Events</span>
                  </div>
                  <span className="text-sm font-semibold">{metrics.upcomingEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm text-muted-foreground">Monthly Expenses</span>
                  </div>
                  <span className="text-sm font-semibold">£{metrics.monthlyExpenses.toLocaleString()}</span>
                </div>
</div>
            </Card>

            <Card padding="md" shadow="sm" className="bg-white">
              <CardTitle as="h3" className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</CardTitle>
              <div className="space-y-3">
                <Link to="/tickets-work-orders" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-destructive mr-3" />
                    <span className="text-sm font-medium">Manage Tickets</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link to="/finances" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm font-medium">View Finances</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link to="/events" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm font-medium">Manage Events</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link to="/building-data" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-purple-500 mr-3" />
                    <span className="text-sm font-medium">Building Data</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
</Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
<div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {tickets
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
<FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
<p className="text-sm font-medium text-neutral-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Ticket • {formatTimeAgo(item.updatedAt)}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                {tickets.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-neutral-500">
                      No recent activity to show
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
