import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'

const FlatsDataTableSimple: React.FC = () => {
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initialization
    console.log('FlatsDataTableSimple: Starting initialization')
    setLoading(false)
    console.log('FlatsDataTableSimple: Initialization complete')
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Flats Management - Simple</h2>
          <p className="text-sm text-gray-600">Testing simplified version</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded border">
        <p>Current user: {currentUser?.name || 'No user'}</p>
        <p>This simplified version loaded successfully!</p>
        <p>Now we know the issue is not with basic hooks or rendering.</p>
      </div>
    </div>
  )
}

export default FlatsDataTableSimple
