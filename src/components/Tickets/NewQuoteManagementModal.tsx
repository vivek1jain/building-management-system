import { useState, useEffect } from 'react'
import {
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Mail,
  Plus,
  Edit,
  Send,
  Save,
  X,
  User,
  Phone,
  Star,
  Check,
  XCircle,
  Award
} from 'lucide-react'
import { Supplier, QuoteRequest, QuoteRequestStatus } from '../../types'
import { supplierService } from '../../services/supplierService'
import { quoteRequestService } from '../../services/quoteRequestService'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'

interface QuoteManagementModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  quoteRequests: QuoteRequest[]
  onQuotesUpdated: () => void
}

interface QuoteForm {
  amount: number
  notes: string
  validUntil: Date
}

const NewQuoteManagementModal = ({
  isOpen,
  onClose,
  ticketId,
  quoteRequests: initialQuoteRequests,
  onQuotesUpdated
}: QuoteManagementModalProps) => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>(initialQuoteRequests)

  // Update local state when props change
  useEffect(() => {
    setQuoteRequests(initialQuoteRequests)
  }, [initialQuoteRequests])
  const [loading, setLoading] = useState(false)
  const [showAddSuppliers, setShowAddSuppliers] = useState(false)
  const [editingQuote, setEditingQuote] = useState<string | null>(null)
  const [quoteForm, setQuoteForm] = useState<QuoteForm>({
    amount: 0,
    notes: '',
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  })
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [rejectingQuote, setRejectingQuote] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      setQuoteRequests(initialQuoteRequests)
      resetForms()
    }
  }, [isOpen, initialQuoteRequests])

  const resetForms = () => {
    setSelectedSuppliers([])
    setEditingQuote(null)
    setRejectingQuote(null)
    setRejectionReason('')
    setQuoteForm({
      amount: 0,
      notes: '',
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    })
  }

  const loadSuppliers = async () => {
    try {
      const suppliersData = await supplierService.getSuppliers()
      setSuppliers(suppliersData || [])
    } catch (error) {
      console.error('Failed to load suppliers:', error)
      if (currentUser) {
        addNotification({
          title: 'Error',
          message: 'Failed to load suppliers. Please try again.',
          type: 'error',
          userId: currentUser.id
        })
      }
    }
  }

  const getSupplier = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)
  }

  const getStatusColor = (status: QuoteRequestStatus) => {
    switch (status) {
      case QuoteRequestStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case QuoteRequestStatus.RECEIVED: return 'bg-blue-100 text-blue-800 border-blue-200'
      case QuoteRequestStatus.ACCEPTED: return 'bg-green-100 text-green-800 border-green-200'
      case QuoteRequestStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200'
      case QuoteRequestStatus.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: QuoteRequestStatus) => {
    switch (status) {
      case QuoteRequestStatus.PENDING: return <Clock className="h-4 w-4" />
      case QuoteRequestStatus.RECEIVED: return <DollarSign className="h-4 w-4" />
      case QuoteRequestStatus.ACCEPTED: return <CheckCircle className="h-4 w-4" />
      case QuoteRequestStatus.REJECTED: return <XCircle className="h-4 w-4" />
      case QuoteRequestStatus.CANCELLED: return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleEditQuote = (request: QuoteRequest) => {
    setQuoteForm({
      amount: request.quoteAmount || 0,
      notes: request.notes || '',
      validUntil: request.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    })
    setEditingQuote(request.supplierId)
  }

  const handleSaveQuote = async () => {
    if (!currentUser || !editingQuote) return

    if (quoteForm.amount <= 0) {
      addNotification({
        title: 'Invalid Quote',
        message: 'Please enter a valid quote amount',
        type: 'warning',
        userId: currentUser.id
      })
      return
    }

    setLoading(true)
    try {
      await quoteRequestService.updateQuoteAmount(
        ticketId,
        editingQuote,
        quoteForm.amount,
        quoteForm.notes,
        quoteForm.validUntil,
        currentUser.id
      )

      // Update local state
      const updatedRequests = quoteRequests.map(req => 
        req.supplierId === editingQuote
          ? { 
              ...req, 
              status: QuoteRequestStatus.RECEIVED, 
              quoteAmount: quoteForm.amount,
              notes: quoteForm.notes,
              validUntil: quoteForm.validUntil,
              updatedAt: new Date() 
            }
          : req
      )
      setQuoteRequests(updatedRequests)

      addNotification({
        title: 'Quote Saved',
        message: `Quote from ${getSupplier(editingQuote)?.name} has been recorded`,
        type: 'success',
        userId: currentUser.id
      })

      setEditingQuote(null)
      onQuotesUpdated()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to save quote. Please try again.',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptQuote = async (supplierId: string) => {
    if (!currentUser) return

    setLoading(true)
    try {
      await quoteRequestService.acceptQuote(ticketId, supplierId, currentUser.id)

      // Update local state
      const updatedRequests = quoteRequests.map(req => {
        if (req.supplierId === supplierId) {
          return { ...req, status: QuoteRequestStatus.ACCEPTED, isWinner: true, updatedAt: new Date() }
        } else if (req.status === QuoteRequestStatus.RECEIVED) {
          return { ...req, status: QuoteRequestStatus.REJECTED, isWinner: false, rejectionReason: 'Another quote was selected', updatedAt: new Date() }
        }
        return req
      })
      setQuoteRequests(updatedRequests)

      const supplier = getSupplier(supplierId)
      addNotification({
        title: 'Quote Accepted',
        message: `Quote from ${supplier?.name} has been accepted`,
        type: 'success',
        userId: currentUser.id
      })

      onQuotesUpdated()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to accept quote. Please try again.',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRejectQuote = async () => {
    if (!currentUser || !rejectingQuote) return

    if (!rejectionReason.trim()) {
      addNotification({
        title: 'Rejection Reason Required',
        message: 'Please provide a reason for rejecting this quote',
        type: 'warning',
        userId: currentUser.id
      })
      return
    }

    setLoading(true)
    try {
      await quoteRequestService.rejectQuote(ticketId, rejectingQuote, rejectionReason, currentUser.id)

      // Update local state
      const updatedRequests = quoteRequests.map(req => 
        req.supplierId === rejectingQuote
          ? { ...req, status: QuoteRequestStatus.REJECTED, rejectionReason, isWinner: false, updatedAt: new Date() }
          : req
      )
      setQuoteRequests(updatedRequests)

      const supplier = getSupplier(rejectingQuote)
      addNotification({
        title: 'Quote Rejected',
        message: `Quote from ${supplier?.name} has been rejected`,
        type: 'success',
        userId: currentUser.id
      })

      setRejectingQuote(null)
      setRejectionReason('')
      onQuotesUpdated()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to reject quote. Please try again.',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoreSuppliers = async () => {
    if (!currentUser || selectedSuppliers.length === 0) return

    setLoading(true)
    try {
      await quoteRequestService.requestQuotes(ticketId, selectedSuppliers, currentUser.id)

      // Add new quote requests to local state
      const newRequests = selectedSuppliers.map(supplierId => {
        const supplier = getSupplier(supplierId)
        return {
          id: `${ticketId}-${supplierId}-${Date.now()}`,
          supplierId,
          supplierName: supplier?.name || 'Unknown',
          supplierEmail: supplier?.email || '',
          specialties: supplier?.specialties || [],
          sentAt: new Date(),
          status: QuoteRequestStatus.PENDING,
          quoteAmount: null,
          notes: null,
          validUntil: null,
          isWinner: false,
          rejectionReason: null,
          responseTime: null
        } as QuoteRequest
      })

      setQuoteRequests([...quoteRequests, ...newRequests])
      setShowAddSuppliers(false)
      setSelectedSuppliers([])

      addNotification({
        title: 'Quote Requests Sent',
        message: `Quote requests sent to ${selectedSuppliers.length} additional supplier(s)`,
        type: 'success',
        userId: currentUser.id
      })

      onQuotesUpdated()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to send additional quote requests',
        type: 'error',
        userId: currentUser.id
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  const calculateResponseTime = (sentAt: Date, updatedAt?: Date) => {
    if (!updatedAt) return 'No response yet'
    
    const sentTime = new Date(sentAt).getTime()
    const endTime = new Date(updatedAt).getTime()
    
    // Check for invalid dates
    if (isNaN(sentTime) || isNaN(endTime)) {
      return 'Response time unavailable'
    }
    
    const hours = Math.round((endTime - sentTime) / (1000 * 60 * 60))
    
    if (isNaN(hours) || hours < 0) {
      return 'Response time unavailable'
    }
    
    if (hours < 1) {
      return 'Less than 1h'
    } else if (hours < 24) {
      return `${hours}h`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
    }
  }

  // Calculate summary stats
  const pendingCount = quoteRequests.filter(r => r.status === QuoteRequestStatus.PENDING).length
  const receivedCount = quoteRequests.filter(r => r.status === QuoteRequestStatus.RECEIVED).length
  const acceptedCount = quoteRequests.filter(r => r.status === QuoteRequestStatus.ACCEPTED).length
  
  const quotesWithAmounts = quoteRequests.filter(r => r.quoteAmount && r.quoteAmount > 0)
  const bestPrice = quotesWithAmounts.length > 0 
    ? Math.min(...quotesWithAmounts.map(r => r.quoteAmount!))
    : null

  const availableSuppliers = suppliers.filter(supplier => 
    !quoteRequests.some(req => req.supplierId === supplier.id)
  )

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quote Management"
      description="Manage supplier quotes for this ticket"
      size="xl"
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900 mb-1">{quoteRequests.length}</div>
              <div className="text-sm font-medium text-neutral-600">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 mb-1">{pendingCount}</div>
              <div className="text-sm font-medium text-neutral-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">{receivedCount}</div>
              <div className="text-sm font-medium text-neutral-600">Received</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-1">
                {bestPrice ? formatCurrency(bestPrice) : '—'}
              </div>
              <div className="text-sm font-medium text-neutral-600">Best Price</div>
            </div>
          </div>
        </div>

        {/* Quote Requests List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Quote Requests</h3>
            {availableSuppliers.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowAddSuppliers(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Suppliers
              </Button>
            )}
          </div>

          {quoteRequests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quote Requests</h3>
              <p className="text-gray-600">
                Start by requesting quotes from suppliers for this ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {quoteRequests.map((request) => {
                const supplier = getSupplier(request.supplierId)
                const isEditing = editingQuote === request.supplierId
                const isRejecting = rejectingQuote === request.supplierId

                return (
                  <div
                    key={request.id}
                    className="bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Header with status indicator */}
                    <div className="flex items-center justify-between p-6 pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-neutral-900">{request.supplierName}</h4>
                          <p className="text-sm text-neutral-600">{supplier?.companyName}</p>
                          {supplier?.rating && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-4 w-4 text-warning-400 fill-current" />
                              <span className="text-sm text-neutral-600">{supplier.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)} border`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-2">{request.status}</span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-neutral-400" />
                          <span className="text-neutral-600">{request.supplierEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <span className="text-neutral-600">
                            Sent: {formatDate(request.sentAt)}
                          </span>
                        </div>
                        {supplier?.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-600">{supplier.phone}</span>
                          </div>
                        )}
                        {request.updatedAt && (
                          <div className="flex items-center space-x-2 md:col-span-2 lg:col-span-3">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-600">
                              Response time: {calculateResponseTime(request.sentAt, request.updatedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quote Status Content */}
                    <div className="px-6 pb-6">
                      {request.status === QuoteRequestStatus.PENDING && (
                        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-warning-600" />
                              </div>
                              <div>
                                <span className="text-base font-semibold text-warning-800">Awaiting Quote</span>
                                <p className="text-sm text-warning-600 mt-1">No response received yet</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuote(request)}
                              className="border-warning-300 text-warning-700 hover:bg-warning-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Quote
                            </Button>
                          </div>
                        </div>
                      )}

                      {request.status === QuoteRequestStatus.RECEIVED && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <span className="text-base font-semibold text-primary-800">Quote Received</span>
                                <div className="text-2xl font-bold text-primary-900 mt-1">
                                  {formatCurrency(request.quoteAmount!)}
                                </div>
                                {request.notes && (
                                  <p className="text-sm text-primary-700 mt-2 bg-white rounded-md p-2 border border-primary-200">{request.notes}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuote(request)}
                              className="border-primary-300 text-primary-700 hover:bg-primary-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex space-x-3">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAcceptQuote(request.supplierId)}
                              disabled={loading || acceptedCount > 0}
                              className="flex items-center flex-1 justify-center"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept Quote
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectingQuote(request.supplierId)}
                              disabled={loading}
                              className="flex items-center border-danger-300 text-danger-600 hover:bg-danger-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {request.status === QuoteRequestStatus.ACCEPTED && (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-success-100 flex items-center justify-center">
                              <Award className="h-6 w-6 text-success-600" />
                            </div>
                            <div className="flex-1">
                              <span className="text-base font-semibold text-success-800">Winning Quote</span>
                              <div className="text-2xl font-bold text-success-900 mt-1">
                                {formatCurrency(request.quoteAmount!)}
                              </div>
                              <div className="inline-flex items-center px-3 py-1 rounded-full bg-success-100 text-success-700 text-sm font-medium mt-2">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Selected for this project
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {request.status === QuoteRequestStatus.REJECTED && (
                        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-danger-100 flex items-center justify-center">
                              <XCircle className="h-5 w-5 text-danger-600" />
                            </div>
                            <div className="flex-1">
                              <span className="text-base font-semibold text-danger-800">Quote Rejected</span>
                              {request.rejectionReason && (
                                <p className="text-sm text-danger-700 mt-2 bg-white rounded-md p-2 border border-danger-200">{request.rejectionReason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quote Entry Form */}
                    {isEditing && (
                      <div className="border-t border-neutral-200 bg-neutral-50 p-6 space-y-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Edit className="h-4 w-4 text-primary-600" />
                          </div>
                          <h5 className="text-lg font-semibold text-neutral-900">
                            {request.quoteAmount ? 'Edit Quote Details' : 'Enter Quote Details'}
                          </h5>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                              Quote Amount (£) *
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              <input
                                type="number"
                                value={quoteForm.amount}
                                onChange={(e) => setQuoteForm({...quoteForm, amount: parseFloat(e.target.value) || 0})}
                                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                              Valid Until
                            </label>
                            <input
                              type="date"
                              value={quoteForm.validUntil.toISOString().split('T')[0]}
                              onChange={(e) => setQuoteForm({...quoteForm, validUntil: new Date(e.target.value)})}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Notes & Additional Details
                          </label>
                          <textarea
                            value={quoteForm.notes}
                            onChange={(e) => setQuoteForm({...quoteForm, notes: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                            placeholder="Quote details, timeline, special conditions, warranty information..."
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingQuote(null)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleSaveQuote}
                            disabled={loading || quoteForm.amount <= 0}
                            loading={loading}
                            className="flex items-center"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Quote'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Rejection Form */}
                    {isRejecting && (
                      <div className="border-t border-neutral-200 bg-danger-50 p-6 space-y-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-8 w-8 rounded-full bg-danger-100 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-danger-600" />
                          </div>
                          <h5 className="text-lg font-semibold text-danger-900">Reject Quote</h5>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Reason for Rejection *
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-danger-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-danger-500 transition-colors resize-none bg-white"
                            placeholder="Please provide a detailed reason for rejecting this quote. This will be communicated to the supplier."
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectingQuote(null)
                              setRejectionReason('')
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="danger"
                            onClick={handleRejectQuote}
                            disabled={loading || !rejectionReason.trim()}
                            loading={loading}
                            className="flex items-center"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {loading ? 'Rejecting...' : 'Reject Quote'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Suppliers Modal */}
        {showAddSuppliers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1500] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900">Add More Suppliers</h3>
                  <p className="text-sm text-neutral-600 mt-1">Select additional suppliers to request quotes from</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddSuppliers(false)
                    setSelectedSuppliers([])
                  }}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {availableSuppliers.length > 0 ? (
                  <div className="grid gap-4">
                    {availableSuppliers.map((supplier) => (
                      <label
                        key={supplier.id}
                        className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedSuppliers.includes(supplier.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuppliers([...selectedSuppliers, supplier.id])
                            } else {
                              setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id))
                            }
                          }}
                          className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded transition-colors"
                        />
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-neutral-900 truncate">{supplier.name}</span>
                            {supplier.rating && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <Star className="h-4 w-4 text-warning-400 fill-current" />
                                <span className="text-sm text-neutral-600">{supplier.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 truncate mb-2">{supplier.companyName}</p>
                          <div className="flex flex-wrap gap-1">
                            {supplier.specialties.slice(0, 4).map((specialty) => (
                              <span
                                key={specialty}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700"
                              >
                                {specialty}
                              </span>
                            ))}
                            {supplier.specialties.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-500">
                                +{supplier.specialties.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedSuppliers.includes(supplier.id) && (
                          <CheckCircle className="h-6 w-6 text-primary-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <h4 className="text-lg font-medium text-neutral-900 mb-2">No Additional Suppliers</h4>
                    <p className="text-sm text-neutral-600">All available suppliers have already been contacted for quotes.</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
                <div className="text-sm font-medium text-neutral-600">
                  {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddSuppliers(false)
                      setSelectedSuppliers([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddMoreSuppliers}
                    disabled={selectedSuppliers.length === 0 || loading}
                    loading={loading}
                    className="flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Sending...' : `Send Requests (${selectedSuppliers.length})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {receivedCount > 0 && acceptedCount === 0 && (
          <div className="text-sm text-gray-600">
            {receivedCount} quote{receivedCount !== 1 ? 's' : ''} ready for review
          </div>
        )}
        {acceptedCount > 0 && (
          <div className="text-sm text-green-600 font-medium">
            ✓ Quote accepted - Ready to proceed
          </div>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default NewQuoteManagementModal
