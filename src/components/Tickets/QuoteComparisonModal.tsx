import { useState, useEffect } from 'react'
import {
  Award,
  Clock,
  Mail,
  Phone,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  AlertCircle,
  Zap,
  User
} from 'lucide-react'
import { EnhancedQuote, QuoteRequestStatus, Supplier } from '../../types'
import { supplierService } from '../../services/supplierService'
import { ticketService } from '../../services/ticketService'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import Modal, { ModalFooter } from '../UI/Modal'
import Button from '../UI/Button'

interface QuoteComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  quotes: EnhancedQuote[]
  onQuoteSelected: (quoteId: string) => void
}

const QuoteComparisonModal = ({
  isOpen,
  onClose,
  ticketId,
  quotes,
  onQuoteSelected
}: QuoteComparisonModalProps) => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    if (isOpen && quotes.length > 0) {
      loadSuppliers()
    }
  }, [isOpen, quotes])

  const loadSuppliers = async () => {
    try {
      const suppliersData = await supplierService.getSuppliers()
      setSuppliers(suppliersData)
    } catch (error) {
      console.warn('Could not load suppliers for comparison')
    }
  }

  const getSupplierInfo = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)
  }

  const handleSelectWinner = async () => {
    if (!selectedQuoteId) {
      addNotification({
        title: 'No Quote Selected',
        message: 'Please select a quote to proceed.',
        type: 'warning',
        userId: currentUser?.id || ''
      })
      return
    }

    setSelecting(true)
    try {
      await ticketService.selectWinningQuote(ticketId, selectedQuoteId, currentUser?.id || '')
      
      addNotification({
        title: 'Quote Selected',
        message: 'Winning quote selected and notifications sent to suppliers.',
        type: 'success',
        userId: currentUser?.id || ''
      })

      onQuoteSelected(selectedQuoteId)
      onClose()
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to select winning quote. Please try again.',
        type: 'error',
        userId: currentUser?.id || ''
      })
    } finally {
      setSelecting(false)
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
      dateStyle: 'medium'
    }).format(date)
  }

  const calculateResponseTime = (quote: EnhancedQuote) => {
    if (!quote.responseReceivedAt) return 'No response yet'
    
    const sentAt = new Date(quote.submittedAt).getTime()
    const receivedAt = new Date(quote.responseReceivedAt).getTime()
    
    // Check for invalid dates
    if (isNaN(sentAt) || isNaN(receivedAt)) {
      return 'Response time unavailable'
    }
    
    const hours = Math.round((receivedAt - sentAt) / (1000 * 60 * 60))
    
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (!isOpen) return null

  const sortedQuotes = [...quotes].sort((a, b) => a.amount - b.amount)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Quotes"
      description="Review and select the best quote for this ticket"
      size="full"
    >
      <div className="space-y-6">
        {/* Summary Bar */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{quotes.length}</div>
              <div className="text-sm text-gray-600">Quotes Received</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.min(...quotes.map(q => q.amount)))}
              </div>
              <div className="text-sm text-gray-600">Lowest Price</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(Math.max(...quotes.map(q => q.amount)))}
              </div>
              <div className="text-sm text-gray-600">Highest Price</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(quotes.reduce((sum, q) => sum + q.amount, 0) / quotes.length)}
              </div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
          </div>
        </div>

        {/* Quote Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
          {sortedQuotes.map((quote, index) => {
            const supplier = getSupplierInfo(quote.supplierId)
            const isLowest = quote.amount === Math.min(...quotes.map(q => q.amount))
            const isSelected = selectedQuoteId === quote.id
            
            return (
              <div
                key={quote.id}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : isLowest
                    ? 'border-green-200 bg-green-25'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedQuoteId(quote.id)}
              >
                {/* Best Price Badge */}
                {isLowest && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Award className="h-3 w-3 mr-1" />
                    Best Price
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                )}

                {/* Supplier Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{quote.supplierName}</h3>
                    <div className="flex items-center space-x-1">
                      {supplier?.rating && renderStars(supplier.rating)}
                      <span className="text-sm text-gray-600 ml-1">
                        {supplier?.rating ? `(${supplier.rating})` : 'No rating'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quote Details */}
                <div className="space-y-4">
                  {/* Price */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(quote.amount)}
                    </div>
                    <div className="text-sm text-gray-600">{quote.currency} Total</div>
                  </div>

                  {/* Key Details */}
                  <div className="space-y-2 text-sm">
                    {quote.estimatedDuration && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{quote.estimatedDuration}</span>
                      </div>
                    )}

                    {quote.warranty && (
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Warranty:</span>
                        <span className="font-medium">{quote.warranty}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Valid until:</span>
                      <span className="font-medium">{formatDate(quote.validUntil)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Response time:</span>
                      <span className="font-medium">{calculateResponseTime(quote)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{quote.description}</p>
                  </div>

                  {/* Terms Preview */}
                  {quote.terms && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{quote.terms}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {quote.attachments && quote.attachments.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <FileText className="h-4 w-4" />
                      <span>{quote.attachments.length} attachment(s)</span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{quote.supplierEmail}</span>
                    </div>
                    {supplier?.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{supplier.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Quotes Message */}
        {quotes.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quotes Received</h3>
            <p className="text-gray-600">
              Quotes will appear here as suppliers respond to your request.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {quotes.length > 0 && (
          <Button
            onClick={handleSelectWinner}
            disabled={!selectedQuoteId || selecting}
            className="flex items-center"
          >
            <Award className="h-4 w-4 mr-2" />
            {selecting ? 'Selecting...' : 'Select Winner & Proceed'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default QuoteComparisonModal
