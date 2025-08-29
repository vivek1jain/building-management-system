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
  Award,
  Calendar,
  Paperclip,
  Upload,
  FileText
} from 'lucide-react'
import { Supplier, QuoteRequest, QuoteRequestStatus } from '../../types'
import { supplierService } from '../../services/supplierService'
import { ticketService } from '../../services/ticketService'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'
import SupplierSelectionModal from '../Suppliers/SupplierSelectionModal'

interface QuoteManagementModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  quoteRequests: QuoteRequest[]
  onQuotesUpdated: () => void
}

interface QuoteEntry {
  supplierId: string
  amount: string
  description: string
  validUntil?: Date
  quoteFile?: File
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
    amount: '',
    description: ''
  })
  const [selectedWinnerQuoteId, setSelectedWinnerQuoteId] = useState<string | null>(null)
  const [selectingWinner, setSelectingWinner] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      setQuoteRequests(initialQuoteRequests)
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
      amount: '',
      description: ''
    })
    setEditingQuote(supplierId)
  }

  const handleEditQuote = (request: QuoteRequest) => {
    setQuoteForm({
      supplierId: request.supplierId,
      amount: request.quoteAmount ? request.quoteAmount.toString() : '',
      description: request.notes || '',
      validUntil: request.validUntil
    })
    setEditingQuote(request.supplierId)
  }

  const handleSaveQuote = async () => {
    if (!currentUser) return

    const amount = parseFloat(quoteForm.amount)
    if (isNaN(amount) || amount <= 0) {
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
        amount: amount,
        description: quoteForm.description,
        terms: '', // Add default empty terms since it's required by the service method
        validUntil: quoteForm.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days from now if not specified
      }, currentUser.id)

      // Update the quote request status
      const updatedRequests = quoteRequests.map(req => 
        req.supplierId === quoteForm.supplierId
          ? { ...req, status: QuoteRequestStatus.RECEIVED, quoteAmount: amount, updatedAt: new Date() }
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


  const handleSelectWinner = async () => {
    if (!selectedWinnerQuoteId) {
      addNotification({
        title: 'No Quote Selected',
        message: 'Please select a quote to proceed.',
        type: 'warning',
        userId: currentUser?.id || ''
      })
      return
    }

    setSelectingWinner(true)
    try {
      // Find the corresponding quote request to get the supplier ID
      const selectedRequest = quoteRequests.find(req => req.id === selectedWinnerQuoteId)
      if (!selectedRequest) {
        throw new Error('Selected quote request not found')
      }

      // Use the existing ticketService method
      await ticketService.selectWinningQuote(ticketId, selectedRequest.supplierId, currentUser?.id || '')
      
      addNotification({
        title: 'Quote Selected',
        message: 'Winning quote selected successfully. The ticket will now move to scheduling.',
        type: 'success',
        userId: currentUser?.id || ''
      })

      // Update the local state to reflect the selected winner
      const updatedRequests = quoteRequests.map(req => 
        req.id === selectedWinnerQuoteId
          ? { ...req, status: QuoteRequestStatus.ACCEPTED }
          : req
      )
      setQuoteRequests(updatedRequests)
      
      onQuotesUpdated()
      onClose()
    } catch (error) {
      console.error('Failed to select winning quote:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to select winning quote. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setSelectingWinner(false)
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
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-neutral-900">{quoteRequests.length}</div>
              <div className="text-xs text-neutral-600">Suppliers Contacted</div>
            </div>
            <div>
              <div className="text-xl font-bold text-warning-600">
                {quoteRequests.filter(r => r.status === QuoteRequestStatus.PENDING).length}
              </div>
              <div className="text-xs text-neutral-600">Awaiting Response</div>
            </div>
            <div>
              <div className="text-xl font-bold text-primary-600">
                {quoteRequests.filter(r => r.status === QuoteRequestStatus.RECEIVED).length}
              </div>
              <div className="text-xs text-neutral-600">Quotes Received</div>
            </div>
            <div>
              <div className="text-xl font-bold text-primary-600">
                {(() => {
                  try {
                    const quotesWithAmounts = quoteRequests.filter(r => r.quoteAmount && r.quoteAmount > 0)
                    if (quotesWithAmounts.length > 0) {
                      const amounts = quotesWithAmounts.map(r => r.quoteAmount).filter(Boolean) as number[]
                      if (amounts.length > 0) {
                        const minAmount = Math.min(...amounts)
                        return formatCurrency(minAmount)
                      }
                    }
                    return '—'
                  } catch (error) {
                    console.error('Error calculating best price:', error)
                    return '—'
                  }
                })()}
              </div>
              <div className="text-xs text-neutral-600">Best Price</div>
            </div>
          </div>
        </div>

        {/* Supplier Quote Tracking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Quotes</h3>
            <Button
              variant="primary"
              onClick={() => setShowAddSuppliers(true)}
            >
              Add Suppliers
            </Button>
          </div>

          <div className="grid gap-4">
            {quoteRequests.map((request, index) => {
                try {
                  const supplier = getSupplier(request.supplierId)
                  const isEditing = editingQuote === request.supplierId
                  const hasQuoteAmount = request.quoteAmount && request.quoteAmount > 0
                  const isSelected = selectedWinnerQuoteId === request.id
                  
                  // Calculate isLowest safely
                  let isLowest = false
                  if (hasQuoteAmount) {
                    try {
                      const quotesWithAmounts = quoteRequests.filter(r => r.quoteAmount && r.quoteAmount > 0)
                      if (quotesWithAmounts.length > 1) {
                        const amounts = quotesWithAmounts.map(r => r.quoteAmount).filter(Boolean) as number[]
                        if (amounts.length > 0) {
                          const minAmount = Math.min(...amounts)
                          isLowest = request.quoteAmount === minAmount
                        }
                      }
                    } catch (error) {
                      console.error('Error calculating isLowest:', error)
                      isLowest = false
                    }
                  }
                  
                  return (
                    <div
                      key={request.id}
                      className={`border-2 rounded-lg p-4 transition-all duration-200 relative ${
                        hasQuoteAmount
                          ? isSelected
                            ? 'border-success-500 bg-success-50 cursor-pointer'
                            : isLowest
                            ? 'border-success-200 bg-success-25 hover:border-success-300 cursor-pointer'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm cursor-pointer'
                          : 'border-neutral-200 bg-white hover:shadow-sm'
                      }`}
                      onClick={hasQuoteAmount ? () => setSelectedWinnerQuoteId(request.id) : undefined}
                    >
                      {/* Best Price Badge */}
                      {isLowest && hasQuoteAmount && (
                        <div className="absolute -top-2 -right-2 bg-success-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <Award className="h-3 w-3 mr-1" />
                          Best
                        </div>
                      )}

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 truncate">{request.supplierName || 'Unknown Supplier'}</h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          Date Received: {request.sentAt ? formatDate(request.sentAt) : 'Unknown date'}
                        </p>
                      </div>
                        
                        {/* Always present price area for alignment */}
                        <div className="flex-1 text-center px-4">
                          {request.quoteAmount && (
                            <div className="text-lg font-bold text-neutral-900">
                              {formatCurrency(request.quoteAmount)}
                            </div>
                          )}
                        </div>
                        
                        {/* Right-aligned Status and Action Buttons - side by side layout */}
                        <div className="flex items-center space-x-3 pr-10">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)} border`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </div>
                          {request.quoteAmount ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditQuote(request)
                              }}
                              className="text-xs"
                            >
                              Edit
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddQuote(request.supplierId)
                              }}
                              className="text-xs"
                            >
                              Add Quote
                            </Button>
                          )}
                        </div>
                      </div>

                  {/* Quote Entry Form */}
                  {isEditing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <h5 className="font-medium text-blue-900">
                        Quote Details
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quote Amount (£) *
                          </label>
                          <input
                            type="text"
                            value={quoteForm.amount}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '')
                              setQuoteForm({...quoteForm, amount: value})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valid Until
                          </label>
                          <input
                            type="date"
                            value={quoteForm.validUntil ? quoteForm.validUntil.toISOString().split('T')[0] : ''}
                            onChange={(e) => setQuoteForm({
                              ...quoteForm, 
                              validUntil: e.target.value ? new Date(e.target.value) : undefined
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            Quote Document
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                setQuoteForm({...quoteForm, quoteFile: file})
                              }}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <div className="absolute right-2 top-2 pointer-events-none">
                              <Paperclip className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          {quoteForm.quoteFile && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>{quoteForm.quoteFile.name}</span>
                              <button
                                type="button"
                                onClick={() => setQuoteForm({...quoteForm, quoteFile: undefined})}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
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
                        >
                          {loading ? 'Saving...' : 'Save'}
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


        {/* Add Suppliers Modal - Using SupplierSelectionModal */}
        <SupplierSelectionModal
          isOpen={showAddSuppliers}
          onClose={() => setShowAddSuppliers(false)}
          ticketId={ticketId}
          excludeSupplierIds={quoteRequests.map(req => req.supplierId)}
          onQuotesRequested={() => {
            setShowAddSuppliers(false)
            onQuotesUpdated()
          }}
        />

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
          {quoteRequests.filter(r => r.quoteAmount && r.quoteAmount > 0).length > 1 && (
            <Button
              onClick={handleSelectWinner}
              disabled={!selectedWinnerQuoteId || selectingWinner}
              className="flex items-center"
            >
              {selectingWinner ? 'Selecting...' : 'Select'}
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
