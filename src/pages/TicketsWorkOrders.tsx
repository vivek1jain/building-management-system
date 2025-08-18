import React, { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBuilding } from '../contexts/BuildingContext'
import { ticketService } from '../services/ticketService'
import * as workOrderService from '../services/workOrderService'
import { TicketDetailModal } from '../components/TicketDetailModal'
import { useCreateTicket } from '../contexts/CreateTicketContext'
import { 
  Building as BuildingType, 
  Ticket, 
  WorkOrder, 
  TicketStatus, 
  WorkOrderStatus, 
  WorkOrderPriority 
} from '../types'
import { 
  Building,
  Calendar, 
  Clock, 
  User, 
  Plus,
  Search,
  FileText,
  Wrench,
  ArrowRight,
  X,
  MapPin,
  DollarSign,
  ChevronDown
} from 'lucide-react'

const TicketsWorkOrders: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId } = useBuilding()
  const { openCreateTicketModal } = useCreateTicket()
  
  // State management
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'tickets' | 'work-orders' | 'workflow'>('my-tickets')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // const [priorityFilter, setPriorityFilter] = useState<string>('all') // Removed as unused
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState<string | null>(null)
  
  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    if (selectedBuildingId) {
      const initializeData = async () => {
        unsubscribe = await loadTicketsAndWorkOrders()
      }
      initializeData()
    }

    // Cleanup subscription when component unmounts or building changes
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [selectedBuildingId])


  // Modal handler functions
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsTicketModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsTicketModalOpen(false)
    setSelectedTicket(null)
  }

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map((t: Ticket) => t.id === updatedTicket.id ? updatedTicket : t))
  }

  const loadTicketsAndWorkOrders = async () => {
    if (!selectedBuildingId) return
    
    try {
      setLoading(true)
      
      // Load tickets filtered by building
      const unsubscribe = ticketService.subscribeToTickets((ticketsData: Ticket[]) => {
        console.log('Received tickets data:', ticketsData.length, 'tickets')
        // Filter tickets by selected building (with fallback for legacy tickets without buildingId)
        const buildingTickets = ticketsData.filter(ticket => {
          // If ticket has no buildingId (legacy tickets), show them in the first building
          if (!ticket.buildingId && selectedBuildingId === 'building-1') {
            return true
          }
          // Otherwise, match by buildingId
          return ticket.buildingId === selectedBuildingId
        })
        console.log('Filtered tickets for building', selectedBuildingId, ':', buildingTickets.length, 'tickets')
        console.log('Sample ticket buildingIds:', ticketsData.slice(0, 3).map(t => ({ id: t.id, buildingId: t.buildingId })))
        setTickets(buildingTickets)
        setLoading(false) // Set loading to false when data arrives
      })

      // Load work orders filtered by building
      try {
        const workOrdersData = await workOrderService.getWorkOrdersByBuilding(selectedBuildingId)
        setWorkOrders(workOrdersData)
      } catch (error) {
        console.error('Error loading work orders:', error)
        // Fallback to mock data if service fails
        const mockWorkOrders: WorkOrder[] = [
          {
            id: 'wo-1',
            buildingId: selectedBuildingId,
            title: 'Plumbing Repair - Flat A101',
            description: 'Fix leaking kitchen faucet',
            priority: 'high' as WorkOrderPriority,
            status: WorkOrderStatus.TRIAGE,
            flatId: 'A101',
            scheduledDate: new Date('2024-03-20'),
            assignedToUid: 'contractor-1',
            createdByUid: 'manager-1',
            createdByUserEmail: 'manager@building.com',
            createdAt: new Date('2024-03-15'),
            updatedAt: new Date('2024-03-18'),
            // estimatedHours: 2, // Removed as not part of WorkOrder interface
          }
        ]
        setWorkOrders(mockWorkOrders)
      }
      
      return unsubscribe
    } catch (error) {
      console.error('Error loading tickets and work orders:', error)
      addNotification({
        userId: currentUser?.id || '',
        title: 'Error',
        message: 'Failed to load data',
        type: 'error'
      })
      setLoading(false)
    }
  }

  const getStatusColor = (status: TicketStatus | WorkOrderStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quoting': return 'bg-yellow-100 text-yellow-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'Complete': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      // Work order statuses
      case 'Triage': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-success-100 text-success-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
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

  // Helper functions for filtering tickets
  const getMyTickets = () => {
    if (!currentUser) return []
    
    // Tickets the user created
    const myCreatedTickets = tickets.filter(ticket => ticket.requestedBy === currentUser.id)
    
    // If user is a manager, also include tickets they need to approve (New status tickets)
    if (currentUser.role === 'manager') {
      const ticketsToApprove = tickets.filter(ticket => 
        ticket.status === 'New' && ticket.requestedBy !== currentUser.id
      )
      
      // Combine and deduplicate
      const allMyTickets = [...myCreatedTickets, ...ticketsToApprove]
      const uniqueTickets = allMyTickets.filter((ticket, index, self) => 
        self.findIndex(t => t.id === ticket.id) === index
      )
      
      return uniqueTickets
    }
    
    return myCreatedTickets
  }
  
  const getActiveTickets = () => {
    // Filter out closed tickets for "All Tickets" view
    return tickets.filter(ticket => ticket.status !== 'Closed')
  }

  // Modal handler functions already defined above

  // Helper function to check if ticket belongs to a workflow stage
  const getTicketsForStage = (stageId: string) => {
    switch (stageId) {
      case 'new':
        return tickets.filter(t => t.status === 'New')
      case 'quoting':
        return tickets.filter(t => t.status === 'Quoting')
      case 'scheduled':
        return tickets.filter(t => t.status === 'Scheduled')
      case 'complete':
        return tickets.filter(t => t.status === 'Complete')
      case 'closed':
        return tickets.filter(t => t.status === 'Closed')
      case 'cancelled':
        return tickets.filter(t => t.status === 'Cancelled')
      default:
        return []
    }
  }

  const getWorkOrdersForStage = (stageId: string) => {
    switch (stageId) {
      case 'scheduled':
        return workOrders.filter(wo => wo.status === 'Scheduled' || wo.status === 'In Progress')
      case 'resolved':
        return workOrders.filter(wo => wo.status === 'Complete')
      default:
        return []
    }
  }

  // Clean workflow stages with one-to-one status mapping (6-stage workflow)
  const workflowStages = [
    {
      id: 'new',
      title: 'New',
      description: 'New tickets awaiting manager review',
      status: 'New',
      count: getTicketsForStage('new').length,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'quoting',
      title: 'Quoting',
      description: 'Getting quotes from suppliers',
      status: 'Quoting',
      count: getTicketsForStage('quoting').length,
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      description: 'Work has been scheduled',
      status: 'Scheduled',
      count: getTicketsForStage('scheduled').length,
      color: 'bg-cyan-50 border-cyan-200'
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Work completed, awaiting feedback',
      status: 'Complete',
      count: getTicketsForStage('complete').length,
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'closed',
      title: 'Closed',
      description: 'Completed with resident feedback',
      status: 'Closed',
      count: getTicketsForStage('closed').length,
      color: 'bg-gray-50 border-gray-200'
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      description: 'Cancelled tickets',
      status: 'Cancelled',
      count: getTicketsForStage('cancelled').length,
      color: 'bg-red-50 border-red-200'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-inter">Ticketing</h1>
          <p className="text-gray-600 mt-1 font-inter">
            Manage tickets and work orders following the complete workflow
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateTicketModal}
            className="btn-primary flex items-center font-inter"
          >
            New Ticket
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'my-tickets'
                ? 'border-blue-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            My Tickets ({getMyTickets().length})
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'workflow'
                ? 'border-blue-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Workflow View ({tickets.length + workOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            All Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('work-orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'work-orders'
                ? 'border-blue-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Work Orders ({workOrders.length})
          </button>
        </nav>
      </div>

      {/* Workflow View */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {workflowStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setSelectedWorkflowStage(selectedWorkflowStage === stage.id ? null : stage.id)}
                className={`w-full border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full ${
                  selectedWorkflowStage === stage.id 
                    ? 'ring-2 ring-blue-500 ' + stage.color 
                    : stage.color
                } hover:scale-105`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-neutral-900 font-inter">{stage.title}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-semibold text-neutral-700 font-inter">
                    {stage.count}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-inter text-left flex-1">{stage.description}</p>
                <div className="mt-4 w-full flex justify-end items-center" style={{ minHeight: '20px' }}>
                  {index < workflowStages.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Filtered Stage View */}
          {selectedWorkflowStage && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-900 font-inter">
                    {workflowStages.find(s => s.id === selectedWorkflowStage)?.title} Items
                  </h3>
                  <button
                    onClick={() => setSelectedWorkflowStage(null)}
                    className="text-neutral-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Filter tickets and work orders by selected stage */}
                  {[
                    ...getTicketsForStage(selectedWorkflowStage),
                    ...getWorkOrdersForStage(selectedWorkflowStage)
                  ].map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors duration-200" 
                      onClick={() => {
                        // Only handle ticket clicks, not work order clicks for now
                        if ('urgency' in item) {
                          handleTicketClick(item as Ticket)
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        {'urgency' in item ? (
                          <FileText className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Wrench className="h-5 w-5 text-success-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 font-inter">
                          {item.title}
                        </p>
                        <p className="text-sm text-neutral-500 font-inter">
                          {'urgency' in item ? 'Ticket' : 'Work Order'} • {formatTimeAgo(item.updatedAt)}
                        </p>
                        <p className="text-sm text-gray-600 font-inter mt-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        {'urgency' in item && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(item.urgency)}`}>
                            {item.urgency}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Show message if no items in this stage */}
                  {[
                    ...getTicketsForStage(selectedWorkflowStage),
                    ...getWorkOrdersForStage(selectedWorkflowStage)
                  ].length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 font-inter">
                        No items in this workflow stage
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === 'my-tickets' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search my tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="Quoting">Quoting</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Complete">Complete</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Info Banner for Managers */}
          {currentUser?.role === 'manager' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 font-inter">Manager View</h4>
                  <p className="text-sm text-blue-700 font-inter">
                    You can see tickets you created and new tickets that need approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* My Tickets List */}
          <div className="space-y-4">
            {getMyTickets()
              .filter(ticket => {
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                return matchesSearch && matchesStatus
              })
              .map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-neutral-900 font-inter">{ticket.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(ticket.urgency)}`}>
                          {ticket.urgency}
                        </span>
                        {/* Show badge for tickets needing approval */}
                        {currentUser?.role === 'manager' && ticket.requestedBy !== currentUser.id && ticket.status === 'New' && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 font-inter">
                            Needs Approval
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 font-inter">{ticket.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-neutral-500 font-inter">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {ticket.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTimeAgo(ticket.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {(ticket.comments || []).length} comment{(ticket.comments || []).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
            {/* Empty state */}
            {getMyTickets().length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900 font-inter">No tickets found</h3>
                <p className="mt-1 text-sm text-neutral-500 font-inter">
                  {currentUser?.role === 'manager' 
                    ? "You haven't created any tickets and there are no new tickets needing approval."
                    : "You haven't created any tickets yet."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* All Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search active tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
            >
              <option value="all">All Active Status</option>
              <option value="New">New</option>
              <option value="Quoting">Quoting</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Complete">Complete</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Info Banner */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-neutral-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-neutral-900 font-inter">Active Tickets</h4>
                <p className="text-sm text-neutral-700 font-inter">
                  Showing all active tickets (excluding closed tickets). Total: {getActiveTickets().length}
                </p>
              </div>
            </div>
          </div>

          {/* All Active Tickets List */}
          <div className="space-y-4">
            {getActiveTickets()
              .filter(ticket => {
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                return matchesSearch && matchesStatus
              })
              .map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-neutral-900 font-inter">{ticket.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(ticket.urgency)}`}>
                          {ticket.urgency}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 font-inter">{ticket.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-neutral-500 font-inter">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {ticket.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTimeAgo(ticket.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {(ticket.comments || []).length} comment{(ticket.comments || []).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Work Orders Tab */}
      {activeTab === 'work-orders' && (
        <div className="space-y-4">
          {/* Work Orders List */}
          <div className="space-y-4">
            {workOrders.map((workOrder) => (
              <div
                key={workOrder.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-neutral-900 font-inter">{workOrder.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(workOrder.status)}`}>
                        {workOrder.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getPriorityColor(workOrder.priority)}`}>
                        {workOrder.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 font-inter">{workOrder.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500 font-inter">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {workOrder.assignedToUid || 'Unassigned'}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        £{workOrder.estimatedHours ? workOrder.estimatedHours * 50 : 0}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={isTicketModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleTicketUpdate}
        />
      )}
    </div>
  )
}

export default TicketsWorkOrders
