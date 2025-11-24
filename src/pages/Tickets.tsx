
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
  ChevronDown,
  Filter,
  GitMerge,
  ClipboardList,
  UserCheck
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
import { TicketDetailModal } from '../components/TicketDetailModal'
import TicketCards from '../components/Tickets/TicketCards'
import TicketTable from '../components/TicketTable'
import { Dropdown, DropdownOption, PageLoading, SectionLoading, ListItemSkeleton } from '../components/UI'
import WorkOrderTable from '../components/WorkOrderTable'
import { useAuth } from '../contexts/AuthContext'
import { useBuilding } from '../contexts/BuildingContext'
import { useCreateTicket } from '../contexts/CreateTicketContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useIsMobile } from '../hooks/useMediaQuery'
import { ticketService } from '../services/ticketService'
import * as workOrderService from '../services/workOrderService'
import { 
  Building as BuildingType, 
  Ticket, 
  WorkOrder, 
  TicketStatus, 
  WorkOrderStatus, 
  WorkOrderPriority 
} from '../types'

const Tickets: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const { selectedBuildingId } = useBuilding()
  const { openCreateTicketModal } = useCreateTicket()
  const isMobile = useIsMobile()
  
  // State management
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'tickets' | 'work-orders' | 'workflow'>('workflow')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // const [priorityFilter, setPriorityFilter] = useState<string>('all') // Removed as unused
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState<string | null>(null)
  
  // Filter dropdown states
  const [isWorkflowFilterOpen, setIsWorkflowFilterOpen] = useState(false)
  const [isMyTicketsFilterOpen, setIsMyTicketsFilterOpen] = useState(false)
  const [isAllTicketsFilterOpen, setIsAllTicketsFilterOpen] = useState(false)
  
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
      setTicketsLoading(true)
      setWorkOrdersLoading(true)
      
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
        setTicketsLoading(false) // Set loading to false when data arrives
      })

      // Load work orders filtered by building
      try {
        const workOrdersData = await workOrderService.getWorkOrdersByBuilding(selectedBuildingId)
        setWorkOrders(workOrdersData)
        setWorkOrdersLoading(false)
      } catch (error) {
        console.error('Error loading work orders:', error)
        // Set empty array if service fails - no mock data
        setWorkOrders([])
        setWorkOrdersLoading(false)
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
      setTicketsLoading(false)
      setWorkOrdersLoading(false)
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
        return workOrders.filter(wo => wo.status === WorkOrderStatus.RESOLVED)
      default:
        return []
    }
  }

  // Status filter options
  const statusOptions: DropdownOption[] = [
    { value: 'all', label: 'All Status', description: 'Show tickets of all statuses' },
    { value: 'New', label: 'New', description: 'New tickets awaiting review' },
    { value: 'Quoting', label: 'Quoting', description: 'Getting quotes from suppliers' },
    { value: 'Scheduled', label: 'Scheduled', description: 'Work has been scheduled' },
    { value: 'Complete', label: 'Complete', description: 'Work completed, awaiting feedback' },
    { value: 'Closed', label: 'Closed', description: 'Completed with resident feedback' },
    { value: 'Cancelled', label: 'Cancelled', description: 'Cancelled tickets' }
  ];

  const activeStatusOptions: DropdownOption[] = [
    { value: 'all', label: 'All Active Status', description: 'Show all active tickets' },
    { value: 'New', label: 'New', description: 'New tickets awaiting review' },
    { value: 'Quoting', label: 'Quoting', description: 'Getting quotes from suppliers' },
    { value: 'Scheduled', label: 'Scheduled', description: 'Work has been scheduled' },
    { value: 'Complete', label: 'Complete', description: 'Work completed, awaiting feedback' },
    { value: 'Cancelled', label: 'Cancelled', description: 'Cancelled tickets' }
  ];

  // Helper function to get filtered count for a stage
  const getFilteredStageCount = (stageId: string) => {
    return getTicketsForStage(stageId).filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      return matchesSearch && matchesStatus
    }).length
  }

  // Clean workflow stages with one-to-one status mapping (6-stage workflow)
  const workflowStages = [
    {
      id: 'new',
      title: 'New',
      description: 'New tickets awaiting manager review',
      status: 'New',
      count: isMobile ? getFilteredStageCount('new') : getTicketsForStage('new').length,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'quoting',
      title: 'Quoting',
      description: 'Getting quotes from suppliers',
      status: 'Quoting',
      count: isMobile ? getFilteredStageCount('quoting') : getTicketsForStage('quoting').length,
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      description: 'Work has been scheduled',
      status: 'Scheduled',
      count: isMobile ? getFilteredStageCount('scheduled') : getTicketsForStage('scheduled').length,
      color: 'bg-cyan-50 border-cyan-200'
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Work completed, awaiting feedback',
      status: 'Complete',
      count: isMobile ? getFilteredStageCount('complete') : getTicketsForStage('complete').length,
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'closed',
      title: 'Closed',
      description: 'Completed with resident feedback',
      status: 'Closed',
      count: isMobile ? getFilteredStageCount('closed') : getTicketsForStage('closed').length,
      color: 'bg-gray-50 border-gray-200'
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      description: 'Cancelled tickets',
      status: 'Cancelled',
      count: isMobile ? getFilteredStageCount('cancelled') : getTicketsForStage('cancelled').length,
      color: 'bg-red-50 border-red-200'
    }
  ]

  if (ticketsLoading || workOrdersLoading) {
    return <PageLoading message="Loading tickets and work orders..." />
  }

  return (
    <div className="min-h-screen bg-neutral-50" data-testid="ticket-list">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        isMobile ? 'py-2 space-y-3' : 'py-8 space-y-6'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter" data-testid="page-title">Ticketing</h1>
          </div>
          {/* New Ticket Button - Mobile only in header */}
          {isMobile && (
            <button
              onClick={openCreateTicketModal}
              className="btn-primary flex items-center justify-center px-3 min-w-[44px]"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>

      {/* Tab Navigation */}
      <div className={`${
        isMobile ? 'sticky top-0 bg-neutral-50 z-10' : ''
      }`}>
        <div className="flex items-center justify-between">
          <nav className={`-mb-px flex ${isMobile ? 'flex-1 justify-between px-4' : 'space-x-8'}`}>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter flex items-center justify-center ${isMobile ? 'min-w-[44px] relative' : ''} ${
                activeTab === 'workflow'
                  ? 'border-blue-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {isMobile ? (
                <div className="relative">
                  <GitMerge className="h-5 w-5" />
                  {(tickets.length + workOrders.length) > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 -right-4 bg-neutral-200 text-neutral-700 text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {tickets.length + workOrders.length > 99 ? '99+' : tickets.length + workOrders.length}
                    </span>
                  )}
                </div>
              ) : (
                `Workflow (${tickets.length + workOrders.length})`
              )}
            </button>
            <button
              onClick={() => setActiveTab('work-orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter flex items-center justify-center ${isMobile ? 'min-w-[44px] relative' : ''} ${
                activeTab === 'work-orders'
                  ? 'border-blue-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {isMobile ? (
                <div className="relative">
                  <Wrench className="h-5 w-5" />
                  {tickets.filter(ticket => ticket.status === 'Scheduled').length > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 -right-4 bg-neutral-200 text-neutral-700 text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {tickets.filter(ticket => ticket.status === 'Scheduled').length > 99 ? '99+' : tickets.filter(ticket => ticket.status === 'Scheduled').length}
                    </span>
                  )}
                </div>
              ) : (
                `Work Orders (${tickets.filter(ticket => ticket.status === 'Scheduled').length})`
              )}
            </button>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter flex items-center justify-center ${isMobile ? 'min-w-[44px] relative' : ''} ${
                activeTab === 'my-tickets'
                  ? 'border-blue-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {isMobile ? (
                <div className="relative">
                  <UserCheck className="h-5 w-5" />
                  {getMyTickets().length > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 -right-4 bg-neutral-200 text-neutral-700 text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {getMyTickets().length > 99 ? '99+' : getMyTickets().length}
                    </span>
                  )}
                </div>
              ) : (
                `My Tickets (${getMyTickets().length})`
              )}
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter flex items-center justify-center ${isMobile ? 'min-w-[44px] relative' : ''} ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {isMobile ? (
                <div className="relative">
                  <ClipboardList className="h-5 w-5" />
                  {tickets.length > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 -right-4 bg-neutral-200 text-neutral-700 text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {tickets.length > 99 ? '99+' : tickets.length}
                    </span>
                  )}
                </div>
              ) : (
                `All Tickets (${tickets.length})`
              )}
            </button>
          </nav>
          
          {/* New Ticket Button - Desktop only */}
          {!isMobile && (
            <button
              onClick={openCreateTicketModal}
              className="btn-primary flex items-center font-inter"
            >
              New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Workflow View */}
      {activeTab === 'workflow' && (
        <div className={isMobile ? 'space-y-3' : 'space-y-6'}>
          {/* Search and Filters - Responsive */}
          <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-6'}`}>
            <div className={`relative ${isMobile ? 'flex-1' : 'w-96'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search workflow items..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm ${isMobile ? 'h-[38px]' : 'py-1.5'}`}
              />
            </div>
            {isMobile ? (
              <div className="relative">
                <button
                  onClick={() => setIsWorkflowFilterOpen(!isWorkflowFilterOpen)}
                  className={`flex items-center justify-center w-10 h-[38px] border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors ${
                    statusFilter !== 'all' ? 'bg-primary-50 border-primary-300' : ''
                  }`}
                >
                  <Filter className={`h-4 w-4 ${
                    statusFilter !== 'all' ? 'text-primary-600' : 'text-neutral-600'
                  }`} />
                </button>
                
                {isWorkflowFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsWorkflowFilterOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value)
                              setIsWorkflowFilterOpen(false)
                              
                              // Auto-expand the relevant accordion on mobile when a specific status is selected
                              if (isMobile && option.value !== 'all') {
                                // Map status values to stage IDs
                                const statusToStageMap = {
                                  'New': 'new',
                                  'Quoting': 'quoting', 
                                  'Scheduled': 'scheduled',
                                  'Complete': 'complete',
                                  'Closed': 'closed',
                                  'Cancelled': 'cancelled'
                                }
                                const stageId = statusToStageMap[option.value]
                                if (stageId) {
                                  setSelectedWorkflowStage(stageId)
                                }
                              } else if (option.value === 'all') {
                                // Close all accordions when "All" is selected
                                setSelectedWorkflowStage(null)
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                              statusFilter === option.value ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Dropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Filter by status..."
                size="sm"
                className="min-w-[200px]"
              />
            )}
          </div>
          
          <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 lg:gap-4'}`}>
            {workflowStages.map((stage, index) => {
              // Check if this stage should be auto-expanded due to search results or status filter
              const hasSearchResults = searchTerm.length > 0 && getFilteredStageCount(stage.id) > 0
              const hasStatusFilterMatch = isMobile && statusFilter !== 'all' && statusFilter === stage.status
              const shouldExpand = selectedWorkflowStage === stage.id || hasSearchResults || hasStatusFilterMatch
              
              return isMobile ? (
                // Mobile: Accordion-style component
                <div key={stage.id} className={`rounded-lg shadow-sm border-2 overflow-hidden transition-all duration-200 ${
                  shouldExpand 
                    ? `ring-2 ring-blue-500 ${  stage.color}` 
                    : stage.color
                } ${
                  stage.count > 0 ? 'hover:shadow-md' : 'opacity-75'
                } ${
                  hasSearchResults && selectedWorkflowStage !== stage.id ? 'ring-1 ring-green-400' : ''
                } ${
                  hasStatusFilterMatch && selectedWorkflowStage !== stage.id ? 'ring-1 ring-blue-400' : ''
                }`}>
                  {/* Accordion Header */}
                  <button
                    onClick={() => setSelectedWorkflowStage(selectedWorkflowStage === stage.id ? null : stage.id)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className={`font-medium font-inter text-base ${
                        hasSearchResults ? 'text-green-700' : hasStatusFilterMatch ? 'text-blue-700' : 'text-neutral-900'
                      }`}>{stage.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-sm font-semibold font-inter ${
                        stage.count > 0 
                          ? hasSearchResults 
                            ? 'bg-green-100 text-green-800' 
                            : hasStatusFilterMatch
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-white text-neutral-700'
                          : 'bg-white/50 text-neutral-500'
                      }`}>
                        {stage.count}
                      </span>
                      {hasSearchResults && (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                          Found!
                        </span>
                      )}
                      {hasStatusFilterMatch && !hasSearchResults && (
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                          Filtered
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`h-5 w-5 text-neutral-600 transition-transform duration-200 ${
                      shouldExpand ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Accordion Content - Auto-expand when search results found */}
                  {shouldExpand && (
                    <div className="border-t border-neutral-100 p-4 bg-neutral-50">
                      {(() => {
                        const allStageTickets = getTicketsForStage(stage.id)
                        const stageTickets = allStageTickets.filter(ticket => {
                          const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                          const result = matchesSearch && matchesStatus
                          
                          return result
                        })
                        
                        if (stageTickets.length === 0) {
                          const hasTicketsButFiltered = getTicketsForStage(stage.id).length > 0
                          return (
                            <div className="text-center text-neutral-500 text-sm py-4">
                              {hasTicketsButFiltered ? 'No tickets match your search' : 'No tickets in this stage'}
                            </div>
                          )
                        }
                        
                        return (
                          <TicketCards
                            tickets={stageTickets}
                            onTicketClick={handleTicketClick}
                            className="mt-2"
                          />
                        )
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                // Desktop: Original button layout
                <button
                  key={stage.id}
                  onClick={() => setSelectedWorkflowStage(selectedWorkflowStage === stage.id ? null : stage.id)}
                  className={`w-full border-2 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full p-2 lg:p-3 min-h-[80px] hover:scale-105 ${
                    selectedWorkflowStage === stage.id 
                      ? `ring-2 ring-blue-500 ${  stage.color}` 
                      : stage.color
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-neutral-900 font-inter text-sm lg:text-base">{stage.title}</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs lg:text-sm font-semibold text-neutral-700 font-inter">
                      {stage.count}
                    </span>
                  </div>
                  <p className="text-xs lg:text-sm text-gray-600 font-inter text-left flex-1">{stage.description}</p>
                  <div className="mt-1 lg:mt-2 w-full flex justify-center lg:justify-end items-center" style={{ minHeight: '16px' }}>
                    {index < workflowStages.length - 1 && (
                      <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-neutral-400" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Filtered Stage View - Desktop Only */}
          {!isMobile && selectedWorkflowStage && (() => {
            const stageTickets = getTicketsForStage(selectedWorkflowStage)
            const stageWorkOrders = getWorkOrdersForStage(selectedWorkflowStage)
            
            return (
              <div className="space-y-4">
                {/* Direct table rendering without header */}
                {(() => {
                  // If there are only tickets, use the ticket table/cards
                  if (stageTickets.length > 0 && stageWorkOrders.length === 0) {
                    return isMobile ? (
                      <TicketCards
                        tickets={stageTickets}
                        onTicketClick={handleTicketClick}
                      />
                    ) : (
                      <TicketTable
                        tickets={stageTickets}
                        onTicketClick={handleTicketClick}
                      />
                    )
                  }
                  
                  // If there are only work orders, use the work order table
                  if (stageWorkOrders.length > 0 && stageTickets.length === 0) {
                    return (
                      <WorkOrderTable
                        workOrders={stageWorkOrders}
                      />
                    )
                  }
                  
                  // If there are both or neither, use the original card layout
                  const allItems = [...stageTickets, ...stageWorkOrders]
                  
                  if (allItems.length === 0) {
                    return (
                      <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-neutral-500 font-inter">
                          No items in this workflow stage
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="divide-y divide-neutral-200">
                        {allItems.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-start space-x-3 p-6 hover:bg-neutral-50 cursor-pointer transition-colors duration-200" 
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
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })()}

        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === 'my-tickets' && (
        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
          {/* Search and Filters - Responsive */}
          <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-6'}`}>
            <div className={`relative ${isMobile ? 'flex-1' : 'w-96'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search my tickets..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm ${isMobile ? 'h-[38px]' : 'py-1.5'}`}
              />
            </div>
            {isMobile ? (
              <div className="relative">
                <button
                  onClick={() => setIsMyTicketsFilterOpen(!isMyTicketsFilterOpen)}
                  className={`flex items-center justify-center w-10 h-[38px] border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors ${
                    statusFilter !== 'all' ? 'bg-primary-50 border-primary-300' : ''
                  }`}
                >
                  <Filter className={`h-4 w-4 ${
                    statusFilter !== 'all' ? 'text-primary-600' : 'text-neutral-600'
                  }`} />
                </button>
                
                {isMyTicketsFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsMyTicketsFilterOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value)
                              setIsMyTicketsFilterOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                              statusFilter === option.value ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Dropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Filter by status..."
                size="sm"
                className="min-w-[200px]"
              />
            )}
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
          {isMobile ? (
            <TicketCards
              tickets={getMyTickets().filter(ticket => {
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                const result = matchesSearch && matchesStatus
                
                return result
              })}
              onTicketClick={handleTicketClick}
              showApprovalBadge={true}
              currentUserId={currentUser?.id}
              userRole={currentUser?.role}
            />
          ) : (
            <TicketTable
              tickets={getMyTickets().filter(ticket => {
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                return matchesSearch && matchesStatus
              })}
              onTicketClick={handleTicketClick}
              showApprovalBadge={true}
              currentUserId={currentUser?.id}
              userRole={currentUser?.role}
            />
          )}
        </div>
      )}
      
      {/* All Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
          {/* Search and Filters - Responsive */}
          <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-6'}`}>
            <div className={`relative ${isMobile ? 'flex-1' : 'w-96'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search active tickets..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm ${isMobile ? 'h-[38px]' : 'py-1.5'}`}
              />
            </div>
            {isMobile ? (
              <div className="relative">
                <button
                  onClick={() => setIsAllTicketsFilterOpen(!isAllTicketsFilterOpen)}
                  className={`flex items-center justify-center w-10 h-[38px] border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors ${
                    statusFilter !== 'all' ? 'bg-primary-50 border-primary-300' : ''
                  }`}
                >
                  <Filter className={`h-4 w-4 ${
                    statusFilter !== 'all' ? 'text-primary-600' : 'text-neutral-600'
                  }`} />
                </button>
                
                {isAllTicketsFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsAllTicketsFilterOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        {activeStatusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value)
                              setIsAllTicketsFilterOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                              statusFilter === option.value ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Dropdown
                options={activeStatusOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder="Filter by status..."
                size="sm"
                className="min-w-[200px]"
              />
            )}
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
          {isMobile ? (
            <TicketCards
              tickets={getActiveTickets().filter(ticket => {
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                return matchesSearch && matchesStatus
              })}
              onTicketClick={handleTicketClick}
            />
          ) : (
            <TicketTable
              tickets={getActiveTickets().filter(ticket => {
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
                return matchesSearch && matchesStatus
              })}
              onTicketClick={handleTicketClick}
            />
          )}
        </div>
      )}

      {/* Work Orders Tab */}
      {activeTab === 'work-orders' && (
        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
          {/* Search - Responsive */}
          <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-6'}`}>
            <div className={`relative ${isMobile ? 'flex-1' : 'w-96'}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder={isMobile ? "Search..." : "Search scheduled tickets..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm ${isMobile ? 'h-[38px]' : 'py-1.5'}`}
              />
            </div>
            {isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                  Scheduled only
                </span>
              </div>
            )}
          </div>
          
          {/* Info Banner */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Wrench className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-cyan-900 font-inter">Scheduled Work Orders</h4>
                <p className="text-sm text-cyan-700 font-inter">
                  Showing only tickets with "Scheduled" status - work that has been approved and scheduled for completion.
                </p>
              </div>
            </div>
          </div>

          {/* Scheduled Tickets List */}
          {isMobile ? (
            <TicketCards
              tickets={tickets.filter(ticket => {
                const isScheduled = ticket.status === 'Scheduled'
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                const result = isScheduled && matchesSearch
                
                return result
              })}
              onTicketClick={handleTicketClick}
            />
          ) : (
            <TicketTable
              tickets={tickets.filter(ticket => {
                const isScheduled = ticket.status === 'Scheduled'
                const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
                return isScheduled && matchesSearch
              })}
              onTicketClick={handleTicketClick}
            />
          )}
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
    </div>
  )
}

export default Tickets
