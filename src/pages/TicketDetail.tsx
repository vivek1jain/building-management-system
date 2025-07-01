import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  MapPin,
  Clock,
  User,
  FileText,
  MessageSquare,
  Calendar,
  DollarSign,
  Edit,
  Plus,
  Eye,
  EyeOff,
  X,
  Building,
  Star,
  Mail,
  CheckCircle,
  Search,
  Filter,
  Send
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import { supplierService } from '../services/supplierService'
import { eventService } from '../services/eventService'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Ticket, TicketStatus, UrgencyLevel, Supplier, BuildingEvent } from '../types'
import QuoteComparison from '../components/Quotes/QuoteComparison'
import ScheduleModal from '../components/Scheduling/ScheduleModal'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuoteComparison, setShowQuoteComparison] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('All')
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduledEvents, setScheduledEvents] = useState<BuildingEvent[]>([])

  useEffect(() => {
    if (!id) return

    const fetchTicket = async () => {
      try {
        const ticketData = await ticketService.getTicketById(id)
        setTicket(ticketData)
      } catch (error) {
        console.error('Error fetching ticket:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id])

  useEffect(() => {
    if (!id) return
    const fetchEvents = async () => {
      try {
        const events = await eventService.getEventsByTicketId(id)
        setScheduledEvents(events)
      } catch (error) {
        console.error('Error fetching events:', error)
        setScheduledEvents([])
      }
    }
    fetchEvents()
  }, [id])

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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

  const handleSelectQuote = async (quoteId: string) => {
    try {
      // Update quote status to accepted
      // Note: updatedQuotes variable removed as it was unused

      // Update ticket status to "PO Sent"
      await ticketService.updateTicketStatus(ticket?.id || '', 'PO Sent', currentUser?.id || '')
      
      addNotification({
        title: 'Quote Selected',
        message: 'The quote has been selected and PO has been sent.',
        type: 'success',
        userId: currentUser?.id || ''
      })

      setSelectedQuoteId(quoteId)
      setShowQuoteComparison(false)
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to select quote. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    }
  }

  const handleRequestRevision = () => {
    addNotification({
      title: 'Revision Requested',
      message: 'A revision request has been sent to the supplier.',
      type: 'info',
      userId: currentUser?.id || ''
    })
  }

  const handleDeclineQuote = () => {
    addNotification({
      title: 'Quote Declined',
      message: 'The quote has been declined.',
      type: 'warning',
      userId: currentUser?.id || ''
    })
  }

  const handleRequestQuotes = () => {
    console.log('Request Quotes button clicked')
    setShowSupplierModal(true)
    loadSuppliers()
  }

  const loadSuppliers = async () => {
    console.log('Loading suppliers...')
    setSupplierLoading(true)
    try {
      const suppliersData = await supplierService.getSuppliers()
      console.log('Suppliers loaded:', suppliersData.length)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to load suppliers',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setSupplierLoading(false)
    }
  }

  const handleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleRequestQuotesFromSuppliers = async () => {
    console.log('Requesting quotes from suppliers:', selectedSuppliers)
    if (selectedSuppliers.length === 0) {
      addNotification({
        title: 'No Suppliers Selected',
        message: 'Please select at least one supplier to request quotes from.',
        type: 'warning',
        userId: currentUser?.id || ''
      })
      return
    }

    setRequesting(true)
    try {
      console.log('Sending quote requests...')
      await supplierService.requestQuotes(ticket?.id || '', selectedSuppliers, currentUser?.id || '')
      
      // Update ticket status to "Quote Requested"
      console.log('Updating ticket status...')
      await ticketService.updateTicketStatus(ticket?.id || '', 'Quote Requested', currentUser?.id || '')
      
      addNotification({
        title: 'Quote Requests Sent',
        message: `Quote requests sent to ${selectedSuppliers.length} supplier(s).`,
        type: 'success',
        userId: currentUser?.id || ''
      })

      setShowSupplierModal(false)
      setSelectedSuppliers([])
    } catch (error) {
      console.error('Error requesting quotes:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to send quote requests. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setRequesting(false)
    }
  }

  const specialties = ['All', 'Plumbing', 'HVAC', 'Electrical', 'General Maintenance', 'Cleaning', 'Landscaping', 'Emergency Repairs', 'Lighting', 'Security Systems']

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSpecialty = filterSpecialty === 'All' || supplier.specialties.includes(filterSpecialty)
    
    return matchesSearch && matchesSpecialty && supplier.isActive
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const handleScheduleWork = async (event: BuildingEvent) => {
    try {
      // Save event using eventService
      const createdEvent = await eventService.createEvent({
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        ticketId: event.ticketId,
        assignedTo: event.assignedTo,
        status: event.status
      })
      
      // Update ticket status
      await ticketService.updateTicketStatus(ticket?.id || '', 'Scheduled', currentUser?.id || '')
      
      // Add to local state
      setScheduledEvents((prev) => [...prev, createdEvent])
      
      // Refetch ticket
      if (id) {
        const updatedTicket = await ticketService.getTicketById(id)
        setTicket(updatedTicket)
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to schedule event.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket not found</h3>
        <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary">
          Back to Tickets
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-gray-600">Ticket #{ticket.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
            {ticket.status}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(ticket.urgency)}`}>
            {getUrgencyIcon(ticket.urgency)} {ticket.urgency}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
          </div>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {ticket.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-700">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Quotes ({ticket.quotes.length})</h3>
              <div className="flex items-center space-x-2">
                {ticket.quotes.length > 0 && (
                  <button
                    onClick={() => setShowQuoteComparison(!showQuoteComparison)}
                    className="btn-secondary flex items-center"
                  >
                    {showQuoteComparison ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showQuoteComparison ? 'Hide Comparison' : 'Compare Quotes'}
                  </button>
                )}
                <button
                  onClick={handleRequestQuotes}
                  className="btn-primary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Quote
                </button>
              </div>
            </div>

            {showQuoteComparison && ticket.quotes.length > 0 ? (
              <QuoteComparison
                quotes={ticket.quotes}
                suppliers={[]} // In real app, fetch suppliers from context/service
                onSelectQuote={handleSelectQuote}
                onRequestRevision={handleRequestRevision}
                onDeclineQuote={handleDeclineQuote}
                selectedQuoteId={selectedQuoteId}
              />
            ) : ticket.quotes.length > 0 ? (
              <div className="space-y-4">
                {ticket.quotes.map((quote) => (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-lg font-semibold text-gray-900">
                          ${quote.amount.toLocaleString()}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quote.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{quote.description}</p>
                    <p className="text-sm text-gray-600 mb-3">{quote.terms}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Valid until: {formatDate(quote.validUntil)}</span>
                      <span>Submitted: {formatTimeAgo(quote.submittedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No quotes received yet</p>
                <p className="text-sm">Request quotes from suppliers to get started</p>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Log</h3>
            <div className="space-y-4">
              {ticket.activityLog.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{ticket.location}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Requested By</p>
                  <p className="text-sm text-gray-600">User ID: {ticket.requestedBy}</p>
                </div>
              </div>

              {ticket.assignedTo && (
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned To</p>
                    <p className="text-sm text-gray-600">User ID: {ticket.assignedTo}</p>
                  </div>
                </div>
              )}

              {ticket.scheduledDate && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Scheduled</p>
                    <p className="text-sm text-gray-600">{formatDate(ticket.scheduledDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary flex items-center justify-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit Ticket
              </button>
              
              <button className="w-full btn-secondary flex items-center justify-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </button>
              
              <button
                onClick={handleRequestQuotes}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Selection Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Request Quotes from Suppliers</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select suppliers to request quotes for this ticket
                </p>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="select"
                >
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterSpecialty('All')
                  }}
                  className="btn-secondary flex items-center justify-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {supplierLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className={`card cursor-pointer transition-all duration-200 ${
                        selectedSuppliers.includes(supplier.id)
                          ? 'ring-2 ring-primary-500 bg-primary-50'
                          : 'hover:shadow-apple-lg'
                      }`}
                      onClick={() => handleSupplierSelection(supplier.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                            <p className="text-sm text-gray-600">{supplier.companyName}</p>
                          </div>
                        </div>
                        {selectedSuppliers.includes(supplier.id) && (
                          <CheckCircle className="h-5 w-5 text-primary-600" />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{supplier.companyName}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {renderStars(supplier.rating ?? 0)}
                          <span className="text-sm text-gray-600 ml-1">
                            {supplier.rating ? `(${supplier.rating}) • ${supplier.totalJobs} jobs` : `${supplier.totalJobs} jobs`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {supplier.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{supplier.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!supplierLoading && filteredSuppliers.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestQuotesFromSuppliers}
                  disabled={selectedSuppliers.length === 0 || requesting}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {requesting ? 'Sending...' : `Request Quotes (${selectedSuppliers.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Work Button (visible to manager/supplier if not scheduled/completed) */}
      {ticket && (ticket.status === 'Contracted' || ticket.status === 'PO Sent') && (currentUser?.role === 'manager' || currentUser?.role === 'supplier') && (
        <button
          className="btn-primary mt-4"
          onClick={() => setShowScheduleModal(true)}
        >
          <Calendar className="h-4 w-4 mr-2 inline" /> Schedule Work
        </button>
      )}

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        ticket={ticket!}
        onScheduled={handleScheduleWork}
      />

      {/* Show scheduled events */}
      {scheduledEvents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Events</h3>
          <ul className="space-y-2">
            {scheduledEvents.map(event => (
              <li key={event.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{event.title}</span>
                  <span className="text-xs text-gray-500">{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{event.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default TicketDetail 