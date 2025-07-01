import React, { useState } from 'react'
import { 
  // DollarSign, 
  User, 
  Star, 
  CheckCircle, 
  X,
  Filter,
  SortAsc,
  SortDesc,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { Quote, Supplier } from '../../types'

interface QuoteComparisonProps {
  quotes: Quote[]
  suppliers: Supplier[]
  onSelectQuote: (quoteId: string) => void
  onRequestRevision: (quoteId: string) => void
  onDeclineQuote: (quoteId: string) => void
  selectedQuoteId?: string
}

const QuoteComparison: React.FC<QuoteComparisonProps> = ({
  quotes,
  suppliers,
  onSelectQuote,
  onRequestRevision,
  onDeclineQuote,
  selectedQuoteId
}) => {
  const [sortBy, setSortBy] = useState<'amount' | 'submittedAt' | 'validUntil'>('amount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')

  const getSupplierById = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)
  }

  const filteredQuotes = quotes
    .filter(quote => filterStatus === 'all' || quote.status === filterStatus)
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'submittedAt':
          aValue = a.submittedAt.getTime()
          bValue = b.submittedAt.getTime()
          break
        case 'validUntil':
          aValue = a.validUntil.getTime()
          bValue = b.validUntil.getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'declined': return <X className="h-4 w-4" />
      case 'expired': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const isExpired = (validUntil: Date) => {
    return new Date() > validUntil
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quote Comparison</h2>
          <p className="text-gray-600 mt-1">
            Compare quotes and select the best option for your project
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select"
            >
              <option value="amount">Amount</option>
              <option value="submittedAt">Submission Date</option>
              <option value="validUntil">Valid Until</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary flex items-center space-x-2 w-full justify-center"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              <span>{sortOrder === 'asc' ? 'Low to High' : 'High to Low'}</span>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSortBy('amount')
                setSortOrder('asc')
                setFilterStatus('all')
              }}
              className="btn-secondary flex items-center space-x-2 w-full justify-center"
            >
              <Filter className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQuotes.map((quote) => {
          const supplier = getSupplierById(quote.supplierId)
          const expired = isExpired(quote.validUntil)
          
          return (
            <div
              key={quote.id}
              className={`card transition-all duration-200 ${
                selectedQuoteId === quote.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-apple-lg'
              } ${expired ? 'opacity-75' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{supplier?.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{supplier?.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {expired && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expired
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusIcon(quote.status)}
                    <span className="ml-1 capitalize">{quote.status}</span>
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(quote.amount, quote.currency)}
                  </span>
                  <span className="text-sm text-gray-600">total</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{quote.description}</p>
              </div>

              {/* Terms */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Terms</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{quote.terms}</p>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="text-gray-900">{formatDate(quote.submittedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className={`${expired ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(quote.validUntil)}
                  </span>
                </div>
              </div>

              {/* Supplier Rating */}
              {supplier?.rating && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(supplier.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({supplier.rating}) • {supplier.totalJobs} jobs
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {quote.status === 'pending' && !expired && (
                  <>
                    <button
                      onClick={() => onSelectQuote(quote.id)}
                      className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Select</span>
                    </button>
                    <button
                      onClick={() => onRequestRevision(quote.id)}
                      className="btn-secondary flex items-center justify-center px-3"
                      title="Request Revision"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeclineQuote(quote.id)}
                      className="btn-secondary flex items-center justify-center px-3"
                      title="Decline Quote"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
                {quote.status === 'accepted' && (
                  <div className="w-full text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Selected
                    </span>
                  </div>
                )}
                {quote.status === 'declined' && (
                  <div className="w-full text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <X className="h-4 w-4 mr-1" />
                      Declined
                    </span>
                  </div>
                )}
                {expired && (
                  <div className="w-full text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Expired
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
          <p className="text-gray-600">Try adjusting your filters or request quotes from suppliers</p>
        </div>
      )}
    </div>
  )
}

export default QuoteComparison 