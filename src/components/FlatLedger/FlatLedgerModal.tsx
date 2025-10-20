import React from 'react'
import { X } from 'lucide-react'
import { FlatLedgerView } from './FlatLedgerView'

interface FlatLedgerModalProps {
  isOpen: boolean
  onClose: () => void
  flatId: string
  buildingId: string
  flatNumber: string
  residentName: string
}

export const FlatLedgerModal: React.FC<FlatLedgerModalProps> = ({
  isOpen,
  onClose,
  flatId,
  buildingId,
  flatNumber,
  residentName
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Flat Ledger - {flatNumber}
              </h3>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <FlatLedgerView
              flatId={flatId}
              buildingId={buildingId}
              flatNumber={flatNumber}
              residentName={residentName}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
