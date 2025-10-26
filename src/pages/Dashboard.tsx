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
  FileText,
  Receipt
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardHeader, CardTitle, CardContent, PageLoading, WidgetSkeleton, SectionLoading, ListItemSkeleton } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useBuilding } from '../contexts/BuildingContext'
import { useNotifications } from '../contexts/NotificationContext'
import { budgetService } from '../services/budgetService'
import { getAllBuildings } from '../services/buildingService'
import { eventService } from '../services/eventService'
import { expenseService } from '../services/expenseService'
import { financialIntegrationService } from '../services/financialIntegrationService'
import { getFlatsByBuilding } from '../services/flatService'
import { getInvoicesByBuilding } from '../services/invoiceService'
import { getPeopleByBuilding } from '../services/peopleService'
import { getServiceChargeDemands } from '../services/serviceChargeService'
import { ticketService } from '../services/ticketService'
import { getWorkOrdersByBuilding } from '../services/workOrderService'
import { Building as BuildingType, Ticket, TicketStatus, UrgencyLevel, Budget, ServiceChargeDemand, Invoice, InvoiceStatus, BuildingEvent, WorkOrder } from '../types'

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { buildings, selectedBuildingId, selectedBuilding: selectedBuildingData, setSelectedBuildingId, loading: buildingsLoading } = useBuilding()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Financial data state
  const [budget, setBudget] = useState<Budget | null>(null)
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeDemand[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [financialDataLoading, setFinancialDataLoading] = useState(false)
  const [financialOverview, setFinancialOverview] = useState<any>(null)
  
  // Events data state
  const [events, setEvents] = useState<BuildingEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  
  // Work Orders data state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false)
  
  // Flats and People data state
  const [flats, setFlats] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [buildingDataLoading, setBuildingDataLoading] = useState(false)

  // Load tickets, financial data, events, and work orders when selected building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadTickets()
      loadFinancialData()
      loadEvents()
      loadWorkOrders()
      loadBuildingData()
    }
  }, [selectedBuildingId])

  const loadTickets = async () => {
    if (!selectedBuildingId) return
    
    try {
      setTicketsLoading(true)
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
      setTicketsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTickets()
    setRefreshing(false)
  }
  
  const loadFinancialData = async () => {
    if (!selectedBuildingId) return
    
    try {
      setFinancialDataLoading(true)
      const [budgetData, demandsData, invoicesData, expensesData] = await Promise.all([
        budgetService.getBudgetsByBuilding(selectedBuildingId),
        getServiceChargeDemands(selectedBuildingId),
        getInvoicesByBuilding(selectedBuildingId),
        expenseService.getExpensesByBuilding(selectedBuildingId)
      ])
      
      setBudget(budgetData.length > 0 ? budgetData[0] : null)
      setServiceCharges(demandsData)
      setInvoices(invoicesData)
      setExpenses(expensesData)

      // Load financial overview
      try {
        const overview = await financialIntegrationService.getFinancialOverview(selectedBuildingId)
        setFinancialOverview(overview)
      } catch (error) {
        console.error('Error loading financial overview for dashboard:', error)
        setFinancialOverview(null)
      }
    } catch (error) {
      console.error('Error loading financial data for dashboard:', error)
      // Don't show notification as this is less critical for dashboard
    } finally {
      setFinancialDataLoading(false)
    }
  }
  
  const loadEvents = async () => {
    if (!selectedBuildingId) return
    
    try {
      setEventsLoading(true)
      console.log('🗓️ Loading events from Firebase...')
      const allEvents = await eventService.getEvents()
      console.log('🗓️ All events loaded:', allEvents.length)
      
      // Filter events for the selected building
      const buildingEvents = allEvents.filter(event => event.buildingId === selectedBuildingId)
      console.log('🗓️ Building events filtered:', buildingEvents.length)
      setEvents(buildingEvents)
    } catch (error) {
      console.error('❌ Error loading events:', error)
      // Don't show notification for events loading errors as this is less critical
    } finally {
      setEventsLoading(false)
    }
  }
  
  const loadWorkOrders = async () => {
    if (!selectedBuildingId) return
    
    try {
      setWorkOrdersLoading(true)
      console.log('🔧 Loading work orders from Firebase...')
      const buildingWorkOrders = await getWorkOrdersByBuilding(selectedBuildingId)
      console.log('🔧 Building work orders loaded:', buildingWorkOrders.length)
      setWorkOrders(buildingWorkOrders)
    } catch (error) {
      console.error('❌ Error loading work orders:', error)
      // Don't show notification for work orders loading errors as this is less critical
    } finally {
      setWorkOrdersLoading(false)
    }
  }
  
  const loadBuildingData = async () => {
    if (!selectedBuildingId) return
    
    try {
      setBuildingDataLoading(true)
      const [flatsData, peopleData] = await Promise.all([
        getFlatsByBuilding(selectedBuildingId),
        getPeopleByBuilding(selectedBuildingId)
      ])
      
      setFlats(flatsData)
      setPeople(peopleData)
    } catch (error) {
      console.error('Error loading building data for dashboard:', error)
    } finally {
      setBuildingDataLoading(false)
    }
  }
  
  // Calculate financial summary
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
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }
  
  const financialSummary = getFinancialSummary()

  // Calculate metrics from real Firebase data
  const calculateMetrics = () => {
    // Calculate ticket metrics from real Firebase data
    const urgentTickets = tickets.filter(t => 
      (t.status === 'New' || t.status === 'Quote Requested') && (t.urgency === 'Critical' || t.urgency === 'High')
    ).length
    
    const openTickets = tickets.filter(t => t.status === 'New').length
    const newTickets = tickets.filter(t => t.status === 'New').length // Same as openTickets but clearer naming
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length
    const resolvedTickets = tickets.filter(t => t.status === 'Complete').length
    
    // Calculate work order metrics from real Firebase data
    const totalWorkOrders = workOrders.length
    const pendingWorkOrders = workOrders.filter(wo => 
      wo.status === 'Triage' || wo.status === 'Quoting' || wo.status === 'Scheduled'
    ).length

    // Calculate from real data loaded from Firebase
    const totalFlats = flats.length
    const totalResidents = people.length // Count all people associated with building
    const occupancyRate = totalFlats > 0 ? Math.round((flats.filter(f => f.residentUid).length / totalFlats) * 100) : 0
    
    // Calculate actual revenue and expenses from Firebase data
    const monthlyRevenue = serviceCharges.reduce((sum, sc) => sum + (sc.amountPaid || 0), 0)
    const monthlyExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    
    // Calculate events metrics from real Firebase data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    
    // Count upcoming events (from today onwards)
    const upcomingEvents = events.filter(event => 
      new Date(event.startDate) >= today
    ).length
    
    // Count today's events (events starting today)
    const todaysEvents = events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate >= today && eventDate < tomorrow
    }).length

    return {
      totalBuildings: buildings.length,
      totalFlats,
      totalResidents,
      occupancyRate,
      urgentTickets,
      openTickets,
      newTickets,
      inProgressTickets,
      resolvedTickets,
      totalWorkOrders,
      pendingWorkOrders,
      upcomingEvents,
      monthlyRevenue,
      monthlyExpenses,
      todaysEvents,
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

  // Show loading spinner while buildings are loading
  if (buildingsLoading) {
    return <PageLoading message="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-neutral-50" data-testid="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2" data-testid="page-title">Welcome back, {currentUser.name}</h1>
          </div>
        </div>

        {/* Dashboard Layout: 2/3 width panels + 1/3 width recent activity */}
        <div className="flex gap-6">
          {/* Main Dashboard Panels - 2/3 width */}
          <div className="flex-1 w-2/3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tickets Panel */}
              <Card className="flex flex-col h-80" data-testid="ticket-statistics">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <Link to="/tickets-work-orders" className="bg-red-50 p-3 rounded-lg hover:bg-red-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Critical Tickets</p>
                          <p className="text-lg font-bold text-black" data-testid="total-tickets">{metrics.urgentTickets}</p>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-red-600 ml-2" />
                      </div>
                    </Link>
                    <Link to="/tickets-work-orders" className="bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Open Tickets</p>
                          <p className="text-lg font-bold text-black">{metrics.openTickets}</p>
                        </div>
                        <Clock className="h-4 w-4 text-blue-600 ml-2" />
                      </div>
                    </Link>
                    <Link to="/work-orders" className="bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Work Orders</p>
                          <p className="text-lg font-bold text-black">{metrics.totalWorkOrders}</p>
                        </div>
                        <Wrench className="h-4 w-4 text-purple-600 ml-2" />
                      </div>
                    </Link>
                    <Link to="/tickets-work-orders" className="bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">New Tickets</p>
                          <p className="text-lg font-bold text-black">{metrics.newTickets}</p>
                        </div>
                        <Bell className="h-4 w-4 text-green-600 ml-2" />
                      </div>
                    </Link>
                  </div>
                  {urgentItems.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">Urgent Items ({urgentItems.length})</p>
                      <div className="space-y-1">
                        {urgentItems.slice(0, 2).map((item) => (
                          <div key={`${item.type}-${item.id}`} className="text-xs text-gray-600 truncate">
                            • {item.title}
                          </div>
                        ))}
                        {urgentItems.length > 2 && (
                          <p className="text-xs text-gray-500">+{urgentItems.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <Link to="/tickets-work-orders" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center">
                      Manage Tickets <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Finances Panel */}
              <Card className="flex flex-col h-80" data-testid="financial-overview">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Finances
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  {financialOverview ? (
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <Link to="/finances" className="bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors h-16">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Service Charges</p>
                            <p className="text-lg font-bold text-black">
                              £{financialOverview.serviceCharges.collected.toLocaleString()}
                            </p>
                          </div>
                          <DollarSign className="h-4 w-4 text-green-600 ml-2" />
                        </div>
                      </Link>
                      <Link to="/finances" className="bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors h-16">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Expenses</p>
                            <p className="text-lg font-bold text-black">
                              £{financialOverview.expenses.amount.toLocaleString()}
                            </p>
                          </div>
                          <Receipt className="h-4 w-4 text-blue-600 ml-2" />
                        </div>
                      </Link>
                      <Link to="/finances" className="bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors h-16">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Invoices</p>
                            <p className="text-lg font-bold text-black">
                              £{financialOverview.invoices.amount.toLocaleString()}
                            </p>
                          </div>
                          <FileText className="h-4 w-4 text-purple-600 ml-2" />
                        </div>
                      </Link>
                      <Link to="/finances" className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors h-16">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Net Position</p>
                            <p className="text-lg font-bold text-black">
                              £{financialOverview.netPosition.toLocaleString()}
                            </p>
                          </div>
                          {financialOverview.netPosition >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 ml-2" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 ml-2" />
                          )}
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">No financial data available</p>
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link to="/finances" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
                      View Full Finances <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Panel */}
              <Card className="flex flex-col h-80" data-testid="budget-overview">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <Link to="/reports" className="bg-green-50 p-3 rounded-lg hover:bg-green-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Occupancy Rate</p>
                          <p className="text-lg font-bold text-black">{metrics.occupancyRate}%</p>
                        </div>
                        <Users className="h-4 w-4 text-green-600 ml-2" />
                      </div>
                    </Link>
                    <Link to="/reports" className="bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Total Properties</p>
                          <p className="text-lg font-bold text-black">{metrics.totalFlats}</p>
                        </div>
                        <Building className="h-4 w-4 text-purple-600 ml-2" />
                      </div>
                    </Link>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                      View Reports <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Events Panel */}
              <Card className="flex flex-col h-80" data-testid="upcoming-events">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                    Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <Link to="/events" className="bg-indigo-50 p-3 rounded-lg hover:bg-indigo-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Upcoming Events</p>
                          <p className="text-lg font-bold text-black">{metrics.upcomingEvents}</p>
                        </div>
                        <Calendar className="h-4 w-4 text-indigo-600 ml-2" />
                      </div>
                    </Link>
                    <Link to="/events" className="bg-orange-50 p-3 rounded-lg hover:bg-orange-100 transition-colors h-16">
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Today's Events</p>
                          <p className="text-lg font-bold text-black">{metrics.todaysEvents}</p>
                        </div>
                        <Calendar className="h-4 w-4 text-orange-600 ml-2" />
                      </div>
                    </Link>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <Link to="/events" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                      Manage Events <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity Panel - 1/3 width, full height */}
          <div className="w-1/3">
            <Card className="h-full" data-testid="recent-activity">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-gray-600" />
                    Recent Activity
                  </CardTitle>
                  {refreshing && (
                    <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 h-full overflow-y-auto">
                <div className="space-y-4">
                  {ticketsLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-16 h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : tickets.length > 0 ? (
                    tickets
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .slice(0, 15)
                      .map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-shrink-0 mt-0.5">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ticket • {formatTimeAgo(item.updatedAt)}
                            </p>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(item.status)} flex-shrink-0`}>
                            {item.status}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">
                        No recent activity to show
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cash Flow Analysis Widget - Moved to bottom */}
        {selectedBuildingId && financialSummary && financialSummary.forecastExpenses > 0 && (
          <div className="mt-6">
            <Card className="bg-blue-50 border border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Receipt className="h-5 w-5 text-primary-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-primary-900">Cash Flow Analysis</h3>
                    <div className="mt-2 text-sm text-primary-700">
                      <p className="mb-2">
                        Your current net position is <strong>{formatCurrency(financialSummary.netPosition)}</strong>, 
                        but you have <strong>{formatCurrency(financialSummary.forecastExpenses)}</strong> in 
                        committed expenses from completed tickets awaiting invoices.
                      </p>
                      <p className={`font-medium ${
                        financialSummary.adjustedCashPosition >= 0 ? 'text-success-700' : 'text-red-700'
                      }`}>
                        {financialSummary.adjustedCashPosition >= 0 
                          ? `✅ You have ${formatCurrency(financialSummary.adjustedCashPosition)} available after committed expenses.`
                          : `⚠️ You may have a cash shortfall of ${formatCurrency(Math.abs(financialSummary.adjustedCashPosition))} once all invoices arrive.`
                        }
                      </p>
                    </div>
                    <div className="mt-3">
                      <Link to="/finances" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                        View Full Financial Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
