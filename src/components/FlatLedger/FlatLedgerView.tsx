import { 
  Calendar, 
  Filter, 
  Download, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Search,
  RefreshCw
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { flatLedgerService } from '../../services/flatLedgerService'
import { 
  FlatLedgerTransaction,
  FlatLedgerSummary,
  FlatLedgerFilter,
  FlatLedgerTransactionType,
  FlatLedgerTransactionStatus,
  FlatLedgerReport
} from '../../types'

interface FlatLedgerViewProps {
  flatId: string
  buildingId: string
  flatNumber: string
  residentName: string
  onClose?: () => void
}

export const FlatLedgerView: React.FC<FlatLedgerViewProps> = ({
  flatId,
  buildingId,
  flatNumber,
  residentName,
  onClose
}) => {
  const [transactions, setTransactions] = useState<FlatLedgerTransaction[]>([])
  const [summary, setSummary] = useState<FlatLedgerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FlatLedgerFilter>({
    includeReversed: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<FlatLedgerTransaction | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    loadLedgerData()
  }, [flatId, filter])

  const loadLedgerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [transactionsData, summaryData] = await Promise.all([
        flatLedgerService.getFlatLedgerTransactions(flatId, filter),
        flatLedgerService.generateFlatLedgerSummary(flatId, buildingId, flatNumber, residentName)
      ])

      setTransactions(transactionsData)
      setSummary(summaryData)
    } catch (err) {
      console.error('Error loading ledger data:', err)
      setError('Failed to load ledger data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (text: string) => {
    setSearchText(text)
    setFilter(prev => ({ ...prev, searchText: text }))
  }

  const handleFilterChange = (newFilter: Partial<FlatLedgerFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
  }

  const generateReport = async () => {
    try {
      setGeneratingReport(true)
      const dateFrom = filter.dateFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
      const dateTo = filter.dateTo || new Date()
      
      const report = await flatLedgerService.generateFlatLedgerReport(
        flatId,
        buildingId,
        flatNumber,
        residentName,
        dateFrom,
        dateTo,
        'current-user' // This should come from auth context
      )

      // Download report as JSON (could be enhanced to PDF)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flat-${flatNumber}-ledger-report-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }


  const getTransactionIcon = (type: FlatLedgerTransactionType) => {
    switch (type) {
      case FlatLedgerTransactionType.SERVICE_CHARGE_DEMAND:
      case FlatLedgerTransactionType.GROUND_RENT_DEMAND:
        return <FileText className="h-4 w-4 text-blue-600" />
      case FlatLedgerTransactionType.PAYMENT:
        return <CreditCard className="h-4 w-4 text-green-600" />
      case FlatLedgerTransactionType.CREDIT_APPLICATION:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case FlatLedgerTransactionType.PENALTY:
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: FlatLedgerTransactionStatus) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full"
    
    switch (status) {
      case FlatLedgerTransactionStatus.PROCESSED:
        return `${baseClasses} bg-green-100 text-green-800`
      case FlatLedgerTransactionStatus.PENDING:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case FlatLedgerTransactionStatus.CANCELLED:
        return `${baseClasses} bg-gray-100 text-gray-800`
      case FlatLedgerTransactionStatus.REVERSED:
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading ledger data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button 
          onClick={loadLedgerData}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Flat {flatNumber} Ledger
            </h2>
            <p className="text-sm text-gray-600">{residentName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </button>
            <button
              onClick={generateReport}
              disabled={generatingReport}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              {generatingReport ? 'Generating...' : 'Report'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Balance</p>
                  <p className={`text-lg font-semibold ${
                    summary.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summary.currentBalance)}
                  </p>
                </div>
                {summary.currentBalance >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Demands</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(summary.totalDemands)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(summary.totalPayments)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Score</p>
                  <p className={`text-lg font-semibold ${
                    summary.paymentReliabilityScore >= 75 ? 'text-green-600' : 
                    summary.paymentReliabilityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {summary.paymentReliabilityScore}%
                  </p>
                </div>
                <CheckCircle className={`h-8 w-8 ${
                  summary.paymentReliabilityScore >= 75 ? 'text-green-600' : 
                  summary.paymentReliabilityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>

          {summary.overdueAmount > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">
                  Overdue Amount: {formatCurrency(summary.overdueAmount)} 
                  ({summary.overdueCount} items, {summary.daysOverdue} days overdue)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search transactions..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filter.dateFrom?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange({
                  dateFrom: e.target.value ? new Date(e.target.value) : undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filter.dateTo?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange({
                  dateTo: e.target.value ? new Date(e.target.value) : undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="px-6 py-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {transaction.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      {transaction.quarter && (
                        <p className="text-xs text-gray-500">{transaction.quarter}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {transaction.debitAmount > 0 ? formatCurrency(transaction.debitAmount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {transaction.creditAmount > 0 ? formatCurrency(transaction.creditAmount) : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.runningBalance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(transaction.status)}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No transactions exist for this flat yet. Transactions will appear automatically when service charge demands are created and payments are recorded.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedTransaction.type.replace(/_/g, ' ')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.reference}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Debit</label>
                    <p className="text-sm text-red-600">
                      {formatCurrency(selectedTransaction.debitAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Credit</label>
                    <p className="text-sm text-green-600">
                      {formatCurrency(selectedTransaction.creditAmount)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Running Balance</label>
                  <p className={`text-sm font-medium ${
                    selectedTransaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(selectedTransaction.runningBalance)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedTransaction.transactionDate)}
                  </p>
                </div>
                
                {selectedTransaction.dueDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedTransaction.dueDate)}
                    </p>
                  </div>
                )}
                
                {selectedTransaction.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
