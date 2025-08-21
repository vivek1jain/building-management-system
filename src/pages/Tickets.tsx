import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ChevronDown
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
      case 'Closed': return 'bg-neutral-100 text-gray-800'
      default: return 'bg-neutral-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-gray-800'
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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Tickets</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all maintenance tickets
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter"
            />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')}
              className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[150px]"
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as UrgencyLevel | 'All')}
              className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 min-w-[150px]"
            >
              <option value="All">All Urgencies</option>
              {urgencyOptions.map(urgency => (
                <option key={urgency} value={urgency}>{urgency}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>
          
          <Link
            to="/tickets/new"
            className="btn-primary flex items-center space-x-2"
          >
            <span>New Ticket</span>
          </Link>
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
                    <h3 className="text-lg font-medium text-neutral-900">{ticket.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(ticket.urgency)}`}>
                      {getUrgencyIcon(ticket.urgency)} {ticket.urgency}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
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
                        <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
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
            <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
              <Search className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No tickets found</h3>
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
    </div>
  )
}

export default Tickets
