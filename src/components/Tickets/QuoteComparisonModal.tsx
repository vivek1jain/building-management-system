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
import ScheduleModal from '../Scheduling/ScheduleModal'

interface QuoteComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  quotes: EnhancedQuote[]
  onQuoteSelected: (quoteId: string) => void
  ticket?: any // For scheduling integration
}

const QuoteComparisonModal = ({
  isOpen,
  onClose,
  ticketId,
  quotes,
  onQuoteSelected,
  ticket
}: QuoteComparisonModalProps) => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  useEffect(() => {
    if (isOpen && quotes.length > 0) {
      loadSuppliers()
      // Set the initially selected quote if there's a winner
      const winnerQuote = quotes.find(q => q.status === 'accepted' || q.isWinner === true)
      console.log('🎯 Setting initial selection:', { winnerQuote, selectedId: winnerQuote?.id })
      if (winnerQuote) {
        setSelectedQuoteId(winnerQuote.id)
      }
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
  const hasWinner = quotes.some(q => q.status === 'accepted' || q.isWinner === true)
  const winnerQuote = quotes.find(q => q.status === 'accepted' || q.isWinner === true)
  
  // Debug logging
  console.log('🔍 Quote states debug:', {
    quotesCount: quotes.length,
    hasWinner,
    winnerQuote: winnerQuote ? { id: winnerQuote.id, status: winnerQuote.status, isWinner: winnerQuote.isWinner, supplierName: winnerQuote.supplierName } : null,
    allQuoteStates: quotes.map(q => ({ id: q.id, status: q.status, isWinner: q.isWinner, supplierName: q.supplierName }))
  })
  
  // Log individual quote details
  quotes.forEach((quote, index) => {
    console.log(`🔍 Quote ${index + 1} details:`, {
      id: quote.id,
      supplierName: quote.supplierName,
      status: quote.status,
      statusType: typeof quote.status,
      statusCheck: quote.status === 'accepted',
      isWinner: quote.isWinner,
      isWinnerType: typeof quote.isWinner,
      isWinnerCheck: quote.isWinner === true,
      allProperties: Object.keys(quote)
    })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Quotes"
      description="Review and select the best quote for this ticket"
      size="md"
    >
      <div className="space-y-4">
        {/* Compact Summary Bar */}
        <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-neutral-900">{quotes.length}</div>
              <div className="text-xs text-neutral-600">Quotes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success-600">
                {formatCurrency(Math.min(...quotes.map(q => q.amount)))}
              </div>
              <div className="text-xs text-neutral-600">Lowest</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(Math.max(...quotes.map(q => q.amount)))}
              </div>
              <div className="text-xs text-neutral-600">Highest</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary-600">
                {formatCurrency(quotes.reduce((sum, q) => sum + q.amount, 0) / quotes.length)}
              </div>
              <div className="text-xs text-neutral-600">Average</div>
            </div>
          </div>
        </div>

        {/* Compact Quote Cards */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedQuotes.map((quote, index) => {
            const supplier = getSupplierInfo(quote.supplierId)
            const isLowest = quote.amount === Math.min(...quotes.map(q => q.amount))
            const isSelected = selectedQuoteId === quote.id
            
            return (
              <div
                key={quote.id}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-success-500 bg-success-50'
                    : isLowest
                    ? 'border-success-200 bg-success-25'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
                onClick={() => setSelectedQuoteId(quote.id)}
              >
                {/* Best Price Badge */}
                {isLowest && (
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

                <div className="flex items-center justify-between pr-10">
                  {/* Left: Supplier Info */}
                  <div className="flex items-center space-x-2 flex-1 min-w-0 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="font-semibold text-neutral-900 truncate">{quote.supplierName}</h3>
                      <div className="flex items-center mt-1 overflow-hidden">
                        {supplier?.rating && (
                          <>
                            <div className="flex items-center space-x-0.5 flex-shrink-0">
                              {renderStars(supplier.rating)}
                            </div>
                            <span className="text-xs text-neutral-600 ml-1 flex-shrink-0">
                              ({supplier.rating})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Validity (stacked) */}
                  <div className="text-right flex-shrink-0 w-28 overflow-hidden">
                    <div className="text-base font-bold text-neutral-900 mb-1 truncate">
                      {formatCurrency(quote.amount)}
                    </div>
                    <div className="flex items-center justify-end text-xs text-neutral-600">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{new Date(quote.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
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
          <>
            <Button
              onClick={handleSelectWinner}
              disabled={!selectedQuoteId || selecting}
              className="flex items-center"
            >
              {selecting ? 'Selecting...' : hasWinner ? 'Edit Selection' : 'Select Winner'}
            </Button>
            {hasWinner && winnerQuote && (
              <Button
                onClick={() => setShowScheduleModal(true)}
                variant="primary"
                className="flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            )}
          </>
        )}
      </ModalFooter>
      
      {/* Schedule Modal */}
      {ticket && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          ticket={ticket}
          onScheduled={(event, supplierInfo) => {
            const message = supplierInfo 
              ? `Work scheduled with ${supplierInfo.supplier.name} for ${event.startDate.toLocaleDateString()}`
              : `Work scheduled for ${event.startDate.toLocaleDateString()}`
            
            addNotification({
              title: 'Work Scheduled',
              message,
              type: 'success',
              userId: currentUser?.id || ''
            })
            setShowScheduleModal(false)
            onClose() // Close the quote comparison modal too
          }}
          allowDirectScheduling={true}
        />
      )}
    </Modal>
  )
}

export default QuoteComparisonModal
