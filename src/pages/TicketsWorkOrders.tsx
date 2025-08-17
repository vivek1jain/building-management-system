import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useBuilding } from '../contexts/BuildingContext'
import { ticketService } from '../services/ticketService'
import * as workOrderService from '../services/workOrderService'
import { TicketDetailModal } from '../components/TicketDetailModal'
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
  const { buildings, selectedBuildingId, selectedBuilding, setSelectedBuildingId, loading: buildingsLoading } = useBuilding()
  
  // State management
  const [activeTab, setActiveTab] = useState<'tickets' | 'work-orders' | 'workflow'>('workflow')
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
    if (selectedBuildingId) {
      loadTicketsAndWorkOrders()
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
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: TicketStatus | WorkOrderStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quote Requested': return 'bg-yellow-100 text-yellow-800'
      case 'Quote Received': return 'bg-purple-100 text-purple-800'
      case 'PO Sent': return 'bg-indigo-100 text-indigo-800'
      case 'Contracted': return 'bg-orange-100 text-orange-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Complete':
        return 'bg-success-100 text-success-800'
      case 'Closed': return 'bg-neutral-100 text-gray-800'
      case 'Triage': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
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

  // Modal handler functions already defined above

  // Workflow stages based on the diagram
  const workflowStages = [
    {
      id: 'new-ticket',
      title: 'New Ticket',
      description: 'User submits a new ticket',
      status: 'New',
      count: tickets.filter(t => t.status === 'New').length,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'manager-review',
      title: 'Manager Review',
      description: 'Manager reviews and approves ticket',
      status: 'Quote Requested',
      count: tickets.filter(t => t.status === 'Quote Requested').length,
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'quote-management',
      title: 'Quote Management',
      description: 'Request and manage supplier quotes',
      status: 'Quote Received',
      count: tickets.filter(t => t.status === 'Quote Received').length,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'work-order',
      title: 'Work Order',
      description: 'Create and manage work orders',
      status: 'Scheduled',
      count: tickets.filter(t => t.status === 'Scheduled').length + workOrders.filter(wo => wo.status === 'Scheduled').length,
      color: 'bg-cyan-50 border-cyan-200'
    },
    {
      id: 'completion',
      title: 'Completion',
      description: 'Work completed and feedback',
      status: 'Complete',
      count: tickets.filter(t => t.status === 'Complete').length + workOrders.filter(workOrder => workOrder.status !== 'Complete').length,
      color: 'bg-success-50 border-success-200'
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
          <h1 className="text-2xl font-bold text-neutral-900 font-inter">Tickets & Work Orders</h1>
          <p className="text-gray-600 mt-1 font-inter">
            Manage tickets and work orders following the complete workflow
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Building Selector */}
          <div className="relative flex items-center gap-2">
            <Building className="h-4 w-4 text-neutral-400" />
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[200px]"
              disabled={buildingsLoading}
              title={`Current building: ${buildings.find(b => b.id === selectedBuildingId)?.name || 'Select building'}`}
            >
              <option value="">{buildingsLoading ? 'Loading buildings...' : 'Select Building'}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>
          <Link
            to="/tickets/new"
            className="btn-primary flex items-center font-inter"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'workflow'
                ? 'border-blue-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Workflow View
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Tickets ({tickets.length})
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setSelectedWorkflowStage(selectedWorkflowStage === stage.id ? null : stage.id)}
                className={`border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
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
                <p className="text-sm text-gray-600 font-inter">{stage.description}</p>
                {index < workflowStages.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <ArrowRight className="h-5 w-5 text-neutral-400" />
                  </div>
                )}
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
                    ...tickets.filter(ticket => {
                      const stage = workflowStages.find(s => s.id === selectedWorkflowStage);
                      return stage && ticket.status === stage.status;
                    }),
                    ...workOrders.filter(workOrder => {
                      const stage = workflowStages.find(s => s.id === selectedWorkflowStage);
                      return stage && workOrder.status === stage.status;
                    })
                  ].map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-neutral-50">
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
                        <p className="text-sm text-gray-600">Work order scheduled</p>
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
                    ...tickets.filter(ticket => {
                      const stage = workflowStages.find(s => s.id === selectedWorkflowStage);
                      return stage && ticket.status === stage.status;
                    }),
                    ...workOrders.filter(workOrder => {
                      const stage = workflowStages.find(s => s.id === selectedWorkflowStage);
                      return stage && workOrder.status === stage.status;
                    })
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

          {/* Recent Activity */}
          {!selectedWorkflowStage && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[...tickets, ...workOrders]
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
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
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tickets..."
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
              <option value="Quote Requested">Quote Requested</option>
              <option value="Quote Received">Quote Received</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
            </select>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {tickets
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
