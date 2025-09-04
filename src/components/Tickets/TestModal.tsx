import React from 'react'

interface TestModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  quoteRequests: any[]
  onQuotesUpdated: () => void
}

const TestModal = ({ isOpen, onClose, ticketId }: TestModalProps) => {
  console.log('TestModal render - isOpen:', isOpen, 'ticketId:', ticketId)
  
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 1400 }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Test Modal</h2>
        <p className="text-gray-600 mb-4">Ticket ID: {ticketId}</p>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default TestModal
