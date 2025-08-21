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
  Star
} from 'lucide-react'
import { Supplier, QuoteRequest, QuoteRequestStatus } from '../../types'
import { supplierService } from '../../services/supplierService'
import { ticketService } from '../../services/ticketService'
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

interface QuoteEntry {
  supplierId: string
  amount: number
  description: string
  terms: string
  validUntil: Date
}

const QuoteManagementModal = ({
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
  const [loading, setLoading] = useState(false)
  const [showAddSuppliers, setShowAddSuppliers] = useState(false)
  const [editingQuote, setEditingQuote] = useState<string | null>(null)
  const [quoteForm, setQuoteForm] = useState<QuoteEntry>({
    supplierId: '',
    amount: 0,
    description: '',
    terms: '',
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  })
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      setQuoteRequests(initialQuoteRequests)
      setSelectedSuppliers([]) // Reset selection when modal opens
    }
  }, [isOpen, initialQuoteRequests])

  const loadSuppliers = async () => {
    try {
      const suppliersData = await supplierService.getSuppliers()
      setSuppliers(suppliersData || [])
    } catch (error) {
      console.error('Failed to load suppliers:', error)
      setSuppliers([])
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
      case QuoteRequestStatus.PENDING: return 'bg-yellow-100 text-yellow-800'
      case QuoteRequestStatus.RECEIVED: return 'bg-green-100 text-green-800'
      case QuoteRequestStatus.ACCEPTED: return 'bg-blue-100 text-blue-800'
      case QuoteRequestStatus.REJECTED: return 'bg-red-100 text-red-800'
      case QuoteRequestStatus.CANCELLED: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: QuoteRequestStatus) => {
    switch (status) {
      case QuoteRequestStatus.PENDING: return <Clock className="h-4 w-4" />
      case QuoteRequestStatus.RECEIVED: return <CheckCircle className="h-4 w-4" />
      case QuoteRequestStatus.ACCEPTED: return <CheckCircle className="h-4 w-4" />
      case QuoteRequestStatus.REJECTED: return <X className="h-4 w-4" />
      case QuoteRequestStatus.CANCELLED: return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleAddQuote = (supplierId: string) => {
    setQuoteForm({
      supplierId,
      amount: 0,
      description: '',
      terms: '',
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    })
    setEditingQuote(supplierId)
  }

  const handleEditQuote = (request: QuoteRequest) => {
    setQuoteForm({
      supplierId: request.supplierId,
      amount: request.quoteAmount || 0,
      description: request.notes || '',
      terms: '',
      validUntil: request.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    })
    setEditingQuote(request.supplierId)
  }

  const handleSaveQuote = async () => {
    if (!currentUser) return

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
      await ticketService.updateQuoteRequest(ticketId, quoteForm.supplierId, {
        amount: quoteForm.amount,
        description: quoteForm.description,
        terms: quoteForm.terms,
        validUntil: quoteForm.validUntil
      }, currentUser.id)

      // Update the quote request status
      const updatedRequests = quoteRequests.map(req => 
        req.supplierId === quoteForm.supplierId
          ? { ...req, status: QuoteRequestStatus.RECEIVED, quoteAmount: quoteForm.amount, updatedAt: new Date() }
          : req
      )
      setQuoteRequests(updatedRequests)

      addNotification({
        title: 'Quote Added',
        message: `Quote from ${getSupplier(quoteForm.supplierId)?.name} has been recorded`,
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

  const handleAddMoreSuppliers = async (newSupplierIds: string[]) => {
    if (!currentUser) return

    setLoading(true)
    try {
      // Use ticket service to properly update the ticket with new quote requests
      await ticketService.requestQuotesFromSuppliers(ticketId, newSupplierIds, currentUser.id)

      // Add new quote requests to our local state
      const newRequests = newSupplierIds.map(supplierId => {
        const supplier = getSupplier(supplierId)
        return {
          id: `${ticketId}-${supplierId}`,
          supplierId,
          supplierName: supplier?.name || 'Unknown',
          supplierEmail: supplier?.email || '',
          specialties: supplier?.specialties || [],
          sentAt: new Date(),
          status: QuoteRequestStatus.PENDING,
          quoteAmount: null,
          notes: null
        } as QuoteRequest
      })

      setQuoteRequests([...quoteRequests, ...newRequests])
      setShowAddSuppliers(false)

      addNotification({
        title: 'Quote Requests Sent',
        message: `Quote requests sent to ${newSupplierIds.length} additional supplier(s)`,
        type: 'success',
        userId: currentUser.id
      })

      onQuotesUpdated()
    } catch (error) {
      console.error('Error requesting quotes from suppliers:', error)
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
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return date.toLocaleDateString()
    }
  }

  const calculateResponseTime = (sentAt: Date, receivedAt?: Date) => {
    const endTime = receivedAt || new Date()
    const hours = Math.round((endTime.getTime() - sentAt.getTime()) / (1000 * 60 * 60))
    
    if (hours < 24) {
      return `${hours}h`
    } else {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
  }

  console.log('🔍 Processing data for render...')
  console.log('  - suppliers length:', suppliers.length)
  console.log('  - quoteRequests length:', quoteRequests.length)
  console.log('  - quoteRequests data:', quoteRequests)
  
  const availableSuppliers = suppliers.filter(supplier => 
    !quoteRequests.some(req => req.supplierId === supplier.id)
  )
  
  console.log('  - availableSuppliers length:', availableSuppliers.length)

  if (!isOpen) {
    console.log('❌ Modal not open, returning null')
    return null
  }

  // Safety check for required props
  if (!ticketId) {
    console.error('QuoteManagementModal: ticketId is required')
    return null
  }
  
  console.log('🎨 Starting render with Modal component...')

  try {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Quote Management"
        description="Track quote requests and manually enter supplier responses"
        size="xl"
      >
      <div className="space-y-6">
        {/* Progress Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{quoteRequests.length}</div>
              <div className="text-sm text-gray-600">Suppliers Contacted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {(() => {
                  console.log('📊 Calculating PENDING count...')
                  try {
                    const pendingCount = quoteRequests.filter(r => {
                      console.log('  - Request status:', r.status, 'Expected:', QuoteRequestStatus.PENDING)
                      return r.status === QuoteRequestStatus.PENDING
                    }).length
                    console.log('  - PENDING count:', pendingCount)
                    return pendingCount
                  } catch (error) {
                    console.error('Error calculating PENDING count:', error)
                    return 0
                  }
                })()}
              </div>
              <div className="text-sm text-gray-600">Awaiting Response</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  console.log('📊 Calculating RECEIVED count...')
                  try {
                    const receivedCount = quoteRequests.filter(r => {
                      console.log('  - Request status:', r.status, 'Expected:', QuoteRequestStatus.RECEIVED)
                      return r.status === QuoteRequestStatus.RECEIVED
                    }).length
                    console.log('  - RECEIVED count:', receivedCount)
                    return receivedCount
                  } catch (error) {
                    console.error('Error calculating RECEIVED count:', error)
                    return 0
                  }
                })()}
              </div>
              <div className="text-sm text-gray-600">Quotes Received</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  console.log('💰 Calculating best price...')
                  try {
                    const quotesWithAmounts = quoteRequests.filter(r => {
                      console.log('  - Request quoteAmount:', r.quoteAmount)
                      return r.quoteAmount && r.quoteAmount > 0
                    })
                    console.log('  - Quotes with amounts:', quotesWithAmounts.length)
                    if (quotesWithAmounts.length > 0) {
                      const amounts = quotesWithAmounts.map(r => r.quoteAmount!)
                      console.log('  - Amounts:', amounts)
                      const minAmount = Math.min(...amounts)
                      console.log('  - Min amount:', minAmount)
                      return formatCurrency(minAmount)
                    }
                    return '—'
                  } catch (error) {
                    console.error('Error calculating best price:', error)
                    return '—'
                  }
                })()}
              </div>
              <div className="text-sm text-gray-600">Best Price</div>
            </div>
          </div>
        </div>

        {/* Supplier Quote Tracking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Quotes</h3>
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

          <div className="grid gap-4">
            {quoteRequests.map((request, index) => {
                try {
                  const supplier = getSupplier(request.supplierId)
                  const isEditing = editingQuote === request.supplierId
                  
                  return (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{request.supplierName}</h4>
                            <p className="text-sm text-gray-600">{supplier?.companyName}</p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </div>
                      </div>

                  {/* Supplier Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{request.supplierEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Sent: {(() => {
                          console.log('  - Formatting sentAt date:', request.sentAt, typeof request.sentAt)
                          try {
                            if (!request.sentAt) {
                              console.log('  - sentAt is null/undefined')
                              return 'Unknown'
                            }
                            // Ensure it's a Date object
                            const date = request.sentAt instanceof Date ? request.sentAt : new Date(request.sentAt)
                            console.log('  - Date object:', date)
                            return formatDate(date)
                          } catch (error) {
                            console.error('  - Error formatting sentAt:', error)
                            return 'Invalid date'
                          }
                        })()}
                      </span>
                    </div>
                    {supplier?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{supplier.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Response time: {(() => {
                          console.log('  - Calculating response time for sentAt:', request.sentAt, 'updatedAt:', request.updatedAt)
                          try {
                            if (!request.sentAt) {
                              console.log('  - sentAt is null/undefined for response time')
                              return 'Unknown'
                            }
                            const sentDate = request.sentAt instanceof Date ? request.sentAt : new Date(request.sentAt)
                            const updatedDate = request.updatedAt ? (request.updatedAt instanceof Date ? request.updatedAt : new Date(request.updatedAt)) : undefined
                            console.log('  - Processed dates for response time calculation')
                            return calculateResponseTime(sentDate, updatedDate)
                          } catch (error) {
                            console.error('  - Error calculating response time:', error)
                            return 'Unknown'
                          }
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Quote Information */}
                  {request.quoteAmount ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-green-800">Quote Received</span>
                          <div className="text-xl font-bold text-green-900">
                            {formatCurrency(request.quoteAmount)}
                          </div>
                          {request.notes && (
                            <p className="text-sm text-green-700 mt-1">{request.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuote(request)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-yellow-800">Awaiting Quote</span>
                          <p className="text-xs text-yellow-600 mt-1">
                            No response received yet
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddQuote(request.supplierId)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Quote
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quote Entry Form */}
                  {isEditing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <h5 className="font-medium text-blue-900">
                        {request.quoteAmount ? 'Edit Quote' : 'Enter Quote Details'}
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quote Amount (£)
                          </label>
                          <input
                            type="number"
                            value={quoteForm.amount}
                            onChange={(e) => setQuoteForm({...quoteForm, amount: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valid Until
                          </label>
                          <input
                            type="date"
                            value={quoteForm.validUntil.toISOString().split('T')[0]}
                            onChange={(e) => setQuoteForm({...quoteForm, validUntil: new Date(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description / Notes
                        </label>
                        <textarea
                          value={quoteForm.description}
                          onChange={(e) => setQuoteForm({...quoteForm, description: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Quote details, timeline, or special conditions..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Terms & Conditions
                        </label>
                        <textarea
                          value={quoteForm.terms}
                          onChange={(e) => setQuoteForm({...quoteForm, terms: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Payment terms, warranties, etc..."
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingQuote(null)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveQuote}
                          disabled={loading}
                          className="flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {loading ? 'Saving...' : 'Save Quote'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                )
                } catch (error) {
                  console.error(`Error rendering request ${index + 1}:`, error)
                  return (
                    <div key={request.id || `error-${index}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <p className="text-red-800">Error rendering quote request</p>
                      <p className="text-sm text-red-600">Supplier: {request.supplierName || 'Unknown'}</p>
                    </div>
                  )
                }
              })}
          </div>
        </div>

        {/* Add Suppliers Modal would go here */}
        {showAddSuppliers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1500]">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add More Suppliers</h3>
              
              {availableSuppliers.length > 0 ? (
                <div className="grid gap-3 max-h-64 overflow-y-auto mb-4">
                  {availableSuppliers.map((supplier) => (
                    <label
                      key={supplier.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{supplier.name}</span>
                          {supplier.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{supplier.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{supplier.companyName}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {supplier.specialties.slice(0, 3).map((specialty) => (
                            <span
                              key={specialty}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-600">All available suppliers have already been contacted for quotes.</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddSuppliers(false)
                      setSelectedSuppliers([]) // Reset selection when canceling
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedSuppliers.length > 0) {
                        handleAddMoreSuppliers(selectedSuppliers)
                        setSelectedSuppliers([]) // Reset selection after sending
                      }
                    }}
                    disabled={selectedSuppliers.length === 0 || loading}
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

        {/* No Requests */}
        {quoteRequests.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quote Requests</h3>
            <p className="text-gray-600">
              Start by requesting quotes from suppliers for this ticket.
            </p>
          </div>
        )}
        {/* Footer */}
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {quoteRequests.some(r => r.quoteAmount) && (
            <Button
              onClick={() => {
                onClose()
                // This would open the quote comparison modal
              }}
              className="flex items-center"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Compare Quotes ({quoteRequests.filter(r => r.quoteAmount).length})
            </Button>
          )}
        </ModalFooter>
      </div>
    </Modal>
    )
  } catch (error) {
    console.error('Error rendering QuoteManagementModal:', error)
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Error"
        size="md"
      >
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">Unable to load the quote management interface.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    )
  }
}

export default QuoteManagementModal
