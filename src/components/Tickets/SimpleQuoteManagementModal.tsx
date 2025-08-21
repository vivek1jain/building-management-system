import React from 'react'
import { X } from 'lucide-react'
import { QuoteRequest } from '../../types'

interface SimpleQuoteManagementModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  quoteRequests: QuoteRequest[]
  onQuotesUpdated: () => void
}

const SimpleQuoteManagementModal = ({
  isOpen,
  onClose,
  ticketId,
  quoteRequests,
  onQuotesUpdated
}: SimpleQuoteManagementModalProps) => {
  console.log('SimpleQuoteManagementModal render:', { isOpen, ticketId, quoteRequests })
  
  if (!isOpen) {
    console.log('Modal not open, returning null')
    return null
  }

  // Safety checks
  if (!ticketId) {
    console.error('SimpleQuoteManagementModal: ticketId is required')
    return null
  }

  console.log('Processing quote requests:', quoteRequests)
  const safeQuoteRequests = Array.isArray(quoteRequests) ? quoteRequests : []
  console.log('Safe quote requests:', safeQuoteRequests)

  try {
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1400] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quote Management</h2>
            <p className="text-sm text-gray-600 mt-1">Track quote requests and responses</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-600">
                Ticket ID: {ticketId}
              </p>
              <p className="text-gray-600">
                Quote Requests: {safeQuoteRequests.length}
              </p>
            </div>

            {safeQuoteRequests.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Quote Requests</h3>
                {safeQuoteRequests.map((request) => (
                  <div key={request.id || `request-${request.supplierId}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.supplierName || 'Unknown Supplier'}</h4>
                        <p className="text-sm text-gray-600">{request.supplierEmail || 'No email'}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {request.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No quote requests found</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    )
  } catch (error) {
    console.error('Error rendering SimpleQuoteManagementModal:', error)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1400] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">Unable to load the quote management interface.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default SimpleQuoteManagementModal
