import { Trash2, AlertTriangle } from 'lucide-react'
import React, { useState } from 'react'

interface DeleteAllTicketsButtonProps {
  onTicketsDeleted?: () => void
}

// Dynamic import to avoid bundling issues
const deleteAllTickets = async () => {
  try {
    const { deleteAllTickets: deleteFunction } = await import('../../utils/deleteAllTickets')
    return await deleteFunction()
  } catch (error) {
    console.error('Failed to import or execute deleteAllTickets:', error)
    throw error
  }
}

export const DeleteAllTicketsButton: React.FC<DeleteAllTicketsButtonProps> = ({ onTicketsDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      await deleteAllTickets()
      setShowConfirm(false)
      if (onTicketsDeleted) {
        onTicketsDeleted()
      }
    } catch (error) {
      console.error('❌ Failed to delete tickets:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete All Tickets
      </button>
    )
  }

  return (
    <div className="inline-flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <span className="text-sm text-red-800 font-medium">
        Delete ALL tickets permanently?
      </span>
      <div className="flex space-x-2">
        <button
          onClick={handleDeleteAll}
          disabled={isDeleting}
          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default DeleteAllTicketsButton
