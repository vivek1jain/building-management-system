import React from 'react'
import { X } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'

const NotificationList: React.FC = () => {
  const { notifications, removeNotification, isDropdownOpen } = useNotifications()

  // Hide the fixed notification list when dropdown is open
  if (notifications.length === 0 || isDropdownOpen) return null

  const handleDismiss = (id: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    removeNotification(id)
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm" data-testid="notification-list">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`shadow-lg rounded-lg px-4 py-3 flex items-start space-x-3 bg-white border-l-4 transition-all duration-300 hover:shadow-xl ${
            n.type === 'success' 
              ? 'border-green-500' 
              : n.type === 'error' 
              ? 'border-red-500' 
              : n.type === 'warning'
              ? 'border-yellow-500'
              : 'border-blue-500'
          }`}
          data-testid="notification-item"
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-neutral-900 truncate">{n.title}</div>
            <div className="text-sm text-neutral-700 mt-1 break-words">{n.message}</div>
          </div>
          <button
            className="ml-2 p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors duration-200 flex-shrink-0"
            onClick={(e) => handleDismiss(n.id, e)}
            aria-label="Dismiss notification"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default NotificationList