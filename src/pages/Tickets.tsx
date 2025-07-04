import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import { Ticket, TicketStatus, UrgencyLevel } from '../types'

const Tickets = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All')
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'All'>('All')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = ticketService.subscribeToTickets((tickets) => {
      setTickets(tickets)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Quote Requested': return 'bg-yellow-100 text-yellow-800'
      case 'Quote Received': return 'bg-purple-100 text-purple-800'
      case 'PO Sent': return 'bg-indigo-100 text-indigo-800'
      case 'Contracted': return 'bg-orange-100 text-orange-800'
      case 'Scheduled': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Complete': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyIcon = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Low': return '🟢'
      case 'Medium': return '🟡'
      case 'High': return '🟠'
      case 'Critical': return '🔴'
      default: return '⚪'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter
    const matchesUrgency = urgencyFilter === 'All' || ticket.urgency === urgencyFilter
    
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const statusOptions: TicketStatus[] = ['New', 'Quote Requested', 'Quote Received', 'PO Sent', 'Contracted', 'Scheduled', 'In Progress', 'Complete', 'Closed']
  const urgencyOptions: UrgencyLevel[] = ['Low', 'Medium', 'High', 'Critical']

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
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all maintenance tickets
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')}
            className="select"
          >
            <option value="All">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as UrgencyLevel | 'All')}
            className="select"
          >
            <option value="All">All Urgencies</option>
            {urgencyOptions.map(urgency => (
              <option key={urgency} value={urgency}>{urgency}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('All')
              setUrgencyFilter('All')
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/tickets/${ticket.id}`}
            className="card hover:shadow-apple-lg transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(ticket.urgency)}`}>
                    {getUrgencyIcon(ticket.urgency)} {ticket.urgency}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {ticket.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTimeAgo(ticket.createdAt)}
                  </div>
                  {ticket.attachments.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {ticket.attachments.length} attachment{ticket.attachments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {ticket.status === 'Complete' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {ticket.urgency === 'Critical' && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'All' || urgencyFilter !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first ticket'
            }
          </p>
          {!searchTerm && statusFilter === 'All' && urgencyFilter === 'All' && (
            <Link to="/tickets/new" className="btn-primary">
              Create First Ticket
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default Tickets 